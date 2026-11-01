import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch session", details: err?.message }, { status: 500 });
  }
}
