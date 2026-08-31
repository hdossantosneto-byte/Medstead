import Link from "next/link";
import { auth } from "@/lib/session";
import { Wordmark } from "./brand";
import { Button } from "./ui";

const links = [
  { href: "/orders", label: "Orders & Packages" },
  { href: "/freight", label: "Ship now" },
  { href: "/track", label: "Track package" },
  { href: "/rewards", label: "Rewards" },
  { href: "/warehouse", label: "US warehouse" },
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
        <div className="flex items-center gap-2">
          <Button href="/freight" variant="secondary" className="min-h-tap px-3 text-xs sm:text-sm">
            + New order
          </Button>
          {session?.user ? (
            <Button href="/app" variant="primary">
              Workspace
            </Button>
          ) : (
            <Button href="/login">Sign in</Button>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="min-h-tap shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-forest-50 hover:text-forest-800"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
