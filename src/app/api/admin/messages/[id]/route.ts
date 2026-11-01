import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff clearance required" }, { status: 403 });
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
                status: true,
                xp: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
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

    return NextResponse.json({ conversation, messages });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff clearance required" }, { status: 403 });
    }

    const convId = params.id;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    // Verify admin is a member of this conversation
    let member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: convId,
          userId: admin.id,
        },
      },
    });

    if (!member) {
      // Auto-join if needed
      member = await prisma.conversationMember.create({
        data: {
          conversationId: convId,
          userId: admin.id,
          role: "ADMIN",
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: admin.id,
        content: content.trim(),
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
    console.error("Admin post message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
