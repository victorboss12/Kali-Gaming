import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    const supportAgent = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "support@kali-gaming.com" },
    });

    if (!sessionUser) {
      // Return default replica conversation matching kali-gaming.com/support
      return NextResponse.json({
        conversation: null,
        messages: [
          { id: "seed-1", senderId: "agent", content: "Wanna Play Now", isAgent: true },
          { id: "seed-2", senderId: "guest", content: "Yes", isAgent: false },
          { id: "seed-3", senderId: "agent", content: "which Game", isAgent: true },
          { id: "seed-4", senderId: "guest", content: "Milkyway", isAgent: false },
        ],
        isGuest: true,
      });
    }

    // Find user's support ticket conversation
    let conv = await prisma.conversation.findFirst({
      where: {
        type: "SUPPORT",
        members: { some: { userId: sessionUser.id } },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conv) {
      // Create support ticket
      conv = await prisma.conversation.create({
        data: {
          type: "SUPPORT",
          title: `Support Ticket - ${sessionUser.displayName}`,
          members: {
            create: [
              { userId: sessionUser.id, role: "MEMBER" },
              ...(supportAgent ? [{ userId: supportAgent.id, role: "ADMIN" }] : []),
            ],
          },
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Send greeting from official support agent
      if (supportAgent) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: supportAgent.id,
            content: "Hello! Welcome to Kali-Gaming Live Support. Wanna Play Now, or need help with a game setup or rewards claim?",
          },
        });

        // Re-fetch with greeting
        const updated = await prisma.conversation.findUnique({
          where: { id: conv.id },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    displayName: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
            },
          },
        });
        if (updated) conv = updated;
      }
    }

    return NextResponse.json({
      conversation: conv,
      messages: conv?.messages || [],
      isGuest: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load support" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const { content, conversationId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const supportAgent = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "support@kali-gaming.com" },
    });

    let currentConvId = conversationId;

    if (!currentConvId && sessionUser) {
      const conv = await prisma.conversation.findFirst({
        where: {
          type: "SUPPORT",
          members: { some: { userId: sessionUser.id } },
        },
      });
      if (conv) currentConvId = conv.id;
    }

    if (!currentConvId && sessionUser) {
      const newConv = await prisma.conversation.create({
        data: {
          type: "SUPPORT",
          title: `Support Ticket - ${sessionUser.displayName}`,
          members: {
            create: [
              { userId: sessionUser.id, role: "MEMBER" },
              ...(supportAgent ? [{ userId: supportAgent.id, role: "ADMIN" }] : []),
            ],
          },
        },
      });
      currentConvId = newConv.id;
    }

    if (sessionUser && currentConvId) {
      const userMessage = await prisma.message.create({
        data: {
          conversationId: currentConvId,
          senderId: sessionUser.id,
          content: content.trim(),
        },
        include: {
          sender: {
            select: { id: true, displayName: true, avatar: true, role: true },
          },
        },
      });

      // Automated Support Agent response logic matching kali-gaming.com
      let botReply: string | null = null;
      const lower = content.toLowerCase();

      if (lower === "yes" || lower.includes("wanna play")) {
        botReply = "which Game";
      } else if (lower.includes("milkyway")) {
        botReply = "Great choice! Milkyway is ready. You can download or play immediately at http://milkywayapp.xyz, or tell us if you need credentials.";
      } else if (lower.includes("juwa")) {
        botReply = "Juwa 777 is active! Download link: https://dl.juwa777.com. Let us know if you need assistance logging in.";
      } else if (lower.includes("firekirin")) {
        botReply = "Firekirin table is online! Play at https://firekirin.online. Our staff is on standby.";
      } else if (lower.includes("orion")) {
        botReply = "Orion Stars is available at https://orionstarsonline.com.";
      } else {
        botReply = "Thank you for messaging Kali Gaming support. Our official agent has received your inquiry and is assisting you shortly.";
      }

      if (botReply && supportAgent) {
        await prisma.message.create({
          data: {
            conversationId: currentConvId,
            senderId: supportAgent.id,
            content: botReply,
          },
        });
      }

      return NextResponse.json({ success: true, message: userMessage });
    }

    // Guest response fallback
    return NextResponse.json({
      success: true,
      guestReply: "Message sent to Kali Gaming. Please log in to view agent updates in real-time.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to send support message" }, { status: 500 });
  }
}
