import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Badge, Button, Card } from "@/components/ui";
import {
  CONTACT_ORDERS,
  INVOICE_STATUS_LABEL,
  PICKUP_LABEL,
  SERVICE_LABEL,
  SERVICE_WINDOW,
} from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking confirmation" };

export default async function ConfirmPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentCode: code },
    include: { quote: true },
  });

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
        {!shipment ? (
          <>
            <h1 className="font-display text-3xl text-navy-900">Booking not found</h1>
            <p className="mt-3 text-navy-800/70">Check the confirmation ID or start a new request.</p>
            <Button href="/freight" className="mt-6">
              Book a shipment
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Confirmed request</p>
            <h1 className="mt-3 font-display text-4xl text-navy-900">You&apos;re booked.</h1>
            <p className="mt-4 text-navy-800/70">
              No card was charged. MedStead will email an invoice
              {shipment.contactEmail ? ` to ${shipment.contactEmail}` : ""}. Pay later is fine — ops
              closes the booking when payment is received.
            </p>

            <Card className="mt-8 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Booking ID</p>
              <p className="mt-2 font-mono text-xl font-semibold text-navy-950">{shipment.shipmentCode}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="teal">{INVOICE_STATUS_LABEL[shipment.invoiceStatus] ?? "No invoice yet"}</Badge>
                <Badge>{SERVICE_LABEL[shipment.service]}</Badge>
              </div>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-navy-800/50">From</dt>
                  <dd className="font-medium">{shipment.origin}</dd>
                </div>
                <div>
                  <dt className="text-navy-800/50">To</dt>
                  <dd className="font-medium">{shipment.destination}</dd>
                </div>
                <div>
                  <dt className="text-navy-800/50">Pickup</dt>
                  <dd className="font-medium">
                    {PICKUP_LABEL[shipment.pickupPoint ?? ""] ?? shipment.pickupPoint ?? "Ops will confirm"}
                  </dd>
                </div>
                <div>
                  <dt className="text-navy-800/50">Service window</dt>
                  <dd className="font-medium">{SERVICE_WINDOW[shipment.service]}</dd>
                </div>
                <div>
                  <dt className="text-navy-800/50">Cargo</dt>
                  <dd className="font-medium">
                    {shipment.weightLb} lb · {shipment.pieces} pcs
                  </dd>
                </div>
                <div>
                  <dt className="text-navy-800/50">Estimate</dt>
                  <dd className="font-medium">
                    {shipment.quote ? `${money(shipment.quote.listAmount)} (not a charge)` : "Quoted by ops"}
                  </dd>
                </div>
              </dl>
              {shipment.description && (
                <p className="mt-4 text-sm text-navy-800/70">{shipment.description}</p>
              )}
            </Card>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={`/track/${shipment.shipmentCode}`} className="min-h-tap w-full sm:w-auto">
                Track this shipment
              </Button>
              <Button href="/account" variant="ghost" className="min-h-tap w-full sm:w-auto">
                Save to account
              </Button>
              <Link
                href={`mailto:${CONTACT_ORDERS}`}
                className="inline-flex min-h-tap items-center text-sm font-semibold text-navy-800"
              >
                {CONTACT_ORDERS}
              </Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
