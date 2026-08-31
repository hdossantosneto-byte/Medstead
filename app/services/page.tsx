import { Icon } from "@/components/icons";
import { Badge, Button, Card } from "@/components/ui";
import { CONTACT_ORDERS, SERVICES } from "@/lib/constants";

export const metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">What we offer</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-950">Services</h1>
      <p className="mt-4 max-w-2xl text-navy-800/70">
        Bahamas freight is a product — Express Air, Standard Sea, Freeport &amp; Nassau pickup —
        not the only product. Hard-to-reach medical transport uses the same booking desk.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {SERVICES.map((s) => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                  s.badgeTone === "green" ? "bg-forest-100 text-forest-700" : "bg-blue-50 text-brand-blue"
                }`}
              >
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              {s.badge && <Badge tone={s.badgeTone}>{s.badge}</Badge>}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-navy-950">{s.title}</h2>
            <p className="mt-1 text-sm text-forest-700">{s.window}</p>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">{s.blurb}</p>
          </Card>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button href="/book">Book a shipment</Button>
        <Button href="/track" variant="blue">
          Track a package
        </Button>
        <Button href={`mailto:${CONTACT_ORDERS}`} variant="outline">
          {CONTACT_ORDERS}
        </Button>
      </div>
    </div>
  );
}
