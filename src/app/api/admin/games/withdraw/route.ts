import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import { executeWithdraw } from "@/lib/games/service";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const { kaliUserId, gameKey, gameUsername, points } = body;

    if (!kaliUserId || !gameKey || !gameUsername || !points) {
      return NextResponse.json(
        { error: "Missing required fields: kaliUserId, gameKey, gameUsername, points" },
        { status: 400 }
      );
    }

    const numPoints = parseFloat(points);
    if (isNaN(numPoints) || numPoints <= 0) {
      return NextResponse.json({ error: "Points amount must be a positive number" }, { status: 400 });
    }

    const result = await executeWithdraw({
      kaliUserId,
      gameKey,
      gameUsername: gameUsername.trim(),
      points: numPoints,
      adminId: admin.id,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      transaction: result.transaction,
      apiResponse: result.apiResponse,
    });
  } catch (err: any) {
    console.error("Admin Game Withdraw Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute points withdrawal" },
      { status: 500 }
    );
  }
}
