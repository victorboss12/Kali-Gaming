import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const auditLogs = await prisma.adminAuditLog.findMany({
      include: {
        admin: {
          select: { username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
