import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  selectWinningSegment,
  SIGNUP_WHEEL_SEGMENTS,
  getRegularWheelSegments,
  WheelSegment,
} from "@/lib/rng";

export const dynamic = "force-dynamic";

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Please log in to spin the wheel" }, { status: 401 });
    }

    if (sessionUser.status === "BANNED") {
      return NextResponse.json({ error: "Your account is suspended" }, { status: 403 });
    }

    // Parse requested wheel type if supplied
    let requestedType: "SIGNUP" | "REGULAR" | null = null;
    try {
      const body = await req.json();
      if (body.wheelType === "SIGNUP" || body.wheelType === "REGULAR") {
        requestedType = body.wheelType;
      }
    } catch {
      // Body may be empty, proceed with intelligent auto-selection
    }

    // Fetch fresh user record
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // Determine target wheel mode:
    // If not specified, default to SIGNUP if eligible, otherwise REGULAR
    const wheelType =
      requestedType || (!user.hasClaimedSignupBonus && !user.lastSignupSpinAt ? "SIGNUP" : "REGULAR");

    // ==========================================
    // 1. SIGNUP BONUS WHEEL (40% to 90% Deposit Match)
    // Only available once at signup time. After once used, use only regular bonus wheel.
    // ==========================================
    if (wheelType === "SIGNUP") {
      if (user.hasClaimedSignupBonus || user.lastSignupSpinAt) {
        return NextResponse.json(
          {
            error: "The Signup Wheel is only available once during signup. After using it once, use only the Daily Regular Bonus Wheel.",
            claimed: true,
            percentage: user.signupBonusPercent,
          },
          { status: 400 }
        );
      }

      // Cryptographically select from 40% - 90% segments
      const segments: WheelSegment[] = SIGNUP_WHEEL_SEGMENTS;
      const { winningSegment, serverSeed } = selectWinningSegment(segments);

      const bonusPercent = winningSegment.percentage ?? 50;
      const now = new Date();

      // Database updates in atomic transaction
      const [spinRecord, updatedUser, bonusRecord] = await prisma.$transaction([
        prisma.rewardSpin.create({
          data: {
            userId: user.id,
            wheelType: "SIGNUP",
            rewardType: "SIGNUP_BONUS",
            rewardTitle: winningSegment.name,
            percentage: bonusPercent,
            segmentIndex: winningSegment.index,
            serverSeed,
            claimed: true,
            metadata: JSON.stringify({
              bonusPercent,
              description: winningSegment.description,
            }),
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            hasClaimedSignupBonus: true,
            signupBonusPercent: bonusPercent,
            lastSignupSpinAt: now,
            xp: { increment: winningSegment.xpValue },
          },
        }),
        prisma.playerBonus.create({
          data: {
            userId: user.id,
            type: "SIGNUP_MATCH",
            title: winningSegment.name,
            percentage: bonusPercent,
            status: "ACTIVE",
            metadata: JSON.stringify({
              claimedAt: now.toISOString(),
              seed: serverSeed,
            }),
          },
        }),
      ]);

      // Notify platform administrator via direct 1-on-1 chat
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN", email: "admin@kali-gaming.com" },
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
              content: `🎉 Welcome Bonus Activated! You spun the New Player Wheel and unlocked a ${bonusPercent}% Match Bonus on your first deposit! Go to the Deposit page to claim.`,
            },
          }).catch(() => {});
        }
      }

      // Calculate rotation angle (8 segments = 45 deg each, 6 revolutions)
      const segmentAngle = 360 / 8;
      const targetAngle = 360 * 6 + (360 - (winningSegment.index * segmentAngle + segmentAngle / 2));

      return NextResponse.json({
        success: true,
        wheelType: "SIGNUP",
        winningSegment,
        segmentIndex: winningSegment.index,
        percentage: bonusPercent,
        serverSeed,
        targetAngle,
        userXp: updatedUser.xp,
        bonusId: bonusRecord.id,
        cooldownRemainingSeconds: 0,
        message: `Congratulations! You unlocked a ${bonusPercent}% Welcome Match Bonus!`,
      });
    }

    // ==========================================
    // 2. REGULAR BONUS WHEEL (Daily 24h Cooldown)
    // ==========================================
    // Enforce 24-hour interval: "dont renew the wheel if its used in 24 hours interval"
    if (user.lastRegularSpinAt) {
      const timeSince = Date.now() - new Date(user.lastRegularSpinAt).getTime();
      if (timeSince < SPIN_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((SPIN_COOLDOWN_MS - timeSince) / 1000);
        return NextResponse.json(
          {
            error: "You have already spun the daily wheel today. Please check back when cooldown expires.",
            cooldownRemainingSeconds: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Count approved deposits after player's last freeplay
    const depositsAfterFreeplay = await prisma.paymentTransaction.count({
      where: {
        userId: user.id,
        status: "APPROVED",
        createdAt: user.lastFreeplayAt ? { gt: user.lastFreeplayAt } : undefined,
      },
    });

    // Compute dynamic probabilities:
    // - If hasPlayedFreeplay:
    //     - depositsAfterFreeplay > 3 => 80% Freeplay chance
    //     - depositsAfterFreeplay <= 3 => 10% Freeplay chance
    // - If !hasPlayedFreeplay => 80% Freeplay chance
    const { segments, freeplayOdds, boostActive } = getRegularWheelSegments(
      user.hasPlayedFreeplay,
      depositsAfterFreeplay
    );

    // Cryptographic server selection
    const { winningSegment, serverSeed } = selectWinningSegment(segments);
    const now = new Date();

    const isFreeplay = winningSegment.rewardType === "FREEPLAY";
    const bonusPercent = winningSegment.percentage ?? null;
    const freeplayAmt = winningSegment.freeplayAmount ?? null;

    // Database updates in atomic transaction
    const [spinRecord, updatedUser, bonusRecord] = await prisma.$transaction([
      prisma.rewardSpin.create({
        data: {
          userId: user.id,
          wheelType: "REGULAR",
          rewardType: isFreeplay ? "FREEPLAY" : "DEPOSIT_BONUS",
          rewardTitle: winningSegment.name,
          percentage: bonusPercent,
          segmentIndex: winningSegment.index,
          serverSeed,
          claimed: true,
          metadata: JSON.stringify({
            isFreeplay,
            freeplayAmount: freeplayAmt,
            percentage: bonusPercent,
            depositsAfterFreeplay,
            freeplayOdds,
            boostActive,
          }),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastRegularSpinAt: now,
          xp: { increment: winningSegment.xpValue },
          ...(isFreeplay
            ? {
                hasPlayedFreeplay: true,
                lastFreeplayAt: now,
              }
            : {
                activeDepositBonus: bonusPercent,
              }),
        },
      }),
      prisma.playerBonus.create({
        data: {
          userId: user.id,
          type: isFreeplay ? "FREEPLAY" : "DEPOSIT_MATCH",
          title: winningSegment.name,
          amount: freeplayAmt,
          percentage: bonusPercent,
          status: "ACTIVE",
          metadata: JSON.stringify({
            claimedAt: now.toISOString(),
            depositsAfterFreeplay,
            freeplayOdds,
          }),
        },
      }),
    ]);

    // Notify platform administrator via direct 1-on-1 chat
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "admin@kali-gaming.com" },
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
        const adminMsg = isFreeplay
          ? `🎁 Daily Freeplay Won: You spun the Daily Wheel and won ${winningSegment.name}! Administrator has been notified to load your freeplay points.`
          : `⚡ Daily Deposit Bonus Won: You unlocked a ${bonusPercent}% Bonus Match on your next deposit!`;

        await prisma.message.create({
          data: {
            conversationId: directConv.id,
            senderId: adminUser.id,
            content: adminMsg,
          },
        }).catch(() => {});
      }
    }

    // Calculate rotation angle (8 segments = 45 deg each, 6 revolutions)
    const segmentAngle = 360 / 8;
    const targetAngle = 360 * 6 + (360 - (winningSegment.index * segmentAngle + segmentAngle / 2));

    return NextResponse.json({
      success: true,
      wheelType: "REGULAR",
      winningSegment,
      segmentIndex: winningSegment.index,
      isFreeplay,
      freeplayAmount: freeplayAmt,
      percentage: bonusPercent,
      serverSeed,
      targetAngle,
      userXp: updatedUser.xp,
      bonusId: bonusRecord.id,
      cooldownRemainingSeconds: SPIN_COOLDOWN_MS / 1000,
      freeplayOdds,
      boostActive,
      depositsAfterFreeplay,
      message: isFreeplay
        ? `Congratulations! You won ${winningSegment.name}!`
        : `Congratulations! You won a ${bonusPercent}% Match Bonus on your next deposit!`,
    });
  } catch (err: any) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: "Failed to process spin" }, { status: 500 });
  }
}
