import { RoleInbox } from "@/components/role-inbox";
import { ActivityLine } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsOrdersPage() {
  await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const orders = await prisma.clinicOrder.findMany({
    include: { clinic: true, items: { include: { product: true } }, shipment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Ops"
        title="Clinic orders"
        lede="Fulfillment view. Line values and invoice totals are hidden. Linked logistics status follows the clinic order."
      />
      <RoleInbox />
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">
                {o.orderNumber} · {o.clinic.name}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                {o.shipment && (
                  <Badge tone="teal">
                    {o.shipment.shipmentCode} · {SHIPMENT_LABEL[o.shipment.status]}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3">
              <ActivityLine text={o.activityLine} />
            </div>
            <ul className="mt-3 text-sm text-navy-800/70">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.product.name} × {i.qty}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
