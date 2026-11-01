import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const [totalUsers, totalMessages, totalSpins, pendingReports, pendingDeposits] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.rewardSpin.count(),
      prisma.userReport.count({ where: { status: "PENDING" } }),
      prisma.paymentTransaction.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalMessages,
        totalSpins,
        pendingReports,
        pendingDeposits,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
