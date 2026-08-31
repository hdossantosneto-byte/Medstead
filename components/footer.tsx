import Link from "next/link";
import { CONTACT_ORDERS, HUBS, MISSION, PUBLIC_LINE, TAGLINE, WAREHOUSE } from "@/lib/constants";
import { Wordmark } from "./brand";

const SERVICES = [
  { href: "/orders", label: "Orders & Packages" },
  { href: "/freight", label: "Express Air freight" },
  { href: "/freight", label: "Standard Sea freight" },
  { href: "/track", label: "Package tracking" },
  { href: "/warehouse", label: "US warehouse" },
  { href: "/rewards", label: "Rewards program" },
];

const QUICK = [
  { href: "/demo", label: "Create account / demo" },
  { href: "/login", label: "Customer login" },
  { href: "/freight", label: "Ship now" },
  { href: "/contact", label: "Support" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-navy-900/10 bg-navy-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Wordmark light href="/" />
          <p className="mt-4 max-w-sm font-display text-lg leading-snug text-white">{MISSION}</p>
          <p className="mt-3 text-sm leading-6 text-white/70">{PUBLIC_LINE}</p>
          <a href={`mailto:${CONTACT_ORDERS}`} className="mt-3 block text-sm text-forest-300">
            {CONTACT_ORDERS}
          </a>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">Services</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {SERVICES.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="hover:text-forest-300">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {QUICK.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="hover:text-forest-300">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">Hubs</p>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {HUBS.active.map((h) => (
              <li key={h.code}>
                {h.name} <span className="text-white/40">({h.code})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">Warehouse address</p>
          <p className="mt-3 text-sm leading-6 text-white/80">{WAREHOUSE.line}</p>
          <p className="mt-2 text-xs text-white/50">Suite FLL-C15 · Fort Lauderdale hub</p>
          <p className="mt-4 text-xs leading-5 text-white/45">
            MedStead is not a licensed customs broker. We coordinate pharmacy, telehealth,
            medical-supply, and logistics for licensed healthcare businesses.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">{TAGLINE}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        <Link href="/demo" className="text-forest-300 hover:underline">
          Demo logins
        </Link>
        <span className="mx-2">·</span>
        MedStead · Markets in the USA and internationally
      </div>
    </footer>
  );
}
