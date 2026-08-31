import Link from "next/link";
import {
  APP_GET_STARTED,
  APP_QUOTE,
  APP_TRACK,
  CONTACT_ORDERS,
  MISSION,
  PUBLIC_LINE,
  TAGLINE,
} from "@/lib/constants";
import { Wordmark } from "./brand";
import { MARKETING_NAV } from "./marketing";

const SERVICES = [
  { href: "/freight", label: "Express Air" },
  { href: "/freight", label: "Standard Sea" },
  { href: "/freight", label: "Hard-to-reach pickup" },
  { href: "/freight", label: "Customs Support" },
  { href: APP_TRACK, label: "Live Tracking", external: true },
];

const COMPANY = [
  ...MARKETING_NAV,
  { href: "/telehealth", label: "Telehealth" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-navy-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark light href="/" size="footer" />
          <p className="mt-5 max-w-md text-lg font-semibold leading-snug tracking-tight">
            {MISSION}
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{PUBLIC_LINE}</p>
          <p className="mt-4 text-sm text-white/70">
            We specialize in hard-to-reach destinations — medical cargo and healthcare access.
          </p>
          <a
            href={`mailto:${CONTACT_ORDERS}`}
            className="mt-4 inline-block text-sm font-semibold text-forest-300 hover:text-forest-200"
          >
            {CONTACT_ORDERS}
          </a>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
            Services
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            {SERVICES.map((item) => (
              <li key={item.label}>
                {item.external ? (
                  <a href={item.href} className="hover:text-forest-300">
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className="hover:text-forest-300">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
            Company
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            {COMPANY.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-forest-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
            App
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-white/80">
            <li>
              <a href={APP_GET_STARTED} className="hover:text-forest-300">
                Get Started
              </a>
            </li>
            <li>
              <a href={APP_QUOTE} className="hover:text-forest-300">
                Request a quote
              </a>
            </li>
            <li>
              <a href={APP_TRACK} className="hover:text-forest-300">
                Track a shipment
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>MedStead · MedStead Transport · Hard-to-reach destinations</p>
          <p className="font-semibold uppercase tracking-[0.16em] text-forest-300">{TAGLINE}</p>
        </div>
      </div>
    </footer>
  );
}
