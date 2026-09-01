import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Button, Card, PageHeader } from "@/components/ui";
import { HOW_IT_WORKS, PUBLIC_FREIGHT_SERVICES } from "@/lib/constants";

export const metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <PageHeader
          eyebrow="Logistics only"
          title="Freight services"
          lede="Booking and forwarding from Fort Lauderdale. This is not a clinic shop and not a drug catalog."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PUBLIC_FREIGHT_SERVICES.map((s) => (
            <Card key={s.id} className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{s.badge}</p>
              <h2 className="mt-2 font-display text-2xl text-navy-900">{s.title}</h2>
              <p className="mt-1 text-sm text-navy-800/50">{s.window}</p>
              <p className="mt-3 text-sm leading-6 text-navy-800/70">{s.blurb}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.step} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">{step.step}</p>
              <p className="mt-2 font-display text-xl text-navy-900">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-navy-800/70">{step.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/freight" className="min-h-tap w-full sm:w-auto">
            Book a shipment
          </Button>
          <Button href="/track" variant="ghost" className="min-h-tap w-full sm:w-auto">
            Track a package
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
