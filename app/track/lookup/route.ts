import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) return NextResponse.redirect(new URL("/track", req.url));
  return NextResponse.redirect(new URL(`/track/${encodeURIComponent(code)}`, req.url));
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const code = String(form.get("code") ?? "").trim();
  if (!code) return NextResponse.redirect(new URL("/track", req.url));
  return NextResponse.redirect(new URL(`/track/${encodeURIComponent(code)}`, req.url));
}
