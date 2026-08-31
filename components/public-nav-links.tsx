"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/format";
import { MARKETING_NAV } from "./marketing";

export function PublicNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <>
      {MARKETING_NAV.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={clsx(
              "text-sm font-medium transition",
              active ? "text-forest-700" : "text-navy-800 hover:text-forest-700",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
