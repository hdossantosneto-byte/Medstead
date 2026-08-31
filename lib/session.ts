import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "./auth-options";
import { CLINIC_ROLES } from "./constants";
import { prisma } from "./prisma";

export { authOptions };

export async function auth() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { clinic: true },
  });
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/app");
  return user;
}

export function clinicApproved(user: {
  role: Role;
  active: boolean;
  clinic: { approved: boolean } | null;
}) {
  if (!CLINIC_ROLES.includes(user.role)) return true;
  return user.active && Boolean(user.clinic?.approved);
}
