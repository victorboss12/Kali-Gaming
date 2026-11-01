import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { ensureDefaultGameProviders } from "@/lib/games/service";
import { isLiveProviderConfigured } from "@/lib/games/client";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    await ensureDefaultGameProviders();

    const providers = await prisma.gameProviderConfig.findMany({
      orderBy: { displayName: "asc" },
    });

    const enriched = providers.map((p) => ({
      ...p,
      secretKey: p.secretKey ? "••••••••" + p.secretKey.slice(-4) : null,
      isConfigured: isLiveProviderConfigured(p),
    }));

    return NextResponse.json({ providers: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch providers" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Staff admin clearance required" }, { status: 403 });
    }

    const body = await req.json();
    const { gameKey, apiBaseUrl, agentId, secretKey, rateMultiplier, isEnabled, notes } = body;

    if (!gameKey) {
      return NextResponse.json({ error: "gameKey is required" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (apiBaseUrl !== undefined) dataToUpdate.apiBaseUrl = apiBaseUrl.trim();
    if (agentId !== undefined) dataToUpdate.agentId = agentId.trim();
    if (secretKey !== undefined && !secretKey.startsWith("••••••••")) {
      dataToUpdate.secretKey = secretKey.trim();
    }
    if (rateMultiplier !== undefined) dataToUpdate.rateMultiplier = parseFloat(rateMultiplier);
    if (isEnabled !== undefined) dataToUpdate.isEnabled = Boolean(isEnabled);
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.gameProviderConfig.update({
      where: { gameKey },
      data: dataToUpdate,
    });

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_GAME_PROVIDER",
        targetType: "GAME_PROVIDER",
        targetId: updated.id,
        details: `Updated API configuration for ${updated.displayName} (${updated.gameKey})`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      provider: {
        ...updated,
        secretKey: updated.secretKey ? "••••••••" + updated.secretKey.slice(-4) : null,
        isConfigured: isLiveProviderConfigured(updated),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update provider" }, { status: 500 });
  }
}
