import { AppShell } from "@/components/app-shell";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell role={user.role} name={user.name} email={user.email} clinicOk={clinicApproved(user)}>
      {children}
    </AppShell>
  );
}
