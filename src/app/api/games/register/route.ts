import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureDefaultGameProviders } from "@/lib/games/service";
import { addPlayerGameAccount } from "@/lib/games/client";
import { getGameStatusDescription } from "@/lib/games/statusCodes";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in first" }, { status: 401 });
    }

    await ensureDefaultGameProviders();

    const body = await req.json();
    const { gameKey, requestedUsername, password } = body;

    if (!gameKey) {
      return NextResponse.json({ error: "gameKey is required" }, { status: 400 });
    }

    const provider = await prisma.gameProviderConfig.findUnique({
      where: { gameKey },
    });

    if (!provider) {
      return NextResponse.json({ error: "Unsupported game provider" }, { status: 404 });
    }

    if (!provider.isEnabled) {
      return NextResponse.json({ error: `${provider.displayName} is currently disabled` }, { status: 400 });
    }

    // 1. Prepare and validate account login name (format: letters, numbers, underscore only)
    let finalAccount = requestedUsername ? requestedUsername.trim() : "";
    if (!finalAccount) {
      // Auto-generate based on username: e.g. kali_victor_123
      const cleanPrefix = user.username.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 8);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      finalAccount = `kali_${cleanPrefix}_${randSuffix}`;
    }

    // Provider requirement: Section 3.1 Code 18
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(finalAccount)) {
      return NextResponse.json(
        {
          error: "Username must be 3-24 characters and only contain letters, numbers, and underscores.",
        },
        { status: 400 }
      );
    }

    // 2. Prepare and validate password
    let finalPassword = password ? password.trim() : "";
    if (!finalPassword) {
      finalPassword = "Kali" + Math.floor(100000 + Math.random() * 900000);
    }

    // Provider requirement: Section 3.1 Code 23
    if (finalPassword.length < 6 || finalPassword.length > 32) {
      return NextResponse.json(
        { error: "Password must be between 6 and 32 characters." },
        { status: 400 }
      );
    }

    // 3. Call External Provider /api/external/addUser
    const apiRes = await addPlayerGameAccount(provider, {
      account: finalAccount,
      loginPwd: finalPassword,
    });

    if (apiRes.code !== 0) {
      const errorMsg = apiRes.msg || getGameStatusDescription(apiRes.code);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          code: apiRes.code,
        },
        { status: 400 }
      );
    }

    const externalUserId = apiRes.data?.user_id || `888${Math.floor(10000 + Math.random() * 90000)}`;

    // 4. Save or update PlayerGameAccount in database
    const gameAccount = await prisma.playerGameAccount.upsert({
      where: {
        userId_gameKey: {
          userId: user.id,
          gameKey,
        },
      },
      create: {
        userId: user.id,
        gameKey,
        gameUsername: finalAccount,
        gameUserId: externalUserId,
        lastKnownBalance: 0.0,
      },
      update: {
        gameUsername: finalAccount,
        gameUserId: externalUserId,
      },
    });

    // 5. Send automated confirmation in player's direct 1-on-1 staff chat
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (adminUser) {
        const directConv = await prisma.conversation.findFirst({
          where: {
            type: "DIRECT",
            AND: [
              { members: { some: { userId: user.id } } },
              { members: { some: { userId: adminUser.id } } },
            ],
          },
        });

        if (directConv) {
          await prisma.message.create({
            data: {
              conversationId: directConv.id,
              senderId: adminUser.id,
              content: `🎉 **New Game ID Created!**\nGame: **${provider.displayName}**\nLogin Username: \`${finalAccount}\`\nTemporary Password: \`${finalPassword}\`\nNumeric ID: \`${externalUserId}\`\n\nYou can now launch the app and login immediately, or let us know here when you'd like to load points!`,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Could not send chat receipt for user registration:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Account successfully created on ${provider.displayName}!`,
      account: gameAccount,
      loginUsername: finalAccount,
      loginPassword: finalPassword,
      gameUserId: externalUserId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create game ID" }, { status: 500 });
  }
}
