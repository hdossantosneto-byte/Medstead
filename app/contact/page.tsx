import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Card, PageHeader } from "@/components/ui";
import { CONTACT_ORDERS, HUBS, WAREHOUSE } from "@/lib/constants";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Orders desk"
          title="Contact MedStead"
          lede="Clinic orders, freight, and manifests go through a single operations desk. We serve USA and international clinics — not a Bahamas-only service."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Email
            </p>
            <a href={`mailto:${CONTACT_ORDERS}`} className="mt-2 block text-2xl text-navy-900">
              {CONTACT_ORDERS}
            </a>
            <p className="mt-4 text-sm leading-6 text-navy-800/70">{WAREHOUSE.line}</p>
          </Card>
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Hubs
            </p>
            <ul className="mt-3 space-y-2 text-sm text-navy-800/80">
              {HUBS.active.map((h) => (
                <li key={h.code}>
                  <strong>{h.name}</strong> — {h.note}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-navy-800/50">
              Next: {HUBS.next.map((h) => h.name).join(" → ")}
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
