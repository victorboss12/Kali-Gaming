import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff clearance required" }, { status: 403 });
    }

    // Query all 1-on-1 direct conversations involving regular players
    const conversationsRaw = await prisma.conversation.findMany({
      where: {
        type: "DIRECT",
        members: {
          some: {
            user: { role: "USER" },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                role: true,
                status: true,
                isOnline: true,
                xp: true,
                email: true,
                phoneNumber: true,
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
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Deduplicate by player ID so each player has strictly ONE channel
    const seenPlayerIds = new Set<string>();
    const conversations: any[] = [];

    for (const conv of conversationsRaw) {
      const playerMember = conv.members.find((mem) => mem.user?.role === "USER" || mem.userId !== admin.id);
      const player = playerMember?.user;
      if (!player) continue;

      if (seenPlayerIds.has(player.id)) continue;
      seenPlayerIds.add(player.id);

      conversations.push({
        id: conv.id,
        type: conv.type,
        updatedAt: conv.updatedAt,
        player,
        lastMessage: conv.messages[0] || null,
      });
    }

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("Admin fetch conversations error:", err);
    return NextResponse.json({ error: "Failed to fetch player conversations" }, { status: 500 });
  }
}
