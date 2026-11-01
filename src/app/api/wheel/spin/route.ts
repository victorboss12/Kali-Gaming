import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { selectWinningSegment, DEFAULT_WHEEL_SEGMENTS, WheelSegment } from "@/lib/rng";

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Please log in to spin the welcome wheel" }, { status: 401 });
    }

    if (sessionUser.status === "BANNED") {
      return NextResponse.json({ error: "Your account is suspended" }, { status: 403 });
    }

    // Server-side eligibility & duplicate check
    const lastSpin = await prisma.rewardSpin.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastSpin) {
      const timeSince = Date.now() - new Date(lastSpin.createdAt).getTime();
      if (timeSince < SPIN_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((SPIN_COOLDOWN_MS - timeSince) / 1000);
        return NextResponse.json(
          {
            error: "You have already spun today. Please check back when cooldown expires.",
            cooldownRemainingSeconds: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Retrieve active reward definitions from DB or fallback
    const dbDefs = await prisma.rewardDefinition.findMany({
      where: { isActive: true },
      orderBy: { segmentIndex: "asc" },
    });

    const segments: WheelSegment[] = dbDefs.length === 8
      ? dbDefs.map((d) => ({
          index: d.segmentIndex,
          key: d.key,
          name: d.name,
          description: d.description,
          icon: d.icon,
          type: d.type,
          colorHex: d.colorHex,
          xpValue: d.xpValue,
          weight: Math.round(d.probability * 100) || 10,
        }))
      : DEFAULT_WHEEL_SEGMENTS;

    // Cryptographic server selection
    const { winningSegment, serverSeed } = selectWinningSegment(segments);

    // Find DB definition for the winner
    let dbReward = await prisma.rewardDefinition.findUnique({
      where: { key: winningSegment.key },
    });

    if (!dbReward) {
      dbReward = await prisma.rewardDefinition.create({
        data: {
          key: winningSegment.key,
          name: winningSegment.name,
          description: winningSegment.description,
          icon: winningSegment.icon,
          type: winningSegment.type,
          colorHex: winningSegment.colorHex,
          segmentIndex: winningSegment.index,
          xpValue: winningSegment.xpValue,
          probability: winningSegment.weight / 100,
        },
      });
    }

    // Atomic transaction for database persistence
    const [spinRecord, updatedUser] = await prisma.$transaction([
      prisma.rewardSpin.create({
        data: {
          userId: sessionUser.id,
          rewardId: dbReward.id,
          segmentIndex: winningSegment.index,
          serverSeed,
          claimed: true,
        },
      }),
      prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          xp: { increment: winningSegment.xpValue },
        },
      }),
      prisma.userReward.upsert({
        where: {
          userId_rewardId: {
            userId: sessionUser.id,
            rewardId: dbReward.id,
          },
        },
        update: { isEquipped: true },
        create: {
          userId: sessionUser.id,
          rewardId: dbReward.id,
          isEquipped: true,
        },
      }),
    ]);

    // Calculate rotation angle to align winner with top pointer:
    // 8 segments = 45 deg per segment.
    // Segment i occupies angles [i * 45, (i+1) * 45].
    // Center is (i * 45) + 22.5.
    // Adding 6 full revolutions (2160 deg) for dramatic spin:
    const segmentAngle = 360 / 8;
    const targetAngle = 360 * 6 + (360 - (winningSegment.index * segmentAngle + segmentAngle / 2));

    return NextResponse.json({
      success: true,
      winningSegment,
      segmentIndex: winningSegment.index,
      serverSeed,
      targetAngle,
      userXp: updatedUser.xp,
      cooldownRemainingSeconds: SPIN_COOLDOWN_MS / 1000,
      rewardId: dbReward.id,
    });
  } catch (err: any) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: "Failed to process spin" }, { status: 500 });
  }
}
