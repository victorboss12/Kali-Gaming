import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureDefaultGameProviders } from "@/lib/games/service";
import { getUserIdByLoginName } from "@/lib/games/client";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureDefaultGameProviders();

    const accounts = await prisma.playerGameAccount.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const transactions = await prisma.gamePointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ accounts, transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameKey, gameUsername } = await req.json();
    if (!gameKey || !gameUsername) {
      return NextResponse.json({ error: "gameKey and gameUsername are required" }, { status: 400 });
    }

    const provider = await prisma.gameProviderConfig.findUnique({
      where: { gameKey },
    });

    if (!provider) {
      return NextResponse.json({ error: "Unsupported game provider" }, { status: 404 });
    }

    // Attempt lookup of external ID
    let gameUserId: string | null = null;
    const lookup = await getUserIdByLoginName(provider, gameUsername.trim());
    if (lookup.code === 0 && lookup.data?.user_id) {
      gameUserId = lookup.data.user_id;
    }

    const account = await prisma.playerGameAccount.upsert({
      where: {
        userId_gameKey: {
          userId: user.id,
          gameKey,
        },
      },
      create: {
        userId: user.id,
        gameKey,
        gameUsername: gameUsername.trim(),
        gameUserId,
      },
      update: {
        gameUsername: gameUsername.trim(),
        gameUserId: gameUserId || undefined,
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to link game account" }, { status: 500 });
  }
}
