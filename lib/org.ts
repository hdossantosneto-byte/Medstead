/** Del owns flight dispatch. Chris and other OPS own warehouse pick/pack. */
export function isDel(user: { email?: string | null; name?: string | null }) {
  const email = (user.email ?? "").toLowerCase();
  const name = (user.name ?? "").trim().toLowerCase();
  return email.startsWith("del@") || name === "del";
}

export function isPilot(user: { role?: string | null; email?: string | null }) {
  const email = (user.email ?? "").toLowerCase();
  return user.role === "PILOT" || email.startsWith("pilot@");
}
