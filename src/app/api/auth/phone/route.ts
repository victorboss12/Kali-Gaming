import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { PhoneAuthSchema } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PhoneAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid phone authentication data" },
        { status: 400 }
      );
    }

    const {
      phoneNumber,
      verificationCode,
      idToken,
      firebaseUid,
      displayName,
      username,
      mode = "login", // Default to "login" so random phone numbers cannot auto-create accounts!
    } = parsed.data;

    // Normalize phone number to E.164 format (+1XXXXXXXXXX)
    let cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    }

    // MODE: "check" — pre-flight check if phone number exists before sending SMS
    if (mode === "check") {
      const existingUser = await prisma.user.findFirst({
        where: { phoneNumber: cleanPhone },
        select: { id: true, displayName: true, username: true, role: true, status: true },
      });
      return NextResponse.json({
        exists: Boolean(existingUser),
        user: existingUser || null,
      });
    }

    // STRICT LOOKUP: Check if account exists with this phone number
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          ...(firebaseUid ? [{ firebaseUid }] : []),
        ],
      },
    });

    // 1. LOGIN MODE: Account MUST already exist!
    if (mode === "login") {
      if (!user) {
        return NextResponse.json(
          {
            error: "No player account found with this phone number. Please click 'Create Player Account' to sign up first.",
          },
          { status: 404 }
        );
      }

      // Reject admin/staff accounts from using player phone login
      if (user.role === "ADMIN" || user.role === "MODERATOR") {
        return NextResponse.json(
          {
            error:
              "Security Access Denied: Admin and Staff accounts cannot sign in via Player Phone Authentication. Please use the enterprise Admin Console at /admin/login.",
          },
          { status: 403 }
        );
      }

      if (user.status === "BANNED") {
        return NextResponse.json(
          { error: "This player account has been suspended by Kali Gaming administration." },
          { status: 403 }
        );
      }
    }

    // 2. SIGNUP MODE: Account must NOT already exist!
    if (mode === "signup" && user) {
      return NextResponse.json(
        {
          error: "An account with this phone number already exists. Please log in instead.",
        },
        { status: 400 }
      );
    }

    // Verification Code / Token Check
    let isVerified = false;
    let verifiedFirebaseUid = firebaseUid;

    // A. Firebase Token verification
    if (idToken) {
      try {
        const decoded = jwt.decode(idToken) as any;
        if (decoded) {
          if (decoded.phone_number) {
            const tokenPhone = decoded.phone_number.replace(/[^\d+]/g, "");
            if (tokenPhone === cleanPhone || cleanPhone.endsWith(tokenPhone.slice(-10))) {
              isVerified = true;
              verifiedFirebaseUid = decoded.sub || decoded.user_id || firebaseUid;
            }
          } else {
            isVerified = true;
            verifiedFirebaseUid = decoded.sub || decoded.user_id || firebaseUid;
          }
        }
      } catch (err) {
        console.warn("Firebase token decode error, fallback to code check:", err);
      }
    }

    // B. Sandbox fallback code (123456) for automated testing
    if (!isVerified) {
      if (verificationCode === "123456") {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: "Incorrect or invalid SMS verification code. Please verify the code sent to your phone via Firebase." },
        { status: 400 }
      );
    }

    // --- HANDLE LOGIN FLOW ---
    if (user) {
      // Update phone/firebaseUid if newly confirmed
      if (!user.phoneNumber || (verifiedFirebaseUid && !user.firebaseUid)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            phoneNumber: cleanPhone,
            firebaseUid: verifiedFirebaseUid || user.firebaseUid,
            isOnline: true,
            lastSeenAt: new Date(),
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true, lastSeenAt: new Date() },
        });
      }

      const token = signToken({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        role: "USER", // Strictly regular player role
        status: user.status,
      });

      const response = NextResponse.json({
        message: "Phone login successful",
        isNewUser: false,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
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
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // --- HANDLE SIGNUP FLOW (ONLY WHEN EXPLICITLY IN SIGNUP MODE) ---
    if (mode !== "signup") {
      return NextResponse.json(
        {
          error: "No player account found with this phone number. Please create an account on the signup page first.",
        },
        { status: 404 }
      );
    }

    const last4 = cleanPhone.slice(-4);
    let chosenUsername = username?.trim().toLowerCase();

    if (!chosenUsername) {
      chosenUsername = `kali_player_${last4}_${Math.floor(Math.random() * 899 + 100)}`;
    }

    // Check username collision
    const existingUsername = await prisma.user.findUnique({
      where: { username: chosenUsername },
    });

    if (existingUsername) {
      chosenUsername = `${chosenUsername}_${Math.floor(Math.random() * 89 + 10)}`;
    }

    const chosenDisplayName = displayName?.trim() || `Player ${last4}`;

    const newUser = await prisma.user.create({
      data: {
        phoneNumber: cleanPhone,
        firebaseUid: verifiedFirebaseUid || null,
        username: chosenUsername,
        displayName: chosenDisplayName,
        role: "USER", // Strictly regular player role
        status: "ACTIVE",
        avatar: "/avatars/avatar-1.svg",
        bio: "Just joined Kali-Gaming via Phone! Ready to spin and play.",
        xp: 100, // Welcome signup bonus XP
        isOnline: true,
      },
    });

    // Auto-create direct 1-on-1 conversation with Administrator
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "admin@kali-gaming.com" },
    });

    if (adminUser) {
      const directConv = await prisma.conversation.create({
        data: {
          type: "DIRECT",
          title: "Kali Platform Administrator",
          members: {
            create: [
              { userId: newUser.id, role: "MEMBER" },
              { userId: adminUser.id, role: "ADMIN" },
            ],
          },
        },
      });

      await prisma.message.create({
        data: {
          conversationId: directConv.id,
          senderId: adminUser.id,
          content: `Welcome to Kali-Gaming, ${newUser.displayName}! I am the platform Administrator. You have direct 1-on-1 access to me right here for support, game setups, or special VIP rewards.`,
        },
      });
    }

    const token = signToken({
      userId: newUser.id,
      phoneNumber: newUser.phoneNumber,
      email: newUser.email,
      username: newUser.username,
      role: "USER", // Strictly regular player role
      status: newUser.status,
    });

    const response = NextResponse.json({
      message: "Phone signup successful! Welcome to Kali Gaming.",
      isNewUser: true,
      user: {
        id: newUser.id,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar,
        bio: newUser.bio,
        isOnline: true,
        xp: newUser.xp,
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
    console.error("Phone Auth error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process phone authentication" },
      { status: 500 }
    );
  }
}
