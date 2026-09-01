import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import {
  INVOICE_STATUS_LABEL,
  PICKUP_LABEL,
  PUBLIC_TRACK_LABEL,
  PUBLIC_TRACK_STEPS,
  SERVICE_LABEL,
  SERVICE_WINDOW,
} from "@/lib/constants";
import { publicStepForShipment } from "@/lib/public-track";
import { prisma } from "@/lib/prisma";
import { money, when } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipment tracking" };

export default async function TrackDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentCode: code },
    include: { events: { orderBy: { createdAt: "asc" } }, quote: true },
  });
  const step = shipment ? publicStepForShipment(shipment.status, shipment.invoiceStatus) : null;
  const current = step ? PUBLIC_TRACK_STEPS.indexOf(step) : -1;

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <PageHeader
          eyebrow="Tracking"
          title={code}
          lede="Shipment IDs are never reused. Public transit clock starts only after release / manifest."
        />
        {!shipment || !step ? (
          <Empty title="No shipment with that ID" body="Check the format MS-YYYYMMDD-ORIGIN-DEST-####." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 sm:p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teal">{PUBLIC_TRACK_LABEL[step]}</Badge>
                <Badge>{SERVICE_LABEL[shipment.service]}</Badge>
                <Badge tone={shipment.invoiceStatus === "paid" ? "green" : "amber"}>
                  {INVOICE_STATUS_LABEL[shipment.invoiceStatus] ?? "No invoice yet"}
                </Badge>
                {shipment.publicClock ? (
                  <Badge tone="green">Public clock on</Badge>
                ) : (
                  <Badge tone="amber">Awaiting release</Badge>
                )}
              </div>
              <ol className="mt-8 space-y-3">
                {PUBLIC_TRACK_STEPS.map((status, i) => {
                  const done = i <= current;
                  return (
                    <li key={status} className="flex items-start gap-3">
                      <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${done ? "bg-teal-600" : "bg-navy-900/15"}`} />
                      <p className={`text-sm font-semibold ${done ? "text-navy-900" : "text-navy-800/40"}`}>
                        {PUBLIC_TRACK_LABEL[status]}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </Card>
            <Card className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Movement</p>
              <p className="mt-2 text-lg font-semibold text-navy-900">
                {shipment.origin} → {shipment.destination}
              </p>
              <p className="mt-2 text-sm text-navy-800/60">{SERVICE_WINDOW[shipment.service]}</p>
              <p className="mt-4 text-sm text-navy-800/70">Consignee: {shipment.consignee}</p>
              {shipment.pickupPoint && (
                <p className="mt-2 text-sm text-navy-800/70">
                  {PICKUP_LABEL[shipment.pickupPoint] ?? shipment.pickupPoint}
                </p>
              )}
              <p className="mt-2 text-sm text-navy-800/70">
                {shipment.weightLb} lb · {shipment.pieces} pcs
              </p>
              {shipment.quote && (
                <p className="mt-2 text-sm text-navy-800/70">
                  Estimate {money(shipment.quote.listAmount)} — not a charge
                </p>
              )}
              {shipment.invoiceRef && (
                <p className="mt-2 text-sm text-navy-800/70">Invoice {shipment.invoiceRef}</p>
              )}
              <p className="mt-6 text-xs leading-5 text-navy-800/50">
                MedStead is not a licensed customs broker. Customs hold / released is an operational
                status, not a brokerage filing by MedStead.
              </p>
              <ul className="mt-6 space-y-2 text-xs text-navy-800/60">
                {shipment.events.map((e) => (
                  <li key={e.id}>
                    {when(e.createdAt)} — {e.note || e.toStatus}
                  </li>
                ))}
              </ul>
              <Button href={`/freight/confirm/${shipment.shipmentCode}`} variant="ghost" className="mt-6 min-h-tap w-full">
                View confirmation
              </Button>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
