import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const reports = await prisma.userReport.findMany({
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        reportedUser: {
          select: { id: true, username: true, displayName: true, avatar: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { reportId, status, adminNotes, actionTaken } = await req.json();

    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
      include: { reportedUser: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Optionally apply penalty to reported user directly from moderation modal
    if (actionTaken === "MUTE") {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { status: "MUTED" },
      });
    } else if (actionTaken === "BAN") {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { status: "BANNED" },
      });
    }

    const updated = await prisma.userReport.update({
      where: { id: reportId },
      data: {
        status: status || "RESOLVED",
        adminNotes: adminNotes || undefined,
      },
    });

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: `RESOLVE_REPORT`,
        targetType: "USER_REPORT",
        targetId: reportId,
        details: `Report #${reportId} status=${status}, actionTaken=${actionTaken || "NONE"}, notes=${adminNotes || "N/A"}`,
      },
    });

    return NextResponse.json({ message: "Report updated", report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
