import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { username: { contains: search.toLowerCase() } },
              { displayName: { contains: search } },
              { email: { contains: search.toLowerCase() } },
              { phoneNumber: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        status: true,
        isOnline: true,
        xp: true,
        createdAt: true,
        gameAccounts: {
          select: {
            id: true,
            gameKey: true,
            gameUsername: true,
            gameUserId: true,
            lastKnownBalance: true,
            totalPointsLoaded: true,
            totalPointsWithdrawn: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
            spins: true,
            reportsReceived: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { userId, status, role } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status && ["ACTIVE", "MUTED", "BANNED"].includes(status)) {
      updateData.status = status;
    }
    if (role && ["USER", "MODERATOR", "ADMIN"].includes(role)) {
      updateData.role = role;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Record in Admin Audit Log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: `UPDATE_USER_STATUS`,
        targetType: "USER",
        targetId: userId,
        details: `Updated ${targetUser.username}: status=${status || targetUser.status}, role=${role || targetUser.role}`,
      },
    });

    return NextResponse.json({ message: "User status updated", user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
