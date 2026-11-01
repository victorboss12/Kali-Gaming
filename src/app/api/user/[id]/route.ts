import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser(req);
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeenAt: true,
        role: true,
        xp: true,
        createdAt: true,
        rewards: {
          include: {
            reward: true,
          },
          orderBy: { acquiredAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let friendshipStatus: string | null = null;
    if (sessionUser && sessionUser.id !== userId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: sessionUser.id, addresseeId: userId },
            { requesterId: userId, addresseeId: sessionUser.id },
          ],
        },
      });
      if (friendship) {
        friendshipStatus = friendship.status;
      }
    }

    return NextResponse.json({
      user,
      isOwnProfile: sessionUser?.id === userId,
      friendshipStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
