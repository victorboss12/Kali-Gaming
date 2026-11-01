import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const gameKey = searchParams.get("gameKey");
    const userId = searchParams.get("userId");

    const transactions = await prisma.gamePointsTransaction.findMany({
      where: {
        status: status && status !== "ALL" ? status : undefined,
        gameKey: gameKey && gameKey !== "ALL" ? gameKey : undefined,
        userId: userId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch transactions" }, { status: 500 });
  }
}
