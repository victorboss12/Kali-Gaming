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
    const status = searchParams.get("status");

    const transactions = await prisma.paymentTransaction.findMany({
      where: status && status !== "ALL" ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatar: true,
            xp: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { transactionId, action, adminNote } = await req.json();
    if (!transactionId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Valid transactionId and action (APPROVE/REJECT) required" }, { status: 400 });
    }

    const tx = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        adminNote: adminNote || (action === "APPROVE" ? "Deposit verified by Administrator." : "Deposit rejected by Administrator."),
      },
      include: { user: true },
    });

    // If approved, award XP/credits to player
    if (action === "APPROVE") {
      const totalPoints = tx.amount + (tx.bonusAmount || 0);
      const xpEarned = Math.round(tx.amount * 10);
      await prisma.user.update({
        where: { id: tx.userId },
        data: { xp: { increment: xpEarned } },
      });

      // Send congratulatory notification in 1-on-1 Admin direct conversation
      const directConv = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: tx.userId } } },
            { members: { some: { userId: admin.id } } },
          ],
        },
      });

      if (directConv) {
        const bonusText = tx.bonusAmount
          ? ` (+${tx.bonusPercentage}% Bonus: $${tx.bonusAmount.toFixed(2)} extra, Total: $${totalPoints.toFixed(2)})`
          : "";
        await prisma.message.create({
          data: {
            conversationId: directConv.id,
            senderId: admin.id,
            content: `🎉 Deposit Approved! Your Chime transfer of $${tx.amount.toFixed(2)}${bonusText} has been verified and credited (+${xpEarned} VIP XP awarded). Best of luck in the casino games!`,
          },
        }).catch(() => {});
      }
    }

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: `${action}_DEPOSIT`,
        targetType: "PAYMENT_TRANSACTION",
        targetId: transactionId,
        details: `${action} deposit of $${tx.amount} for user @${tx.user.username}. Note: ${adminNote || "None"}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      message: `Transaction ${newStatus.toLowerCase()} successfully`,
      transaction: updated,
    });
  } catch (err: any) {
    console.error("Admin transaction action error:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
