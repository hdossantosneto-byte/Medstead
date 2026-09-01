import { cookies } from "next/headers";

const COOKIE = "medstead_ops_desk";

export function opsDeskPin() {
  return process.env.OPS_PIN || "local-ops";
}

export function opsPinOk(pin: string) {
  return pin.trim() === opsDeskPin();
}

export function isOpsDesk() {
  return cookies().get(COOKIE)?.value === "1";
}

export function opsDeskCookie() {
  return {
    name: COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export function clearOpsDeskCookie() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
