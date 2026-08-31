export function homePathForRole(role?: string | null) {
  if (role === "OPS") return "/app/ops";
  if (role === "PILOT") return "/app";
  if (role === "SALES") return "/app";
  if (role === "CUSTOMER" || role === "PUBLIC") return "/app";
  return "/app";
}
