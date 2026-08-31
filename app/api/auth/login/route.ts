import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setUserCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginInput } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const parsed = loginInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });
  if (!user || !(await checkPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Those credentials do not match." }, { status: 401 });
  }

  setUserCookie(user.id);
  return NextResponse.json({ ok: true });
}
