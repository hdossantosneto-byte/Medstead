import Link from "next/link";
import type { Role } from "@prisma/client";
import { CLINIC_ROLES, ROLE_LABEL } from "@/lib/constants";
import { Wordmark } from "./brand";
import { OpsBottomNav } from "./ops-bottom-nav";
import { SignOutButton } from "./sign-out-button";

type NavItem = { href: string; label: string };

function navFor(role: Role, clinicOk: boolean): NavItem[] {
  const base: NavItem[] = [{ href: "/app", label: "Do this next" }];
  if (role === "PUBLIC" || role === "CUSTOMER") {
    base.push(
      { href: "/orders", label: "Orders & Packages" },
      { href: "/freight", label: "New order" },
      { href: "/app/customer", label: "My freight" },
      { href: "/track", label: "Track" },
    );
  }
  if (CLINIC_ROLES.includes(role)) {
    if (clinicOk) {
      base.push(
        { href: "/app/clinic/catalog", label: "Shop" },
        { href: "/app/clinic/orders", label: "Your orders" },
      );
    } else {
      base.push({ href: "/app/clinic/pending", label: "Approval status" });
    }
  }
  if (role === "MEDSTEAD_ADMIN") {
    base.push(
      { href: "/app/admin/crm", label: "CRM" },
      { href: "/app/admin/clinics", label: "Clinics" },
      { href: "/app/admin/approvals", label: "Approvals" },
      { href: "/app/admin/orders", label: "Orders" },
      { href: "/app/admin/invoices", label: "Invoices" },
      { href: "/app/admin/manifests", label: "Manifests" },
    );
  }
  if (role === "FINANCE") {
    base.push(
      { href: "/app/finance/quotes", label: "Quotes" },
      { href: "/app/finance/invoices", label: "Invoices" },
      { href: "/app/finance/payments", label: "Payments" },
      { href: "/app/finance/reports", label: "Reports" },
    );
  }
  if (role === "MEDSTEAD_ADMIN" || role === "FINANCE") {
    base.push({ href: "/app/flights", label: "Flight ops" });
  }
  return base;
}

export function AppShell({
  role,
  name,
  clinicOk,
  children,
}: {
  role: Role;
  name: string;
  clinicOk: boolean;
  children: React.ReactNode;
}) {
  const ops = role === "OPS";
  const items = ops ? [] : navFor(role, clinicOk);
  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-20 border-b border-navy-900/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2">
          <Wordmark href={ops ? "/app/ops" : "/app"} compact />
          <p className="hidden text-xs font-medium text-navy-800/60 sm:block">
            {name} · {ROLE_LABEL[role]}
          </p>
          <SignOutButton />
        </div>
        {items.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-tap shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-forest-50 hover:text-forest-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className={`mx-auto max-w-6xl px-4 py-6 ${ops ? "pb-28" : "pb-10"}`}>{children}</main>
      {ops && <OpsBottomNav />}
    </div>
  );
}
