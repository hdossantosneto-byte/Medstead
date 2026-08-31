import Link from "next/link";
import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsPackagesPage() {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const queue = await loadQueue(user);
  const shipments = await prisma.shipment.findMany({
    include: { gates: true, clinicOrder: true, flight: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Packages"
        title="One package, one tap"
        lede="Each card is a trackable package. Advance the next legal step. No invoice totals."
      />
      <div className="space-y-3">
        {shipments.map((s) => {
          const green = s.gates.filter((g) => g.state === "GREEN").length;
          const next = queue.find(
            (i) => i.shipmentId === s.id || (s.clinicOrderId && i.orderId === s.clinicOrderId),
          );
          return (
            <Card key={s.id} className="p-5">
              <Link href={`/app/ops/packages/${s.id}`} className="block">
                <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
                <p className="mt-1 text-sm text-navy-800/60">
                  {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]} · {s.consignee}
                </p>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="teal">{SHIPMENT_LABEL[s.status]}</Badge>
                {s.clinicOrder && <Badge>{CLINIC_ORDER_LABEL[s.clinicOrder.status]}</Badge>}
                <Badge tone={green === 6 ? "green" : "amber"}>Gates {green}/6</Badge>
                {s.publicClock ? <Badge tone="green">Clock on</Badge> : <Badge>Clock off</Badge>}
              </div>
              {s.activityLine && <p className="mt-3 text-sm text-navy-800/70">{s.activityLine}</p>}
              {next && next.kind !== "open" && (
                <div className="mt-4">
                  <DedicatedNextButton
                    kind={next.kind}
                    label={next.actionLabel}
                    orderId={next.orderId}
                    shipmentId={next.shipmentId}
                    flightId={next.flightId}
                    gate={next.gate}
                  />
                </div>
              )}
              <p className="mt-3 text-xs">
                <Link href={`/track/${s.shipmentCode}`} className="font-semibold text-forest-800">
                  Public track
                </Link>
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
