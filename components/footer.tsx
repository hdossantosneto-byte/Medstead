import Link from "next/link";
import { CONTACT_ORDERS, HUBS, MISSION, PUBLIC_LINE, TAGLINE, WAREHOUSE } from "@/lib/constants";
import { Wordmark } from "./brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-navy-900/10 bg-navy-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark light href="/" />
          <p className="mt-4 max-w-xl font-display text-xl leading-snug text-white">
            {MISSION}
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{PUBLIC_LINE}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
            {TAGLINE}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Hubs</p>
          <ul className="mt-3 space-y-1 text-sm text-white/75">
            {HUBS.active.map((h) => (
              <li key={h.code}>
                {h.name} <span className="text-white/40">({h.code})</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/50">
            Next: {HUBS.next.map((h) => h.name).join(" · ")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Contact</p>
          <p className="mt-3 text-sm text-white/80">{CONTACT_ORDERS}</p>
          <p className="mt-2 text-sm leading-6 text-white/60">{WAREHOUSE.line}</p>
          <p className="mt-4 text-xs leading-5 text-white/45">
            MedStead is not a licensed customs broker. We coordinate pharmacy, telehealth,
            medical-supply, and logistics for licensed healthcare businesses.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        <Link href="/demo" className="text-teal-300 hover:underline">
          Demo logins
        </Link>
        <span className="mx-2">·</span>
        MedStead Group · Markets in the USA and internationally
      </div>
    </footer>
  );
}
