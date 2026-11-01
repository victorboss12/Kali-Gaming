import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId || targetUserId === sessionUser.id) {
      return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || !targetUser.allowFriendRequests) {
      return NextResponse.json({ error: "User is not accepting friend requests" }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: sessionUser.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: sessionUser.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }
      if (existing.status === "PENDING") {
        return NextResponse.json({ error: "Friend request already pending" }, { status: 400 });
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: sessionUser.id,
        addresseeId: targetUserId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Friend request sent", friendship });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendshipId, action } = await req.json(); // action: "ACCEPT" | "DECLINE"
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.addresseeId !== sessionUser.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      });
      return NextResponse.json({ message: "Friend request accepted", friendship: updated });
    } else {
      await prisma.friendship.delete({
        where: { id: friendshipId },
      });
      return NextResponse.json({ message: "Friend request declined" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendshipId } = await req.json();
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (
      !friendship ||
      (friendship.requesterId !== sessionUser.id && friendship.addresseeId !== sessionUser.id)
    ) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return NextResponse.json({ message: "Friend removed" });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
