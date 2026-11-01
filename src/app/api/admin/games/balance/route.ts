import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { getPlayerBalance, getAgentDistributorBalance } from "@/lib/games/client";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const gameKey = searchParams.get("gameKey");
    const gameUserId = searchParams.get("gameUserId");

    if (!gameKey) {
      return NextResponse.json({ error: "gameKey parameter is required" }, { status: 400 });
    }

    const provider = await prisma.gameProviderConfig.findUnique({
      where: { gameKey },
    });

    if (!provider) {
      return NextResponse.json({ error: "Game provider not found" }, { status: 404 });
    }

    if (gameUserId) {
      const userRes = await getPlayerBalance(provider, gameUserId);
      return NextResponse.json({
        type: "USER_BALANCE",
        gameKey,
        gameUserId,
        apiResponse: userRes,
        balance: userRes.data?.user_balance || "0",
      });
    } else {
      const agentRes = await getAgentDistributorBalance(provider);
      return NextResponse.json({
        type: "AGENT_BALANCE",
        gameKey,
        apiResponse: agentRes,
        balance: agentRes.data?.agent_balance || "0",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch balance" }, { status: 500 });
  }
}
