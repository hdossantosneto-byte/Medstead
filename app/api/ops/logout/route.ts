import { NextResponse } from "next/server";
import { clearOpsDeskCookie } from "@/lib/ops-desk";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearOpsDeskCookie());
  return res;
}
