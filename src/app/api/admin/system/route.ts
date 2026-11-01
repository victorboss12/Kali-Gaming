import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionUser } from "@/lib/adminAuth";
import os from "os";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    // Measure DB query latency
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    const memUsage = process.memoryUsage();

    return NextResponse.json({
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memUsage.rss / 1024 / 1024),
        memoryHeapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryHeapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
        osTotalMemMb: Math.round(os.totalmem() / 1024 / 1024),
        osFreeMemMb: Math.round(os.freemem() / 1024 / 1024),
        dbStatus: "CONNECTED",
        dbLatencyMs,
        activePort: 3000,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch system telemetry" }, { status: 500 });
  }
}
