import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const rewards = await prisma.rewardDefinition.findMany({
      include: {
        _count: {
          select: { spins: true, users: true },
        },
      },
      orderBy: { segmentIndex: "asc" },
    });

    return NextResponse.json({ rewards });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { id, name, description, probability, xpValue, colorHex, isActive } = await req.json();

    const updated = await prisma.rewardDefinition.update({
      where: { id },
      data: {
        name,
        description,
        probability: probability !== undefined ? parseFloat(probability) : undefined,
        xpValue: xpValue !== undefined ? parseInt(xpValue, 10) : undefined,
        colorHex,
        isActive,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: `UPDATE_REWARD_DEF`,
        targetType: "REWARD_DEFINITION",
        targetId: id,
        details: `Updated reward ${updated.name}: prob=${updated.probability}, xp=${updated.xpValue}`,
      },
    });

    return NextResponse.json({ message: "Reward configuration saved", reward: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update reward" }, { status: 500 });
  }
}
