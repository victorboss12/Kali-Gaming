import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminSessionUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized staff session" }, { status: 401 });
    }

    return NextResponse.json({ admin });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to verify admin session" }, { status: 500 });
  }
}
