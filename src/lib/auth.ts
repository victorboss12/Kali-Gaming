import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "kali-gaming-ultra-secure-jwt-secret-key-2026";
export const AUTH_COOKIE_NAME = "kali_session";

export interface TokenPayload {
  userId: string;
  email?: string | null;
  phoneNumber?: string | null;
  username: string;
  role: string;
  status: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest | Request) {
  try {
    let token: string | undefined;

    if (req && "cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
      token = (req as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        isOnline: true,
        soundEnabled: true,
        allowFriendRequests: true,
        xp: true,
        hasClaimedSignupBonus: true,
        signupBonusPercent: true,
        hasPlayedFreeplay: true,
        lastFreeplayAt: true,
        lastRegularSpinAt: true,
        lastSignupSpinAt: true,
        activeDepositBonus: true,
        createdAt: true,
      },
    });

    if (!user || user.status === "BANNED") return null;
    return user;
  } catch {
    return null;
  }
}
