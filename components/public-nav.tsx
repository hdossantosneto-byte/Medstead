import Link from "next/link";
import { auth } from "@/lib/session";
import { Wordmark } from "./brand";
import { Button } from "./ui";

const links = [
  { href: "/freight", label: "Freight" },
  { href: "/track", label: "Track" },
  { href: "/rewards", label: "Rewards" },
  { href: "/warehouse", label: "US warehouse" },
  { href: "/contact", label: "Contact" },
];

export async function PublicNav() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-30 border-b border-navy-900/8 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Wordmark />
        <nav className="hidden items-center gap-6 text-sm font-medium text-navy-800 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-teal-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Button href="/app" variant="primary">
              Workspace
            </Button>
          ) : (
            <>
              <Button href="/demo" variant="ghost">
                Demo
              </Button>
              <Button href="/login">Sign in</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
