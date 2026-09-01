"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/format";

const WAREHOUSE_TABS = [
  { href: "/app/ops", label: "Home", match: (p: string) => p === "/app/ops" },
  { href: "/app", label: "Next", match: (p: string) => p === "/app" },
  { href: "/app/orders", label: "Orders", match: (p: string) => p === "/app/orders" || p.startsWith("/app/ops/orders") },
  { href: "/app/ops/packages", label: "Packages", match: (p: string) => p.startsWith("/app/ops/packages") || p.startsWith("/app/ops/shipping") },
  { href: "/app/ops/more", label: "More", match: (p: string) => p.startsWith("/app/ops/more") || p.startsWith("/app/flights") || p.startsWith("/app/travel") || p.startsWith("/app/ops/inventory") || p.startsWith("/app/ops/compliance") || p.startsWith("/app/ops/catalog") },
];

const DISPATCH_TABS = [
  { href: "/app/ops", label: "Home", match: (p: string) => p === "/app/ops" },
  { href: "/app/flights", label: "Dispatch", match: (p: string) => p.startsWith("/app/flights") },
  { href: "/app/orders", label: "Orders", match: (p: string) => p === "/app/orders" || p.startsWith("/app/ops/orders") },
  { href: "/app/ops/packages", label: "Packages", match: (p: string) => p.startsWith("/app/ops/packages") || p.startsWith("/app/ops/shipping") },
  { href: "/app/ops/more", label: "More", match: (p: string) => p.startsWith("/app/ops/more") || p.startsWith("/app/travel") || p.startsWith("/app/ops/inventory") || p.startsWith("/app/ops/compliance") || p.startsWith("/app/ops/catalog") || p === "/app" },
];

export function OpsBottomNav({ del = false }: { del?: boolean }) {
  const path = usePathname();
  const tabs = del ? DISPATCH_TABS : WAREHOUSE_TABS;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const on = tab.match(path);
          return (
            <li key={tab.href + tab.label}>
              <Link
                href={tab.href}
                className={clsx(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  on ? "text-forest-700" : "text-navy-800/55",
                )}
              >
                <span className={clsx("h-1.5 w-1.5 rounded-full", on ? "bg-forest-600" : "bg-transparent")} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
