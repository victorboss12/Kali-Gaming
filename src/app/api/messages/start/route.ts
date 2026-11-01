import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "admin@kali-gaming.com" },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    // Only allow starting/opening chat with Admin (or if Admin is initiating to a player)
    const { recipientId } = await req.json();

    let targetId = recipientId;
    if (sessionUser.role !== "ADMIN") {
      // Non-admin players can ONLY chat with Admin
      targetId = adminUser.id;
    }

    if (!targetId || targetId === sessionUser.id) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    // Check if direct conversation exists between user and target
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { members: { some: { userId: sessionUser.id } } },
          { members: { some: { userId: targetId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    // Create new direct conversation with Admin
    const newConv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        title: "Kali Platform Administrator",
        members: {
          create: [
            { userId: sessionUser.id, role: "MEMBER" },
            { userId: targetId, role: sessionUser.role === "ADMIN" ? "MEMBER" : "ADMIN" },
          ],
        },
      },
    });

    return NextResponse.json({ conversationId: newConv.id });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to initialize conversation" }, { status: 500 });
  }
}
