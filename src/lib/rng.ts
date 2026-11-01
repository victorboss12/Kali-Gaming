import crypto from "crypto";

export interface WheelSegment {
  index: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  colorHex: string;
  xpValue: number;
  weight: number;
  rewardType?: "SIGNUP_BONUS" | "FREEPLAY" | "DEPOSIT_BONUS" | "XP_BOOST" | "BADGE" | "VIP_TITLE" | "AVATAR_FRAME" | "EMOTE_PACK";
  percentage?: number; // 40..90 for signup, 20..50 for regular
  freeplayAmount?: number; // e.g. 10
}

/**
 * Default Legacy Segments (kept for backward compatibility & cosmetic testing)
 */
export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  {
    index: 0,
    key: "high_roller_badge",
    name: "High Roller",
    description: "Exclusive glowing High Roller profile badge",
    icon: "Crown",
    type: "BADGE",
    colorHex: "#F36E0F",
    xpValue: 300,
    weight: 15,
  },
  {
    index: 1,
    key: "xp_250",
    name: "+250 XP Boost",
    description: "Instant 250 Platform Experience Points",
    icon: "Zap",
    type: "XP_BOOST",
    colorHex: "#1b2a7a",
    xpValue: 250,
    weight: 25,
  },
  {
    index: 2,
    key: "galaxy_vip_title",
    name: "Galaxy VIP",
    description: "Cosmic VIP Title displayed beside your username",
    icon: "Sparkles",
    type: "VIP_TITLE",
    colorHex: "#2a3c91",
    xpValue: 400,
    weight: 10,
  },
  {
    index: 3,
    key: "fire_avatar_frame",
    name: "Flame Frame",
    description: "Animated Neon Fire border for your avatar",
    icon: "Flame",
    type: "AVATAR_FRAME",
    colorHex: "#EA0000",
    xpValue: 500,
    weight: 10,
  },
  {
    index: 4,
    key: "xp_500",
    name: "+500 XP Boost",
    description: "Instant 500 Platform Experience Points",
    icon: "Zap",
    type: "XP_BOOST",
    colorHex: "#0e1b4d",
    xpValue: 500,
    weight: 15,
  },
  {
    index: 5,
    key: "lucky_charm_emotes",
    name: "Lucky Charm Emotes",
    description: "Exclusive animated chat reaction sticker pack",
    icon: "Smile",
    type: "EMOTE_PACK",
    colorHex: "#17102D",
    xpValue: 350,
    weight: 15,
  },
  {
    index: 6,
    key: "milkyway_master_badge",
    name: "Milkyway Master",
    description: "Prestigious Milkyway community champion badge",
    icon: "ShieldAlert",
    type: "BADGE",
    colorHex: "#F6FF00",
    xpValue: 600,
    weight: 8,
  },
  {
    index: 7,
    key: "jackpot_1000_xp",
    name: "1,000 XP Jackpot",
    description: "Grand Prize platform level accelerator",
    icon: "Trophy",
    type: "XP_BOOST",
    colorHex: "#F36E0F",
    xpValue: 1000,
    weight: 2,
  },
];

/**
 * 1. New Player Signup Bonus Wheel (40% to 90% Deposit Match)
 * Every segment is between 40% and 90%!
 */
export const SIGNUP_WHEEL_SEGMENTS: WheelSegment[] = [
  {
    index: 0,
    key: "signup_bonus_40",
    name: "40% Signup Bonus",
    description: "40% match on your first deposit! Valid across all sweeps games.",
    icon: "Gift",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#F36E0F",
    xpValue: 200,
    percentage: 40,
    weight: 20,
  },
  {
    index: 1,
    key: "signup_bonus_50",
    name: "50% Signup Bonus",
    description: "50% match on your first deposit! Boost your starting bankroll.",
    icon: "Sparkles",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#1b2a7a",
    xpValue: 250,
    percentage: 50,
    weight: 20,
  },
  {
    index: 2,
    key: "signup_bonus_60",
    name: "60% Signup Bonus",
    description: "60% match on your first deposit! Extra credits for all slot & fish games.",
    icon: "Flame",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#2a3c91",
    xpValue: 300,
    percentage: 60,
    weight: 18,
  },
  {
    index: 3,
    key: "signup_bonus_70",
    name: "70% VIP Match",
    description: "70% VIP match bonus on your first deposit! Massive credit boost.",
    icon: "Crown",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#EA0000",
    xpValue: 400,
    percentage: 70,
    weight: 15,
  },
  {
    index: 4,
    key: "signup_bonus_45",
    name: "45% Signup Bonus",
    description: "45% match bonus on your first deposit at Kali-Gaming.",
    icon: "Gift",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#0e1b4d",
    xpValue: 225,
    percentage: 45,
    weight: 12,
  },
  {
    index: 5,
    key: "signup_bonus_80",
    name: "80% Super Bonus",
    description: "80% Super match bonus on your first deposit! Play like a high roller.",
    icon: "Zap",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#F6FF00",
    xpValue: 500,
    percentage: 80,
    weight: 8,
  },
  {
    index: 6,
    key: "signup_bonus_55",
    name: "55% Signup Bonus",
    description: "55% match on your first deposit credited directly on cashier approval.",
    icon: "Sparkles",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#17102D",
    xpValue: 275,
    percentage: 55,
    weight: 5,
  },
  {
    index: 7,
    key: "signup_bonus_90",
    name: "90% Mega Jackpot Bonus",
    description: "GRAND PRIZE! 90% Mega match bonus on your first deposit!",
    icon: "Trophy",
    type: "SIGNUP_BONUS",
    rewardType: "SIGNUP_BONUS",
    colorHex: "#F36E0F",
    xpValue: 1000,
    percentage: 90,
    weight: 2,
  },
];

/**
 * 2. Regular Bonus Wheel (Daily 24h Cooldown)
 * Slices are strictly Freeplay ($3 to $5) OR 20% to 50% Bonus on Next Deposit!
 * (Signup bonus is never included in the regular wheel)
 *
 * Probabilities:
 * - Freeplay overall:
 *     - If player has already played freeplay:
 *         - If deposits after freeplay > 3 => 80% Freeplay chance
 *         - If deposits after freeplay <= 3 => 10% Freeplay chance
 *     - If player has NOT played freeplay yet => 80% Freeplay chance
 * - Within Freeplay pool (Max $3 to $5):
 *     - 80% chance of $3 Free Play
 *     - 20% chance of $4 and $5 Free Play (10% for $4, 10% for $5)
 * - Within Deposit Match pool (20% to 50%):
 *     - 20%, 25%, 30%, 40%, 50% match on next deposit
 */
export function getRegularWheelSegments(
  hasPlayedFreeplay: boolean,
  depositsAfterFreeplay: number
): { segments: WheelSegment[]; freeplayOdds: number; boostActive: boolean } {
  let freeplayProbability: number;
  let boostActive = false;

  if (hasPlayedFreeplay) {
    if (depositsAfterFreeplay > 3) {
      // If deposits after freeplay > 3, increase freeplay chance to 80%
      freeplayProbability = 0.80;
      boostActive = true;
    } else {
      // 10% success rate of freeplay if already played freeplay
      freeplayProbability = 0.10;
    }
  } else {
    // Has not played freeplay yet: give high introductory chance (80%)
    freeplayProbability = 0.80;
    boostActive = true;
  }

  const depositProbability = 1 - freeplayProbability;

  // We allocate across 10,000 total weight units for ultra-precise odds
  const totalFreeplayWeight = Math.round(freeplayProbability * 10000);
  const totalDepositWeight = 10000 - totalFreeplayWeight;

  // Freeplay Pool (Max $3 to $5):
  // "80% chance to get 3 and 20 % chance to get 4 and 5 dollar freeplay"
  const seg3DollarWeight = Math.max(1, Math.round(totalFreeplayWeight * 0.80)); // 80% of freeplay
  const seg4DollarWeight = Math.max(1, Math.round(totalFreeplayWeight * 0.10)); // 10% of freeplay
  const seg5DollarWeight = Math.max(1, totalFreeplayWeight - seg3DollarWeight - seg4DollarWeight); // 10% of freeplay (total 20% for 4 and 5)

  // Deposit Match pool (20% to 50% match on next deposit):
  // - Seg 4 (20% Match): 28% of deposit pool
  // - Seg 1 (25% Match): 25% of deposit pool
  // - Seg 2 (30% Match): 22% of deposit pool
  // - Seg 5 (40% Match): 15% of deposit pool
  // - Seg 7 (50% Mega Match): 10% of deposit pool
  const seg4Weight = Math.max(1, Math.round(totalDepositWeight * 0.28));
  const seg1Weight = Math.max(1, Math.round(totalDepositWeight * 0.25));
  const seg2Weight = Math.max(1, Math.round(totalDepositWeight * 0.22));
  const seg5Weight = Math.max(1, Math.round(totalDepositWeight * 0.15));
  const seg7Weight = Math.max(1, totalDepositWeight - seg4Weight - seg1Weight - seg2Weight - seg5Weight);

  const segments: WheelSegment[] = [
    {
      index: 0,
      key: "freeplay_3",
      name: "$3 Free Play",
      description: "$3 Free Play on any game! No deposit required.",
      icon: "Gift",
      type: "FREEPLAY",
      rewardType: "FREEPLAY",
      colorHex: "#F36E0F",
      xpValue: 150,
      freeplayAmount: 3,
      weight: seg3DollarWeight,
    },
    {
      index: 1,
      key: "deposit_bonus_25",
      name: "25% Deposit Match",
      description: "Get +25% extra credits on your next deposit!",
      icon: "Sparkles",
      type: "DEPOSIT_BONUS",
      rewardType: "DEPOSIT_BONUS",
      colorHex: "#1b2a7a",
      xpValue: 150,
      percentage: 25,
      weight: seg1Weight,
    },
    {
      index: 2,
      key: "deposit_bonus_30",
      name: "30% Deposit Match",
      description: "Get +30% bonus credits on your next deposit!",
      icon: "Flame",
      type: "DEPOSIT_BONUS",
      rewardType: "DEPOSIT_BONUS",
      colorHex: "#2a3c91",
      xpValue: 200,
      percentage: 30,
      weight: seg2Weight,
    },
    {
      index: 3,
      key: "freeplay_4",
      name: "$4 Free Play",
      description: "Lucky Tier: $4 Free Play credits loaded directly to your game account.",
      icon: "Crown",
      type: "FREEPLAY",
      rewardType: "FREEPLAY",
      colorHex: "#EA0000",
      xpValue: 250,
      freeplayAmount: 4,
      weight: seg4DollarWeight,
    },
    {
      index: 4,
      key: "deposit_bonus_20",
      name: "20% Deposit Match",
      description: "Get +20% bonus credits on your next deposit!",
      icon: "Gift",
      type: "DEPOSIT_BONUS",
      rewardType: "DEPOSIT_BONUS",
      colorHex: "#0e1b4d",
      xpValue: 100,
      percentage: 20,
      weight: seg4Weight,
    },
    {
      index: 5,
      key: "deposit_bonus_40",
      name: "40% Deposit Match",
      description: "High Roller Tier: +40% bonus credits on your next deposit!",
      icon: "Zap",
      type: "DEPOSIT_BONUS",
      rewardType: "DEPOSIT_BONUS",
      colorHex: "#17102D",
      xpValue: 350,
      percentage: 40,
      weight: seg5Weight,
    },
    {
      index: 6,
      key: "freeplay_5",
      name: "$5 Free Play",
      description: "Max Free Play! $5 Free Play credits for slots and fish shooter games.",
      icon: "Trophy",
      type: "FREEPLAY",
      rewardType: "FREEPLAY",
      colorHex: "#F6FF00",
      xpValue: 300,
      freeplayAmount: 5,
      weight: seg5DollarWeight,
    },
    {
      index: 7,
      key: "deposit_bonus_50",
      name: "50% Mega Match",
      description: "Grand Prize! +50% Mega Match on your next deposit!",
      icon: "Crown",
      type: "DEPOSIT_BONUS",
      rewardType: "DEPOSIT_BONUS",
      colorHex: "#F36E0F",
      xpValue: 500,
      percentage: 50,
      weight: seg7Weight,
    },
  ];

  return {
    segments,
    freeplayOdds: freeplayProbability,
    boostActive,
  };
}

/**
 * Server-authoritative cryptographically secure random segment selection.
 */
export function selectWinningSegment(segments: WheelSegment[] = DEFAULT_WHEEL_SEGMENTS) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const randomBytes = crypto.randomBytes(4);
  const randomFloat = randomBytes.readUInt32BE(0) / 0xffffffff;
  let accumulated = 0;
  const threshold = randomFloat * totalWeight;

  for (const seg of segments) {
    accumulated += seg.weight;
    if (threshold <= accumulated) {
      const serverSeed = crypto.randomBytes(16).toString("hex");
      return {
        winningSegment: seg,
        serverSeed,
      };
    }
  }

  const fallback = segments[0];
  return {
    winningSegment: fallback,
    serverSeed: crypto.randomBytes(16).toString("hex"),
  };
}
