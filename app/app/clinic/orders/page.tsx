import Link from "next/link";
import { redirect } from "next/navigation";
import { RoleInbox } from "@/components/role-inbox";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function ClinicOrdersPage() {
  const user = await requireUser();
  if (!clinicApproved(user) || !user.clinic) redirect("/app/clinic/pending");

  const orders = await prisma.clinicOrder.findMany({
    where: { clinicId: user.clinic.id },
    include: { items: true, invoice: true, shipment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Your orders"
        title="Orders"
        lede="Status and Track package. Del owns delivery dates — do not message ops."
        actions={
          <Button href="/app/clinic/catalog" className="min-h-tap">
            Shop
          </Button>
        }
      />
      <RoleInbox />
      {orders.length === 0 ? (
        <Empty title="No orders yet" body="Open Shop, add to cart, and place an order." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const total = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
            return (
              <Card key={o.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{o.orderNumber}</p>
                    <p className="text-xs text-navy-800/50">{when(o.createdAt)}</p>
                    <p className="mt-2 text-sm font-semibold">{money(total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                    {o.shipment && (
                      <Badge tone="teal">
                        {SHIPMENT_LABEL[o.shipment.status]}
                        {o.shipment.publicClock ? "" : " · clock off"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button href={`/app/clinic/orders/${o.id}`} variant="ghost" className="min-h-tap">
                    View order
                  </Button>
                  {o.shipment && (
                    <Button href={`/track/${o.shipment.shipmentCode}`} className="min-h-tap">
                      Track package
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
