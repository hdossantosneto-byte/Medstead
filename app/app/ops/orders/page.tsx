import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsOrdersPage() {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const queue = await loadQueue(user);
  const [orders, freight] = await Promise.all([
    prisma.clinicOrder.findMany({
      include: { clinic: true, items: { include: { product: true } }, shipment: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.findMany({
      where: { clinicOrderId: null, status: { not: "DELIVERED_CLOSED" } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Orders"
        title="Pick / pack"
        lede="Clinic and freight jobs the warehouse must move. Combined Orders & Packages lives at /app/orders. Line values stay hidden."
      />
      <div className="space-y-3">
        {orders.map((o) => {
          const next = queue.find((i) => i.orderId === o.id || (o.shipment && i.shipmentId === o.shipment.id));
          return (
            <Card key={o.id} className="p-5">
              <p className="font-semibold text-navy-900">
                {o.orderNumber} · {o.clinic.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                {o.shipment && <Badge tone="teal">{SHIPMENT_LABEL[o.shipment.status]}</Badge>}
              </div>
              <ul className="mt-3 text-sm text-navy-800/70">
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.product.name} × {i.qty}
                  </li>
                ))}
              </ul>
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
            </Card>
          );
        })}
        {freight.map((s) => (
          <Card key={s.id} className="p-5">
            <p className="font-semibold text-navy-900">Freight · {s.shipmentCode}</p>
            <p className="mt-1 text-sm text-navy-800/60">
              {s.origin} → {s.destination} · {s.consignee}
            </p>
            <div className="mt-2">
              <Badge tone="teal">{SHIPMENT_LABEL[s.status]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
