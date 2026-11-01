import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { LoginSchema } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { emailOrUsername, password } = parsed.data;
    const input = emailOrUsername.trim();
    const digitsOnly = input.replace(/\D/g, "");

    // Generate possible phone variations for flexible user entry
    const possiblePhones: string[] = [input];
    if (digitsOnly.length >= 7) {
      possiblePhones.push(`+${digitsOnly}`);
      possiblePhones.push(digitsOnly);
      if (digitsOnly.length === 10) {
        // Standard US 10-digit number -> +1...
        possiblePhones.push(`+1${digitsOnly}`);
      }
      if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
        possiblePhones.push(`+${digitsOnly}`);
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.toLowerCase() },
          { username: input.toLowerCase() },
          { phoneNumber: { in: possiblePhones } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Update last seen & online
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    const token = signToken({
      userId: user.id,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: true,
        xp: user.xp,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
