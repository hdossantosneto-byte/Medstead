import { NextRequest, NextResponse } from "next/server";
import { opsDeskCookie, opsPinOk } from "@/lib/ops-desk";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!opsPinOk(body.pin ?? "")) {
    return NextResponse.json({ error: "PIN not accepted" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opsDeskCookie());
  return res;
}
