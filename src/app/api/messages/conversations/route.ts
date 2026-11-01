import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "admin@kali-gaming.com" },
    });

    // Ensure direct conversation with Admin exists for regular players
    if (adminUser && sessionUser.id !== adminUser.id) {
      let adminDirect = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: sessionUser.id } } },
            { members: { some: { userId: adminUser.id } } },
          ],
        },
      });

      if (!adminDirect) {
        adminDirect = await prisma.conversation.create({
          data: {
            type: "DIRECT",
            title: "Kali Platform Administrator",
            members: {
              create: [
                { userId: sessionUser.id, role: "MEMBER" },
                { userId: adminUser.id, role: "ADMIN" },
              ],
            },
          },
        });

        await prisma.message.create({
          data: {
            conversationId: adminDirect.id,
            senderId: adminUser.id,
            content: `Welcome to Kali-Gaming, ${sessionUser.displayName}! I am the platform Administrator. Reach out directly to me anytime right here for instant game setup, credit assistance, or VIP reward inquiries.`,
          },
        });
      }
    }

    // Query conversation memberships
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: sessionUser.id },
      include: {
        conversation: {
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
                    email: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              include: {
                sender: {
                  select: {
                    displayName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const conversations = memberships
      .map((m) => {
        const conv = m.conversation;
        const otherMembers = conv.members.filter((mem) => mem.userId !== sessionUser.id);
        const otherUser = otherMembers[0]?.user;
        let title = conv.title;
        let avatar = conv.icon;
        let isAdminChat = false;

        if (otherUser) {
          title = otherUser.displayName;
          avatar = otherUser.avatar;
          if (otherUser.role === "ADMIN" || otherUser.email === "admin@kali-gaming.com") {
            isAdminChat = true;
            title = "Kali Admin (Official Staff)";
            avatar = "/avatars/avatar-admin.svg";
          }
        }

        return {
          id: conv.id,
          type: "DIRECT",
          title,
          avatar,
          isAdminChat,
          membersCount: conv.members.length,
          otherUser: otherUser || null,
          lastMessage: conv.messages[0] || null,
          myRole: m.role,
          updatedAt: conv.updatedAt,
        };
      })
      // Filter: Non-admin users ONLY see their chat with the Admin
      .filter((c) => {
        if (sessionUser.role === "ADMIN") return true;
        return c.isAdminChat;
      });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
