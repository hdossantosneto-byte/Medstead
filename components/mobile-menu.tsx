"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/freight", label: "Book a shipment" },
  { href: "/services", label: "Services" },
  { href: "/track", label: "Track package" },
  { href: "/orders", label: "Orders & Packages" },
  { href: "/warehouse", label: "Warehouse" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
  { href: "/contact", label: "Support" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex min-h-tap min-w-[44px] items-center justify-center rounded-full border border-navy-900/15 px-3 text-sm font-semibold"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-navy-900/10 bg-sand px-4 py-3 shadow-card">
          <ul className="grid gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex min-h-tap items-center rounded-xl px-3 text-sm font-semibold text-navy-900 hover:bg-white"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
