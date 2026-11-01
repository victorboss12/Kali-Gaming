import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  SIGNUP_WHEEL_SEGMENTS,
  getRegularWheelSegments,
  DEFAULT_WHEEL_SEGMENTS,
} from "@/lib/rng";

export const dynamic = "force-dynamic";

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const requestedType = searchParams.get("type"); // "SIGNUP" | "REGULAR"

    if (!sessionUser) {
      const defaultRegular = getRegularWheelSegments(false, 0);
      return NextResponse.json({
        requiresLogin: true,
        canSpin: true,
        cooldownRemainingSeconds: 0,
        activeWheelMode: "SIGNUP",
        signup: {
          canSpin: true,
          claimed: false,
          percentage: null,
          segments: SIGNUP_WHEEL_SEGMENTS,
        },
        regular: {
          canSpin: true,
          cooldownRemainingSeconds: 0,
          segments: defaultRegular.segments,
          freeplayOdds: defaultRegular.freeplayOdds,
          boostActive: defaultRegular.boostActive,
          hasPlayedFreeplay: false,
          depositsAfterFreeplay: 0,
        },
        segments: requestedType === "REGULAR" ? defaultRegular.segments : SIGNUP_WHEEL_SEGMENTS,
      });
    }

    // Refresh user fresh state
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        xp: true,
        status: true,
        hasClaimedSignupBonus: true,
        signupBonusPercent: true,
        hasPlayedFreeplay: true,
        lastFreeplayAt: true,
        lastRegularSpinAt: true,
        lastSignupSpinAt: true,
        activeDepositBonus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- 1. Signup Wheel Status ---
    const signupCanSpin = !user.hasClaimedSignupBonus && !user.lastSignupSpinAt;

    // --- 2. Regular Bonus Wheel Status ---
    let regularCanSpin = true;
    let regularCooldownRemaining = 0;

    if (user.lastRegularSpinAt) {
      const timeSince = Date.now() - new Date(user.lastRegularSpinAt).getTime();
      if (timeSince < SPIN_COOLDOWN_MS) {
        regularCanSpin = false;
        regularCooldownRemaining = Math.ceil((SPIN_COOLDOWN_MS - timeSince) / 1000);
      }
    }

    // Count approved deposits created AFTER player's last freeplay
    const depositsAfterFreeplay = await prisma.paymentTransaction.count({
      where: {
        userId: user.id,
        status: "APPROVED",
        createdAt: user.lastFreeplayAt ? { gt: user.lastFreeplayAt } : undefined,
      },
    });

    // Compute dynamic odds and segments for Regular Wheel
    const regularData = getRegularWheelSegments(
      user.hasPlayedFreeplay,
      depositsAfterFreeplay
    );

    // Once claimed/used, the signup wheel is permanently retired; use only the regular bonus wheel
    const showSignupWheel = !user.hasClaimedSignupBonus && !user.lastSignupSpinAt;
    const activeWheelMode = showSignupWheel ? "SIGNUP" : "REGULAR";

    const activeSegments = showSignupWheel ? SIGNUP_WHEEL_SEGMENTS : regularData.segments;
    const canSpin = showSignupWheel ? signupCanSpin : regularCanSpin;
    const cooldownRemainingSeconds = showSignupWheel ? 0 : regularCooldownRemaining;

    return NextResponse.json({
      requiresLogin: false,
      activeWheelMode,
      showSignupWheel,
      userXp: user.xp,
      activeDepositBonus: user.activeDepositBonus,
      signupBonusPercent: user.signupBonusPercent,
      hasClaimedSignupBonus: user.hasClaimedSignupBonus,
      signup: {
        canSpin: showSignupWheel,
        claimed: user.hasClaimedSignupBonus,
        percentage: user.signupBonusPercent,
        segments: showSignupWheel ? SIGNUP_WHEEL_SEGMENTS : [],
      },
      regular: {
        canSpin: regularCanSpin,
        cooldownRemainingSeconds: regularCooldownRemaining,
        segments: regularData.segments,
        freeplayOdds: regularData.freeplayOdds,
        boostActive: regularData.boostActive,
        hasPlayedFreeplay: user.hasPlayedFreeplay,
        depositsAfterFreeplay,
        lastRegularSpinAt: user.lastRegularSpinAt,
      },
      // Backward-compatible fields
      canSpin,
      cooldownRemainingSeconds,
      segments: activeSegments,
    });
  } catch (err: any) {
    console.error("Wheel status error:", err);
    return NextResponse.json({ error: "Failed to fetch wheel status" }, { status: 500 });
  }
}
