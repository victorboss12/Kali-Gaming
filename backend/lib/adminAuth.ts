import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || "kali-admin-super-isolated-secret-2026";
export const ADMIN_AUTH_COOKIE_NAME = "kali_admin_session";

export interface AdminTokenPayload {
  userId: string;
  email?: string;
  username: string;
  role: "ADMIN" | "MODERATOR";
  status: string;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  if (payload.role !== "ADMIN" && payload.role !== "MODERATOR") {
    throw new Error("Cannot issue admin token to non-staff user");
  }
  return jwt.sign(payload, JWT_ADMIN_SECRET, { expiresIn: "24h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_ADMIN_SECRET) as AdminTokenPayload;
    if (payload.role !== "ADMIN" && payload.role !== "MODERATOR") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSessionUser(req?: NextRequest | Request) {
  try {
    let token: string | undefined;

    if (req && "cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
      token = (req as NextRequest).cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value;
    } else {
      const cookieStore = cookies();
      token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const payload = verifyAdminToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        isOnline: true,
        xp: true,
        createdAt: true,
      },
    });

    if (!user || user.status === "BANNED") return null;
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") return null;

    return user;
  } catch {
    return null;
  }
}
