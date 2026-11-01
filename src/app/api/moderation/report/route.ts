import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { UserReportSchema } from "@/types";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UserReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid report data" }, { status: 400 });
    }

    const { reportedUserId, messageId, reason } = parsed.data;

    const report = await prisma.userReport.create({
      data: {
        reporterId: sessionUser.id,
        reportedUserId,
        messageId,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Report filed successfully", reportId: report.id });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
