import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import {
  SERVICE_LABEL,
  SERVICE_WINDOW,
  SHIPMENT_LABEL,
  SHIPMENT_STATUSES,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipment tracking" };

export default async function TrackDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentCode: code },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Tracking"
          title={code}
          lede="Shipment IDs are never reused. Public transit clock starts only after release / manifest."
        />
        {!shipment ? (
          <Empty title="No shipment with that ID" body="Check the format MS-YYYYMMDD-ORIGIN-DEST-####." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teal">{SHIPMENT_LABEL[shipment.status]}</Badge>
                <Badge>{SERVICE_LABEL[shipment.service]}</Badge>
                {shipment.publicClock ? (
                  <Badge tone="green">Public clock on</Badge>
                ) : (
                  <Badge tone="amber">Awaiting release</Badge>
                )}
              </div>
              <ol className="mt-8 space-y-3">
                {SHIPMENT_STATUSES.map((status, i) => {
                  const current = SHIPMENT_STATUSES.indexOf(shipment.status);
                  const done = i <= current;
                  return (
                    <li key={status} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 h-3 w-3 rounded-full ${done ? "bg-teal-600" : "bg-navy-900/15"}`}
                      />
                      <div>
                        <p className={`text-sm font-semibold ${done ? "text-navy-900" : "text-navy-800/40"}`}>
                          {SHIPMENT_LABEL[status]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                Movement
              </p>
              <p className="mt-2 text-lg font-semibold text-navy-900">
                {shipment.origin} → {shipment.destination}
              </p>
              <p className="mt-2 text-sm text-navy-800/60">
                {SERVICE_WINDOW[shipment.service]}
              </p>
              <p className="mt-4 text-sm text-navy-800/70">
                Consignee: {shipment.consignee}
              </p>
              <p className="mt-2 text-sm text-navy-800/70">
                {shipment.weightLb} lb · {shipment.pieces} pcs
              </p>
              <p className="mt-6 text-xs leading-5 text-navy-800/50">
                MedStead is not a licensed customs broker. Customs hold / released is an operational
                status, not a brokerage filing by MedStead.
              </p>
              <ul className="mt-6 space-y-2 text-xs text-navy-800/60">
                {shipment.events.map((e) => (
                  <li key={e.id}>
                    {when(e.createdAt)} — {e.toStatus}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
