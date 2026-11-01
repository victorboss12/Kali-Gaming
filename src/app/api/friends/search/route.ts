import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: sessionUser?.id || "" } },
          { status: "ACTIVE" },
          {
            OR: [
              { username: { contains: query.toLowerCase() } },
              { displayName: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        xp: true,
        role: true,
      },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
