import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPlayerBalance, getUserIdByLoginName } from "@/lib/games/client";
import { getGameStatusDescription } from "@/lib/games/statusCodes";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameKey = searchParams.get("gameKey");

    if (!gameKey) {
      return NextResponse.json({ error: "gameKey parameter is required" }, { status: 400 });
    }

    const account = await prisma.playerGameAccount.findUnique({
      where: {
        userId_gameKey: {
          userId: user.id,
          gameKey,
        },
      },
    });

    if (!account) {
      return NextResponse.json({
        success: false,
        notLinked: true,
        message: "No linked account found for this game",
      });
    }

    const provider = await prisma.gameProviderConfig.findUnique({
      where: { gameKey },
    });

    if (!provider) {
      return NextResponse.json({
        success: true,
        balance: account.lastKnownBalance,
        totalPointsLoaded: account.totalPointsLoaded,
        account,
        isLive: false,
      });
    }

    let gameUserId = account.gameUserId;

    // If gameUserId is missing or placeholder, attempt lookup by username
    if (!gameUserId || gameUserId.startsWith("888")) {
      const lookup = await getUserIdByLoginName(provider, account.gameUsername);
      if (lookup.code === 0 && lookup.data?.user_id) {
        gameUserId = lookup.data.user_id;
        await prisma.playerGameAccount.update({
          where: { id: account.id },
          data: { gameUserId },
        });
      }
    }

    if (gameUserId) {
      const apiRes = await getPlayerBalance(provider, gameUserId);
      if (apiRes.code === 0 && apiRes.data?.user_balance) {
        const liveBalance = parseFloat(apiRes.data.user_balance);
        await prisma.playerGameAccount.update({
          where: { id: account.id },
          data: { lastKnownBalance: liveBalance },
        });

        return NextResponse.json({
          success: true,
          balance: liveBalance,
          totalPointsLoaded: account.totalPointsLoaded,
          totalPointsWithdrawn: account.totalPointsWithdrawn,
          gameUsername: account.gameUsername,
          gameUserId,
          isLive: true,
        });
      } else {
        return NextResponse.json({
          success: true,
          balance: account.lastKnownBalance,
          totalPointsLoaded: account.totalPointsLoaded,
          totalPointsWithdrawn: account.totalPointsWithdrawn,
          gameUsername: account.gameUsername,
          gameUserId,
          isLive: false,
          notice: apiRes.msg || getGameStatusDescription(apiRes.code),
        });
      }
    }

    return NextResponse.json({
      success: true,
      balance: account.lastKnownBalance,
      totalPointsLoaded: account.totalPointsLoaded,
      totalPointsWithdrawn: account.totalPointsWithdrawn,
      gameUsername: account.gameUsername,
      gameUserId: null,
      isLive: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check balance" }, { status: 500 });
  }
}
