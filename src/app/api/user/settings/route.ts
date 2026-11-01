import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, AUTH_COOKIE_NAME } from "@/lib/auth";
import { ProfileUpdateSchema } from "@/types";

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: parsed.data,
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatar: true,
        soundEnabled: true,
        allowFriendRequests: true,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user cascades to memberships, messages, etc.
    await prisma.user.delete({
      where: { id: sessionUser.id },
    });

    const response = NextResponse.json({ message: "Account deleted successfully" });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
