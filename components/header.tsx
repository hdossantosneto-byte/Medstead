"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Ship Now" },
  { href: "/track", label: "Track Package" },
  { href: "/support", label: "Support" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="rounded-full bg-white px-2.5 py-1">
          <Logo size="header" />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/services"
            className="relative rounded-full bg-[#DBEAFE] px-3 py-1.5 text-xs font-semibold text-brand-blue"
          >
            What&apos;s New
            <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
              v1.0
            </span>
          </Link>
          <Link href="/account" className="px-2 text-sm font-medium text-white/80 hover:text-white">
            {signedIn ? "Account" : "Login"}
          </Link>
          {!signedIn && (
            <Link
              href="/account?tab=signup"
              className="inline-flex min-h-tap items-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-white hover:bg-forest-700"
            >
              Sign Up Free
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex min-h-tap min-w-[44px] items-center justify-center rounded-lg border border-white/15 lg:hidden"
          aria-expanded={open}
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 lg:hidden">
          <nav className="grid gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="min-h-tap rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="min-h-tap rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              {signedIn ? "Account" : "Login"}
            </Link>
            {!signedIn && (
              <Link
                href="/account?tab=signup"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex min-h-tap items-center justify-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-white"
              >
                Sign Up Free
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
