import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: false, lastSeenAt: new Date() },
      }).catch(() => {});
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
