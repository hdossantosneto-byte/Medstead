import { CLINIC_ROLES } from "@/lib/constants";
import { auth } from "@/lib/session";
import { Button } from "./ui";

export async function NewOrderButton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  const href = CLINIC_ROLES.includes(role as (typeof CLINIC_ROLES)[number])
    ? "/app/clinic/catalog"
    : "/freight";
  return (
    <Button href={href} variant={variant} className={className}>
      + New order
    </Button>
  );
}
