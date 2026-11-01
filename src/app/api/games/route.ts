import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureDefaultGameProviders } from "@/lib/games/service";

export async function GET() {
  try {
    await ensureDefaultGameProviders();

    const games = await prisma.gameProviderConfig.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        gameKey: true,
        displayName: true,
        category: true,
        imageUrl: true,
        playUrl: true,
        downloadUrl: true,
        scheme: true,
        androidPackage: true,
        isPopular: true,
        sortOrder: true,
        isEnabled: true,
      },
    });

    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load games catalog" }, { status: 500 });
  }
}
