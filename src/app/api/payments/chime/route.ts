import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
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

    return NextResponse.json({ gateway: setting });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load payment gateway" }, { status: 500 });
  }
}
