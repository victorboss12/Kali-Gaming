import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { ensureDefaultGameProviders } from "@/lib/games/service";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    await ensureDefaultGameProviders();

    const games = await prisma.gameProviderConfig.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    // Count player accounts per game
    const accountsCount = await prisma.playerGameAccount.groupBy({
      by: ["gameKey"],
      _count: { id: true },
    });

    const countsMap = new Map<string, number>();
    accountsCount.forEach((c) => {
      countsMap.set(c.gameKey, c._count.id);
    });

    const enrichedGames = games.map((g) => ({
      ...g,
      playerCount: countsMap.get(g.gameKey) || 0,
      hasApiCredentials: !!(g.apiBaseUrl && g.agentId && g.secretKey),
    }));

    return NextResponse.json({ games: enrichedGames });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch games catalog" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      gameKey,
      displayName,
      category,
      imageUrl,
      playUrl,
      downloadUrl,
      scheme,
      androidPackage,
      isPopular,
      isEnabled,
      apiBaseUrl,
      agentId,
      secretKey,
    } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    // Auto-derive clean gameKey slug if not provided
    const cleanKey = (gameKey || displayName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    if (!cleanKey) {
      return NextResponse.json({ error: "A valid unique game key is required" }, { status: 400 });
    }

    const existing = await prisma.gameProviderConfig.findUnique({
      where: { gameKey: cleanKey },
    });

    if (existing) {
      return NextResponse.json({ error: `Game with key '${cleanKey}' already exists` }, { status: 400 });
    }

    const defaultScheme = scheme?.trim() || `${cleanKey}://`;
    const defaultPlayUrl = playUrl?.trim() || downloadUrl?.trim() || "http://download.gamevault999.com";
    const defaultDownloadUrl = downloadUrl?.trim() || playUrl?.trim() || defaultPlayUrl;
    const defaultImage = imageUrl?.trim() || "https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw";

    const game = await prisma.gameProviderConfig.create({
      data: {
        gameKey: cleanKey,
        displayName: displayName.trim(),
        category: category?.trim() || "Outsourced Sweeps",
        imageUrl: defaultImage,
        playUrl: defaultPlayUrl,
        downloadUrl: defaultDownloadUrl,
        scheme: defaultScheme,
        androidPackage: androidPackage?.trim() || undefined,
        isPopular: !!isPopular,
        isEnabled: isEnabled !== undefined ? !!isEnabled : true,
        apiBaseUrl: apiBaseUrl?.trim() || undefined,
        agentId: agentId?.trim() || undefined,
        secretKey: secretKey?.trim() || undefined,
      },
    });

    return NextResponse.json({ success: true, game, message: `Game '${displayName}' added successfully!` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add new game" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      gameKey,
      displayName,
      category,
      imageUrl,
      playUrl,
      downloadUrl,
      scheme,
      androidPackage,
      isPopular,
      isEnabled,
      apiBaseUrl,
      agentId,
      secretKey,
    } = body;

    if (!id && !gameKey) {
      return NextResponse.json({ error: "Game ID or gameKey is required" }, { status: 400 });
    }

    const where = id ? { id } : { gameKey };

    const existing = await prisma.gameProviderConfig.findUnique({ where });
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const updated = await prisma.gameProviderConfig.update({
      where,
      data: {
        displayName: displayName !== undefined ? displayName.trim() : undefined,
        category: category !== undefined ? category.trim() : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
        playUrl: playUrl !== undefined ? playUrl.trim() : undefined,
        downloadUrl: downloadUrl !== undefined ? downloadUrl.trim() : undefined,
        scheme: scheme !== undefined ? scheme.trim() : undefined,
        androidPackage: androidPackage !== undefined ? (androidPackage ? androidPackage.trim() : null) : undefined,
        isPopular: isPopular !== undefined ? !!isPopular : undefined,
        isEnabled: isEnabled !== undefined ? !!isEnabled : undefined,
        apiBaseUrl: apiBaseUrl !== undefined ? (apiBaseUrl ? apiBaseUrl.trim() : null) : undefined,
        agentId: agentId !== undefined ? (agentId ? agentId.trim() : null) : undefined,
        secretKey: secretKey !== undefined ? (secretKey ? secretKey.trim() : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, game: updated, message: `Game updated successfully!` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update game" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const gameKey = searchParams.get("gameKey");

    if (!id && !gameKey) {
      return NextResponse.json({ error: "Game ID or gameKey parameter is required" }, { status: 400 });
    }

    const where = id ? { id } : { gameKey: gameKey! };

    const game = await prisma.gameProviderConfig.findUnique({ where });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Safely delete associated linked accounts or notify
    await prisma.playerGameAccount.deleteMany({
      where: { gameKey: game.gameKey },
    });

    await prisma.gameProviderConfig.delete({
      where,
    });

    return NextResponse.json({
      success: true,
      message: `Game '${game.displayName}' was successfully removed from the catalog.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove game" }, { status: 500 });
  }
}
