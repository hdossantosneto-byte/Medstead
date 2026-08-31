import { NextResponse } from "next/server";
import { clearUserCookie } from "@/lib/auth";

export async function POST() {
  clearUserCookie();
  return NextResponse.json({ ok: true });
}
