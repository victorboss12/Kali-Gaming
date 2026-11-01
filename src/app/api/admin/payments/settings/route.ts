import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    let setting = await prisma.paymentGatewaySetting.findUnique({
      where: { gatewayKey: "CHIME" },
    });

    if (!setting) {
      setting = await prisma.paymentGatewaySetting.create({
        data: {
          gatewayKey: "CHIME",
          title: "Chime Instant Pay",
          chimeTag: "$KaliGamingPay",
          accountName: "Kali Gaming Official Cashier",
          instructions: "Send payment via Chime app. Please include your Kali username in the 'For' note for instant crediting.",
          qrCodeUrl: "/chime-qr.svg",
          isEnabled: true,
          minAmount: 10.0,
          maxAmount: 2000.0,
          note: "Deposits are verified & credited within 2-5 minutes.",
        },
      });
    }

    return NextResponse.json({ setting });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load payment settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      chimeTag,
      accountName,
      instructions,
      qrCodeUrl,
      minAmount,
      maxAmount,
      note,
      isEnabled,
    } = body;

    const updated = await prisma.paymentGatewaySetting.upsert({
      where: { gatewayKey: "CHIME" },
      update: {
        title: title !== undefined ? title : undefined,
        chimeTag: chimeTag !== undefined ? chimeTag : undefined,
        accountName: accountName !== undefined ? accountName : undefined,
        instructions: instructions !== undefined ? instructions : undefined,
        qrCodeUrl: qrCodeUrl !== undefined ? qrCodeUrl : undefined,
        minAmount: minAmount !== undefined ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount !== undefined ? parseFloat(maxAmount) : undefined,
        note: note !== undefined ? note : undefined,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
      },
      create: {
        gatewayKey: "CHIME",
        title: title || "Chime Instant Pay",
        chimeTag: chimeTag || "$KaliGamingPay",
        accountName: accountName || "Kali Gaming Official Cashier",
        instructions: instructions || "Send payment via Chime app.",
        qrCodeUrl: qrCodeUrl || "/chime-qr.svg",
        minAmount: minAmount ? parseFloat(minAmount) : 10.0,
        maxAmount: maxAmount ? parseFloat(maxAmount) : 2000.0,
        note: note || "Deposits are verified & credited within 2-5 minutes.",
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      },
    });

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_PAYMENT_GATEWAY",
        targetType: "PAYMENT_GATEWAY_SETTING",
        targetId: updated.id,
        details: `Updated Chime gateway: tag=${updated.chimeTag}, QR=${updated.qrCodeUrl}, enabled=${updated.isEnabled}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      message: "Payment gateway & QR settings updated successfully",
      setting: updated,
    });
  } catch (err: any) {
    console.error("Admin update payment error:", err);
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 });
  }
}
