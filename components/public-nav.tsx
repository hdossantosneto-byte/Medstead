import Link from "next/link";
import { auth } from "@/lib/session";
import { Wordmark } from "./brand";
import { GetStartedCta } from "./marketing";
import { PublicMobileNav } from "./public-mobile-nav";
import { PublicNavLinks } from "./public-nav-links";

export async function PublicNav() {
  const session = await auth();
  return (
    <header className="relative sticky top-0 z-40 border-b border-navy-900/8 bg-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark compact />
        <nav className="hidden items-center gap-8 lg:flex">
          <PublicNavLinks />
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link
              href="/app"
              className="hidden text-sm font-semibold text-navy-800 hover:text-forest-700 sm:inline"
            >
              Workspace
            </Link>
          ) : null}
          <GetStartedCta />
          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}
