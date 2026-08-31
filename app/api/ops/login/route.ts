import { NextRequest, NextResponse } from "next/server";
import { opsPinOk, setOpsCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { pin?: string };
  if (!body.pin || !opsPinOk(body.pin)) {
    return NextResponse.json({ error: "PIN not accepted" }, { status: 401 });
  }
  setOpsCookie();
  return NextResponse.json({ ok: true });
}
