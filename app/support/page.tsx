import { Button, Card } from "@/components/ui";
import { CONTACT_ORDERS, MARKETING_DOOR, WAREHOUSE } from "@/lib/constants";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Support</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-950">Talk to orders</h1>
      <p className="mt-4 text-navy-800/70">
        This storefront takes booking requests. The company marketing site is a door, not checkout.
        Email the desk for exceptions, customs questions, or a shipment that is not in the form.
      </p>
      <Card className="mt-8 p-6">
        <p className="text-sm text-navy-800/55">Orders desk</p>
        <p className="mt-1 text-xl font-semibold">
          <a className="text-brand-blue hover:underline" href={`mailto:${CONTACT_ORDERS}`}>
            {CONTACT_ORDERS}
          </a>
        </p>
        <p className="mt-6 text-sm text-navy-800/55">Warehouse</p>
        <p className="mt-1 font-medium">{WAREHOUSE.line}</p>
        <p className="mt-6 text-sm text-navy-800/55">Company marketing site (not checkout)</p>
        <p className="mt-1">
          <a className="font-medium text-brand-blue hover:underline" href={MARKETING_DOOR}>
            {MARKETING_DOOR}
          </a>
        </p>
      </Card>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/book">Book a shipment</Button>
        <Button href="/track" variant="blue">
          Track a package
        </Button>
      </div>
    </div>
  );
}
