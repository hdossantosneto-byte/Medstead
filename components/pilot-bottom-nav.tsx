"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/format";

const TABS = [
  { href: "/app", label: "Next", match: (p: string) => p === "/app" },
  { href: "/app/flights", label: "Board", match: (p: string) => p.startsWith("/app/flights") },
];

export function PilotBottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-2">
        {TABS.map((tab) => {
          const on = tab.match(path);
          return (
            <li key={tab.href}>
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
