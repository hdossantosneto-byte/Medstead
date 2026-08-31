"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_GET_STARTED } from "@/lib/constants";
import { MARKETING_NAV } from "./marketing";

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-navy-900/10 text-navy-900"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">Menu</span>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-[72px] border-b border-navy-900/8 bg-white px-4 py-4 shadow-tile">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-navy-900 hover:bg-sand"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={APP_GET_STARTED}
              className="mt-2 inline-flex min-h-tap items-center justify-center rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white"
            >
              Get Started
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
