import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_WHEEL_SEGMENTS } from "@/lib/rng";

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    const dbSegments = await prisma.rewardDefinition.findMany({
      where: { isActive: true },
      orderBy: { segmentIndex: "asc" },
    });

    const segments = dbSegments.length > 0 ? dbSegments : DEFAULT_WHEEL_SEGMENTS;

    if (!sessionUser) {
      return NextResponse.json({
        canSpin: true,
        cooldownRemainingSeconds: 0,
        segments,
        requiresLogin: true,
      });
    }

    // Check last spin
    const lastSpin = await prisma.rewardSpin.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });

    let canSpin = true;
    let cooldownRemainingSeconds = 0;

    if (lastSpin) {
      const timeSinceLastSpin = Date.now() - new Date(lastSpin.createdAt).getTime();
      if (timeSinceLastSpin < SPIN_COOLDOWN_MS) {
        canSpin = false;
        cooldownRemainingSeconds = Math.ceil((SPIN_COOLDOWN_MS - timeSinceLastSpin) / 1000);
      }
    }

    return NextResponse.json({
      canSpin,
      cooldownRemainingSeconds,
      segments,
      lastSpinAt: lastSpin?.createdAt || null,
      userXp: sessionUser.xp,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch wheel status" }, { status: 500 });
  }
}
