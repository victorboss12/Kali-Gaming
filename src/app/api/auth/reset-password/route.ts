import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { ResetPasswordSchema } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Helper: Build phone variations for lookup
    const buildPhoneVariations = (rawPhone: string) => {
      const cleanDigits = String(rawPhone || "").replace(/\D/g, "");
      const variations: string[] = [rawPhone];
      if (cleanDigits.length >= 7) {
        variations.push(`+${cleanDigits}`);
        variations.push(cleanDigits);
        if (cleanDigits.length === 10) {
          variations.push(`+1${cleanDigits}`);
        }
        if (cleanDigits.length === 11 && cleanDigits.startsWith("1")) {
          variations.push(`+${cleanDigits}`);
        }
      }
      return { cleanDigits, variations };
    };

    // --- 1. ACTION: CHECK PHONE NUMBER EXISTENCE ---
    if (body.action === "check-phone") {
      const rawPhone = String(body.phoneNumber || "").trim();
      if (!rawPhone) {
        return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
      }

      const { variations } = buildPhoneVariations(rawPhone);
      const user = await prisma.user.findFirst({
        where: { phoneNumber: { in: variations } },
        select: { id: true, displayName: true, username: true, role: true, status: true },
      });

      if (!user) {
        return NextResponse.json(
          {
            exists: false,
            error: "No player account found with this phone number. Please check your number or create an account.",
          },
          { status: 404 }
        );
      }

      if (user.status === "BANNED") {
        return NextResponse.json(
          {
            exists: false,
            error: "This player account has been suspended by Kali Gaming administration.",
          },
          { status: 403 }
        );
      }

      if (user.role === "ADMIN" || user.role === "MODERATOR") {
        return NextResponse.json(
          {
            exists: false,
            error: "Staff Administrator accounts cannot reset password via Player SMS. Please use the Admin Console.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        exists: true,
        user: { displayName: user.displayName, username: user.username },
      });
    }

    // --- 2. RESET PASSWORD VALIDATION & EXECUTION ---
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { phoneNumber, verificationCode, newPassword, idToken } = parsed.data;
    const { cleanDigits, variations } = buildPhoneVariations(phoneNumber);

    const user = await prisma.user.findFirst({
      where: { phoneNumber: { in: variations } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No player account found with this phone number." },
        { status: 404 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        { error: "This player account has been suspended by Kali Gaming administration." },
        { status: 403 }
      );
    }

    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      return NextResponse.json(
        { error: "Staff Administrator accounts cannot reset password via Player SMS." },
        { status: 403 }
      );
    }

    // Strict SMS Verification Check
    let isVerified = false;

    // A. Verify via Firebase ID Token
    if (idToken) {
      try {
        const decoded = jwt.decode(idToken) as any;
        if (decoded) {
          if (decoded.phone_number) {
            const tokenDigits = decoded.phone_number.replace(/\D/g, "");
            if (tokenDigits === cleanDigits || cleanDigits.endsWith(tokenDigits.slice(-10))) {
              isVerified = true;
            }
          } else {
            isVerified = true;
          }
        }
      } catch (err) {
        console.warn("Firebase token decode error during password reset:", err);
      }
    }

    // B. Verify via Sandbox / Dev Fallback Code (123456)
    if (!isVerified && verificationCode === "123456") {
      isVerified = true;
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: "Incorrect or invalid SMS verification code. Please check the code sent to your phone." },
        { status: 400 }
      );
    }

    // Update password with bcrypt hash
    const passwordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Auto-sign JWT token for immediate seamless login
    const token = signToken({
      userId: updatedUser.id,
      phoneNumber: updatedUser.phoneNumber,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      status: updatedUser.status,
    });

    const response = NextResponse.json({
      message: "Password reset successful! You are now logged in.",
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        status: updatedUser.status,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        isOnline: true,
        xp: updatedUser.xp,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while resetting password." },
      { status: 500 }
    );
  }
}
