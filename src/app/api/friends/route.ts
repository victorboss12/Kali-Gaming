import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: sessionUser.id },
          { addresseeId: sessionUser.id },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
            xp: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
            xp: true,
          },
        },
      },
    });

    const friends: any[] = [];
    const pendingIncoming: any[] = [];
    const pendingOutgoing: any[] = [];

    for (const f of friendships) {
      if (f.status === "ACCEPTED") {
        const friendUser = f.requesterId === sessionUser.id ? f.addressee : f.requester;
        friends.push({
          friendshipId: f.id,
          user: friendUser,
          since: f.updatedAt,
        });
      } else if (f.status === "PENDING") {
        if (f.addresseeId === sessionUser.id) {
          pendingIncoming.push({
            friendshipId: f.id,
            user: f.requester,
            createdAt: f.createdAt,
          });
        } else {
          pendingOutgoing.push({
            friendshipId: f.id,
            user: f.addressee,
            createdAt: f.createdAt,
          });
        }
      }
    }

    return NextResponse.json({
      friends,
      pendingIncoming,
      pendingOutgoing,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
