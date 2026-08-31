import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Badge, Button, Card } from "@/components/ui";
import {
  CONTACT_ORDERS,
  HUBS,
  MISSION,
  PUBLIC_LINE,
  TAGLINE,
  WAREHOUSE,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <div>
      <PublicNav />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-14 md:pt-20">
        <Badge tone="teal">USA and international clinic markets</Badge>
        <h1 className="mt-5 max-w-4xl font-display text-3xl leading-tight text-navy-900 sm:text-4xl md:text-5xl">
          {MISSION}
        </h1>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          {TAGLINE}
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-800/80">{PUBLIC_LINE}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/freight">Get a freight quote</Button>
          <Button href="/track" variant="ghost">
            Track a shipment
          </Button>
          <Button href="/demo" variant="secondary">
            Try the demo
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4">
        <div className="rounded-3xl border border-teal-200 bg-teal-50 px-8 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Connecting communities
          </p>
          <p className="mt-3 font-display text-2xl leading-snug text-navy-900 md:text-3xl">
            {MISSION}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {[
          {
            title: "Express Air",
            meta: "3–5 days after release",
            body: "Priority air from Fort Lauderdale to clinic and consignee destinations. Public clock starts only after release — we do not advertise supplier lead time as transit time.",
          },
          {
            title: "Standard Sea",
            meta: "5–7 days after release",
            body: "Cost-efficient ocean service for heavier clinic and personal freight. 10% off when you pay online.",
          },
          {
            title: "My Clinic",
            meta: "RX · Non-RX · IV",
            body: "Licensed clinics, doctors, and pharmacies order against USA or international price books. Prices include delivery within 7 days to the clinic.",
          },
        ].map((c) => (
          <Card key={c.title} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              {c.meta}
            </p>
            <h2 className="mt-2 font-display text-2xl text-navy-900">{c.title}</h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">{c.body}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <Card className="grid gap-8 p-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Personal US warehouse
            </p>
            <h2 className="mt-2 font-display text-2xl text-navy-900">
              Your suite at WareSpace C15
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Freight customers receive a personal receiving address at {WAREHOUSE.line}. Use it
              for inbound parcels we consolidate and forward.
            </p>
            <p className="mt-4 text-sm text-navy-800/70">
              Rewards: 100 welcome points, then 1 point per $1. Pay online and save 10%.
            </p>
            <div className="mt-6 flex gap-3">
              <Button href="/warehouse">Warehouse details</Button>
              <Button href="/rewards" variant="ghost">
                Rewards
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Active hubs
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {HUBS.active.map((h) => (
                <li key={h.code} className="flex justify-between border-b border-navy-900/8 py-2">
                  <span className="font-medium text-navy-900">{h.name}</span>
                  <span className="text-navy-800/50">{h.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-navy-800/50">
              Next: {HUBS.next.map((h) => h.name).join(" → ")}
            </p>
          </div>
        </Card>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="rounded-3xl bg-navy-900 px-8 py-10 text-white">
          <h2 className="font-display text-3xl">For licensed healthcare businesses</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            We coordinate pharmacy, telehealth, medical-supply, and logistics. Clinic, doctor, and
            pharmacy accounts stay inactive until a MedStead admin approves them. Sales
            representatives cannot promise delivery dates — Del owns date commitments.
          </p>
          <p className="mt-4 text-sm text-white/60">
            MedStead is not a licensed customs broker. Orders: {CONTACT_ORDERS}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-navy-950"
            >
              Clinic sign in
            </Link>
            <Link href="/contact" className="rounded-full border border-white/20 px-4 py-2 text-sm">
              Talk to ops
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
