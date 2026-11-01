import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { getUserIdByLoginName } from "@/lib/games/client";
import { ensureDefaultGameProviders } from "@/lib/games/service";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    await ensureDefaultGameProviders();

    const accounts = await prisma.playerGameAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch player game accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, gameKey, gameUsername, gameUserId } = body;

    if (!userId || !gameKey || !gameUsername) {
      return NextResponse.json({ error: "userId, gameKey, and gameUsername are required" }, { status: 400 });
    }

    await ensureDefaultGameProviders();

    const provider = await prisma.gameProviderConfig.findUnique({
      where: { gameKey },
    });

    if (!provider) {
      return NextResponse.json({ error: "Unsupported game provider" }, { status: 404 });
    }

    let finalGameUserId = gameUserId ? String(gameUserId).trim() : null;

    // Auto-lookup numeric ID if missing
    if (!finalGameUserId && provider.apiBaseUrl && provider.agentId && provider.secretKey) {
      const lookup = await getUserIdByLoginName(provider, gameUsername.trim());
      if (lookup.code === 0 && lookup.data?.user_id) {
        finalGameUserId = lookup.data.user_id;
      }
    }

    const account = await prisma.playerGameAccount.upsert({
      where: {
        userId_gameKey: {
          userId,
          gameKey,
        },
      },
      create: {
        userId,
        gameKey,
        gameUsername: gameUsername.trim(),
        gameUserId: finalGameUserId,
      },
      update: {
        gameUsername: gameUsername.trim(),
        gameUserId: finalGameUserId || undefined,
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save player game account" }, { status: 500 });
  }
}
