import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { SupportForm } from "@/components/support-form";
import { Button, Card, PageHeader } from "@/components/ui";
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
          lede="Do not WhatsApp Clint, Del, ops, or finance. Work waiting on you is on Do this next. Email is only for exceptions."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              In-app inbox
            </p>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Sign in. The home screen is one queue: who it is, why it is waiting, one button.
              Completing it hands the record to the next role. Clinic orders and logistics
              shipments move together.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/app">Do this next</Button>
              <Button href="/demo" variant="ghost">
                Demo roles
              </Button>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Exception desk
            </p>
            <a href={`mailto:${CONTACT_ORDERS}`} className="mt-2 block text-lg text-navy-900">
              {CONTACT_ORDERS}
            </a>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">{WAREHOUSE.line}</p>
            <div className="mt-6">
              <SupportForm />
            </div>
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
