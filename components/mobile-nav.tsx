"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Ship" },
  { href: "/track", label: "Track" },
  { href: "/account", label: "Account" },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/ops")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-900/10 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex min-h-tap min-w-[64px] flex-col items-center justify-center rounded-lg px-3 text-xs font-semibold ${
                  active ? "text-brand-green" : "text-navy-800/55"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
