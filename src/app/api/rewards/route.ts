import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);

    const definitions = await prisma.rewardDefinition.findMany({
      where: { isActive: true },
      orderBy: { segmentIndex: "asc" },
    });

    let userRewards: any[] = [];
    let spinHistory: any[] = [];

    if (sessionUser) {
      userRewards = await prisma.userReward.findMany({
        where: { userId: sessionUser.id },
        include: { reward: true },
        orderBy: { acquiredAt: "desc" },
      });

      spinHistory = await prisma.rewardSpin.findMany({
        where: { userId: sessionUser.id },
        include: { reward: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
    }

    return NextResponse.json({
      definitions,
      userRewards,
      spinHistory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
