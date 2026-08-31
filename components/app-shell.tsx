import Link from "next/link";
import type { Role } from "@prisma/client";
import { CLINIC_ROLES, ROLE_LABEL } from "@/lib/constants";
import { Wordmark } from "./brand";
import { SignOutButton } from "./sign-out-button";

type NavItem = { href: string; label: string };

function navFor(role: Role, clinicOk: boolean): NavItem[] {
  const base: NavItem[] = [{ href: "/app", label: "Home" }];
  if (role === "PUBLIC" || role === "CUSTOMER") {
    base.push(
      { href: "/freight", label: "New quote" },
      { href: "/app/customer", label: "My freight" },
      { href: "/track", label: "Track" },
      { href: "/warehouse", label: "Warehouse" },
      { href: "/rewards", label: "Rewards" },
    );
  }
  if (CLINIC_ROLES.includes(role)) {
    if (clinicOk) {
      base.push(
        { href: "/app/clinic/catalog", label: "Catalog" },
        { href: "/app/clinic/orders", label: "Orders" },
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
  if (role === "OPS") {
    base.push(
      { href: "/app/ops/catalog", label: "Catalog" },
      { href: "/app/ops/orders", label: "Orders" },
      { href: "/app/ops/inventory", label: "Inventory" },
      { href: "/app/ops/shipping", label: "Shipping" },
      { href: "/app/ops/compliance", label: "Compliance" },
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
  if (role === "MEDSTEAD_ADMIN" || role === "OPS" || role === "FINANCE") {
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
  const items = navFor(role, clinicOk);
  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-20 border-b border-navy-900/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Wordmark href="/app" compact />
          <p className="hidden text-xs font-medium text-navy-800/60 md:block">
            {name} · {ROLE_LABEL[role]}
          </p>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-teal-50 hover:text-teal-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
