import { redirect } from "next/navigation";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, CLINIC_ROLES, SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function AppOrdersPage() {
  const user = await requireUser();
  if (user.role === "OPS") redirect("/app/ops/orders");
  if (user.role === "FINANCE") redirect("/app/finance/invoices");
  if (user.role === "MEDSTEAD_ADMIN") redirect("/app/admin/orders");

  if (CLINIC_ROLES.includes(user.role)) {
    if (!clinicApproved(user) || !user.clinic) redirect("/app/clinic/pending");
    const orders = await prisma.clinicOrder.findMany({
      where: { clinicId: user.clinic.id },
      include: { items: true, shipment: true },
      orderBy: { createdAt: "desc" },
    });
    return (
      <div>
        <PageHeader
          eyebrow="Orders & Packages"
          title="Your orders"
          lede="Only this clinic. Status and Track package."
          actions={
            <Button href="/app/clinic/catalog" className="min-h-tap">
              Shop
            </Button>
          }
        />
        {orders.length === 0 ? (
          <Empty title="No orders yet" body="Open Shop, add to cart, and place an order." />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id} className="p-4">
                <p className="font-semibold text-navy-900">{o.orderNumber}</p>
                <p className="text-xs text-navy-800/50">
                  {when(o.createdAt)} · {money(o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0))}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                  {o.shipment && <Badge tone="teal">{SHIPMENT_LABEL[o.shipment.status]}</Badge>}
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
            ))}
          </div>
        )}
      </div>
    );
  }

  const shipments = await prisma.shipment.findMany({
    where: { customerId: user.id },
    include: { quote: true },
    orderBy: { createdAt: "desc" },
  });
  const quotes = await prisma.freightQuote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Orders & Packages"
        title="Your orders"
        lede="Freight quotes and packages. Clinic supply is a separate shop."
        actions={
          <Button href="/shop-and-ship" className="min-h-tap">
            Shop & Ship
          </Button>
        }
      />
      {shipments.length === 0 && quotes.length === 0 ? (
        <Empty title="No packages yet" body="Start Shop & Ship or a freight quote." />
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <Card key={s.id} className="p-4">
              <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
              <p className="text-sm text-navy-800/60">
                {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]}
              </p>
              <div className="mt-2">
                <Badge tone="teal">{SHIPMENT_LABEL[s.status]}</Badge>
              </div>
              <Button href={`/track/${s.shipmentCode}`} className="mt-4 min-h-tap">
                Track package
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
