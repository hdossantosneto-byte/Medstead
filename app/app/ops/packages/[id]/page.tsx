import { notFound } from "next/navigation";
import { DedicatedNextButton } from "@/components/next-queue";
import { GateToggle, ShipmentStatusForm } from "@/components/admin-forms";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, CUSTODY_LABEL, GATE_LABEL, SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { when } from "@/lib/format";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsPackageDetail({ params }: { params: { id: string } }) {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const shipment = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: {
      gates: true,
      clinicOrder: { include: { invoice: true } },
      flight: true,
      events: { orderBy: { createdAt: "asc" } },
      quote: true,
    },
  });
  if (!shipment) notFound();
  const queue = await loadQueue(user);
  const next = queue.find(
    (i) =>
      i.shipmentId === shipment.id ||
      (shipment.clinicOrderId && i.orderId === shipment.clinicOrderId),
  );
  const green = shipment.gates.filter((g) => g.state === "GREEN").length;

  return (
    <div>
      <PageHeader eyebrow="Package" title={shipment.shipmentCode} />
      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="teal">{SHIPMENT_LABEL[shipment.status]}</Badge>
          {shipment.clinicOrder && <Badge>{CLINIC_ORDER_LABEL[shipment.clinicOrder.status]}</Badge>}
          <Badge tone={green === 6 ? "green" : "amber"}>Gates {green}/6</Badge>
          {shipment.clinicOrder?.invoice && (
            <Badge tone={shipment.clinicOrder.invoice.status === "paid" ? "green" : "amber"}>
              Counter {shipment.clinicOrder.invoice.status === "paid" ? "paid" : "due"}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-sm text-navy-800/70">
          {shipment.origin} → {shipment.destination} · {SERVICE_LABEL[shipment.service]} ·{" "}
          {shipment.consignee}
        </p>
        {shipment.activityLine && <p className="mt-3 text-sm">{shipment.activityLine}</p>}
        {next && next.kind !== "open" && (
          <div className="mt-5">
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
      </Card>
      <Card className="mt-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Six gates</p>
        <div className="mt-3 space-y-3">
          {shipment.gates.map((g) => (
            <div key={g.id}>
              <p className="mb-1 text-xs text-navy-800/50">{GATE_LABEL[g.name]}</p>
              <GateToggle shipmentId={shipment.id} name={g.name} state={g.state} />
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 p-5">
        <ShipmentStatusForm shipmentId={shipment.id} current={shipment.status} canShip />
      </Card>
      <Card className="mt-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
          Chain of custody
        </p>
        {shipment.events.length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">No handoffs yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {shipment.events.map((e) => (
              <li key={e.id} className="text-sm text-navy-800">
                <span className="font-semibold">{CUSTODY_LABEL[e.toStatus] ?? e.toStatus}</span>
                <span className="text-navy-800/50"> · {when(e.createdAt)}</span>
                {e.note ? <span className="block text-navy-800/70">{e.note}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
