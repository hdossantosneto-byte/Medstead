import Link from "next/link";
import { auth } from "@/lib/session";
import { CartBadge } from "./cart-badge";
import { NewOrderButton } from "./new-order-button";
import { Wordmark } from "./brand";
import { Button } from "./ui";

const links = [
  { href: "/freight", label: "Ship Now" },
  { href: "/track", label: "Track Package" },
  { href: "/orders", label: "Orders & Packages" },
  { href: "/contact", label: "Support" },
];

export async function PublicNav() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-30 border-b border-navy-900/8 bg-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Wordmark compact />
        <nav className="hidden items-center gap-5 text-sm font-medium text-navy-800 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-forest-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <CartBadge />
          <NewOrderButton className="min-h-tap px-3 text-xs sm:text-sm" />
          {session?.user ? (
            <Button href="/app" variant="primary">
              Workspace
            </Button>
          ) : (
            <>
              <Button href="/signup" variant="ghost" className="hidden min-h-tap sm:inline-flex">
                Sign up
              </Button>
              <Button href="/login">Sign in</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
