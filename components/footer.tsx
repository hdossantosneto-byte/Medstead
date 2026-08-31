import Link from "next/link";
import { CONTACT_ORDERS, TAGLINE, WAREHOUSE } from "@/lib/constants";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="inline-flex rounded-2xl bg-white p-2">
            <Logo href="/" size="footer" />
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Trusted partner for Bahamas freight and medical cargo to hard-to-reach destinations.
            Public brand is MedStead.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Email:{" "}
            <a className="font-semibold text-brand-green-light hover:underline" href={`mailto:${CONTACT_ORDERS}`}>
              {CONTACT_ORDERS}
            </a>
          </p>
          <p className="mt-1 text-sm text-white/70">Hub: Fort Lauderdale, FL</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Services</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/services" className="hover:text-brand-green-light">
                Express Air
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-brand-green-light">
                Standard Sea
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-brand-green-light">
                Freeport &amp; Nassau pickup
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-brand-green-light">
                Customs support
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-brand-green-light">
                Package tracking
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-brand-green-light">
                Hard-to-reach medical transport
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/account?tab=signup" className="hover:text-brand-green-light">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-brand-green-light">
                Login
              </Link>
            </li>
            <li>
              <Link href="/book" className="hover:text-brand-green-light">
                Ship now
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-brand-green-light">
                Support
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-xs leading-5 text-white/55">
            Your US address: {WAREHOUSE.line}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} MedStead. All rights reserved.</p>
          <p className="font-semibold tracking-[0.18em]">{TAGLINE}</p>
        </div>
      </div>
    </footer>
  );
}
