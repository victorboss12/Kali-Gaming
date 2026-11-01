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
}

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
