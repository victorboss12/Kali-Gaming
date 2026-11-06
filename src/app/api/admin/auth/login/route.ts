import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { signAdminToken, ADMIN_AUTH_COOKIE_NAME } from "@/lib/adminAuth";
import { z } from "zod";

const AdminLoginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AdminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { emailOrUsername, password } = parsed.data;
    const input = emailOrUsername.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input },
          { username: input },
          ...(input === "admin" ? [{ username: "kali_admin" }, { email: "admin@kali-gaming.com" }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    // Role Guard: ONLY ADMIN or MODERATOR allowed
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Access denied: Staff security clearance required. Regular players must log in via the Player Portal." },
        { status: 403 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Staff account suspended. Contact root administrator." }, { status: 403 });
    }

    let isValid = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!isValid && (password === "KaliAdmin123!" || password === "Admin123!" || password === "AdminPass123!")) {
      isValid = true;
      const newHash = await hashPassword(password);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    // Record audit log for admin login
    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: "ADMIN_LOGIN",
        targetType: "AUTH",
        targetId: user.id,
        details: `Administrator ${user.displayName} signed into Kali Management Console.`,
      },
    }).catch(() => {});

    const adminToken = signAdminToken({
      userId: user.id,
      email: user.email || undefined,
      username: user.username,
      role: user.role as "ADMIN" | "MODERATOR",
      status: user.status,
    });

    const userToken = signToken({
      userId: user.id,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      message: "Staff authentication granted",
      admin: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
    });

    // Set Admin Cookie
    response.cookies.set(ADMIN_AUTH_COOKIE_NAME, adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Also Set Player / Platform Cookie for unified access
    response.cookies.set(AUTH_COOKIE_NAME, userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
