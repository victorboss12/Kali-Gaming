import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convId = params.id;
    const conversation = await prisma.conversation.findUnique({
      where: { id: convId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isMember = conversation.members.some((m) => m.userId === sessionUser.id);
    if (!isMember) {
      if (conversation.isPublic) {
        // Auto-join public rooms
        await prisma.conversationMember.create({
          data: {
            conversationId: convId,
            userId: sessionUser.id,
            role: "MEMBER",
          },
        });
      } else {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const hasAdmin = conversation.members.some(
      (m) => m.user.role === "ADMIN"
    );
    if (!hasAdmin && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chat is strictly restricted to 1-on-1 communication with the Kali Platform Administrator." },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        reactions: true,
      },
    });

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load conversation messages" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.status === "BANNED" || sessionUser.status === "MUTED") {
      return NextResponse.json({ error: "You are not permitted to send messages" }, { status: 403 });
    }

    const convId = params.id;
    const body = await req.json();
    const { content, attachmentUrl, attachmentType } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: convId,
          userId: sessionUser.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 });
    }

    const convMembers = await prisma.conversationMember.findMany({
      where: { conversationId: convId },
      include: { user: { select: { role: true } } },
    });

    const hasAdmin = convMembers.some((m) => m.user.role === "ADMIN");
    if (!hasAdmin && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chat is strictly restricted to 1-on-1 communication with the Kali Platform Administrator." },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: sessionUser.id,
        content: content.trim(),
        attachmentUrl,
        attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        reactions: true,
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
