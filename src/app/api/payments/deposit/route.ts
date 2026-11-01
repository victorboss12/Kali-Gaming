import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const DepositSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  chimeSenderTag: z.string().min(2, "Your Chime tag is required (e.g. $MyName)"),
  referenceNote: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a deposit" }, { status: 401 });
    }

    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = DepositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid deposit parameters" },
        { status: 400 }
      );
    }

    const { amount, chimeSenderTag, referenceNote } = parsed.data;

    // Fetch gateway rules
    const gateway = await prisma.paymentGatewaySetting.findUnique({
      where: { gatewayKey: "CHIME" },
    });

    if (gateway && !gateway.isEnabled) {
      return NextResponse.json(
        { error: "Chime gateway is temporarily in maintenance mode." },
        { status: 400 }
      );
    }

    if (gateway) {
      if (amount < gateway.minAmount) {
        return NextResponse.json(
          { error: `Minimum deposit amount is $${gateway.minAmount}` },
          { status: 400 }
        );
      }
      if (amount > gateway.maxAmount) {
        return NextResponse.json(
          { error: `Maximum deposit amount is $${gateway.maxAmount}` },
          { status: 400 }
        );
      }
    }

    // Create pending transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        gateway: "CHIME",
        amount,
        chimeSenderTag: chimeSenderTag.startsWith("$") ? chimeSenderTag : `$${chimeSenderTag}`,
        referenceNote: referenceNote || `Deposit via Chime from ${chimeSenderTag}`,
        status: "PENDING",
      },
    });

    // Notify Administrator in player's 1-on-1 direct conversation
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", email: "admin@kali-gaming.com" },
    });

    if (adminUser) {
      const directConv = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: user.id } } },
            { members: { some: { userId: adminUser.id } } },
          ],
        },
      });

      if (directConv) {
        await prisma.message.create({
          data: {
            conversationId: directConv.id,
            senderId: user.id,
            content: `💵 Deposit Submitted: I sent $${amount.toFixed(2)} via Chime (${chimeSenderTag}). Transaction Ref: #${transaction.id.slice(-6).toUpperCase()}. Please verify and credit my account!`,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: "Deposit submitted successfully. Verification in progress.",
      transaction,
    });
  } catch (err: any) {
    console.error("Deposit error:", err);
    return NextResponse.json({ error: "Failed to submit deposit" }, { status: 500 });
  }
}
