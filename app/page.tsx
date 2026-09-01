import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Wordmark } from "@/components/brand";
import { CopyAddress } from "@/components/copy-address";
import { Badge, Button, Card } from "@/components/ui";
import {
  CHARTER_BROKER_LINE,
  CHARTER_CTA,
  CONTACT_ORDERS,
  HOW_IT_WORKS,
  HUBS,
  PUBLIC_FREIGHT_SERVICES,
  PUBLIC_LINE,
  TAGLINE,
  WAREHOUSE,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <div>
      <PublicNav />
      <section className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-300">
            Now shipping to Freeport &amp; Nassau
          </p>
          <div className="mt-6">
            <Wordmark light size="lockup" />
          </div>
          <h1 className="mt-8 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Ship to the Bahamas faster.
          </h1>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-forest-300">{TAGLINE}</p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{PUBLIC_LINE}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Fort Lauderdale warehouse to Freeport or Nassau. Booking and logistics only — not a clinic shop.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/freight" className="min-h-tap w-full bg-forest-600 hover:bg-forest-700 sm:w-auto">
              Book a shipment
            </Button>
            <Button href="/track" variant="ghost" className="min-h-tap w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              Track my package
            </Button>
            <Button href="/signup" variant="ghost" className="min-h-tap w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              Get started free
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-3 px-4 sm:grid-cols-3">
        {[
          { title: "3–5 days", body: "Express Air after release" },
          { title: "FLL → Bahamas", body: "Freeport & Nassau live" },
          { title: "Pay later", body: "No card charged on book" },
        ].map((s) => (
          <Card key={s.title} className="p-5">
            <p className="font-display text-2xl text-navy-900">{s.title}</p>
            <p className="mt-1 text-sm text-navy-800/60">{s.body}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">What we offer</p>
        <h2 className="mt-2 font-display text-3xl text-navy-900">Freight services</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_FREIGHT_SERVICES.map((c) => (
            <Card key={c.id} className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{c.badge}</p>
              <h3 className="mt-2 font-display text-2xl text-navy-900">{c.title}</h3>
              <p className="mt-1 text-sm text-navy-800/50">{c.window}</p>
              <p className="mt-3 text-sm leading-6 text-navy-800/70">{c.blurb}</p>
            </Card>
          ))}
        </div>
        <Button href="/services" variant="ghost" className="mt-5 min-h-tap">
          All services
        </Button>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Simple process</p>
        <h2 className="mt-2 font-display text-3xl text-navy-900">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.step} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">{step.step}</p>
              <p className="mt-2 font-display text-xl text-navy-900">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-navy-800/70">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <Card className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Your US address</p>
            <h2 className="mt-2 font-display text-2xl text-navy-900">WareSpace C15</h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Ship packages to your name c/o {WAREHOUSE.line}. We forward to Freeport or Nassau.
            </p>
            <p className="mt-4 text-sm font-semibold text-navy-900">{WAREHOUSE.street}</p>
            <p className="text-sm text-navy-800/70">
              {WAREHOUSE.city}, {WAREHOUSE.state} {WAREHOUSE.zip}
            </p>
            <p className="mt-3 text-sm text-navy-800/60">Orders: {CONTACT_ORDERS}</p>
            <CopyAddress />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/warehouse">Warehouse details</Button>
              <Button href="/rewards" variant="ghost">
                Rewards
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Active hubs</p>
            <ul className="mt-3 space-y-2 text-sm">
              {HUBS.active.map((h) => (
                <li key={h.code} className="flex justify-between border-b border-navy-900/8 py-2">
                  <span className="font-medium text-navy-900">{h.name}</span>
                  <span className="text-navy-800/50">{h.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-navy-800/50">Next: {HUBS.next.map((h) => h.name).join(" → ")}</p>
          </div>
        </Card>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 pb-4">
        <Card className="p-6 sm:p-8">
          <Badge tone="teal">Licensed clinics only</Badge>
          <h2 className="mt-3 font-display text-2xl text-navy-900">Staff and clinic workspace</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-800/70">
            Clinic supply, dispatch, and finance live behind sign-in. Public pages stay booking and
            logistics. {CHARTER_BROKER_LINE}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button href="/login" className="min-h-tap w-full sm:w-auto">
              Clinic / staff login
            </Button>
            <Button href="/app/clinic/charter" variant="ghost" className="min-h-tap w-full sm:w-auto">
              {CHARTER_CTA}
            </Button>
            <Link href="/contact" className="inline-flex min-h-tap items-center text-sm font-semibold text-navy-800">
              Talk to ops
            </Link>
          </div>
        </Card>
      </section>
      <Footer />
    </div>
  );
}
