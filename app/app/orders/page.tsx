import Link from "next/link";
import { redirect } from "next/navigation";
import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import {
  CLINIC_ORDER_LABEL,
  CLINIC_ROLES,
  QUOTE_STATUS_LABEL,
  SERVICE_LABEL,
  SHIPMENT_LABEL,
} from "@/lib/constants";
import { money, when } from "@/lib/format";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function AppOrdersPage() {
  const user = await requireUser();
  if (user.role === "FINANCE") redirect("/app/finance/invoices");
  if (user.role === "MEDSTEAD_ADMIN") redirect("/app/admin/orders");

  if (user.role === "OPS") {
    const queue = await loadQueue(user);
    const [orders, freight, shipments] = await Promise.all([
      prisma.clinicOrder.findMany({
        include: { clinic: true, items: { include: { product: true } }, shipment: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipment.findMany({
        where: { clinicOrderId: null, status: { not: "DELIVERED_CLOSED" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipment.findMany({
        include: { gates: true, clinicOrder: { include: { invoice: true } }, flight: true, quote: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return (
      <div>
        <PageHeader
          eyebrow="Orders & Packages"
          title="Pick, pack, and packages"
          lede="Clinic and freight jobs on one screen. Line values and invoice totals stay hidden."
        />

        <h2 id="pick-pack" className="font-display text-2xl text-navy-900">
          Pick / pack
        </h2>
        <p className="mt-1 text-sm text-navy-800/60">Warehouse work waiting on you.</p>
        <div className="mt-3 space-y-3">
          {orders.length === 0 && freight.length === 0 && (
            <Empty title="No open pick jobs" body="Clinic and freight cards land here." />
          )}
          {orders.map((o) => {
            const next = queue.find(
              (i) => i.orderId === o.id || (o.shipment && i.shipmentId === o.shipment.id),
            );
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

        <h2 id="packages" className="mt-10 font-display text-2xl text-navy-900">
          Packages
        </h2>
        <p className="mt-1 text-sm text-navy-800/60">Trackable MS- packages. Advance the next legal step.</p>
        <div className="mt-3 space-y-3">
          {shipments.length === 0 && <Empty title="No packages" body="Released freight and clinic shipments appear here." />}
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
                  {s.clinicOrder?.invoice && (
                    <Badge tone={s.clinicOrder.invoice.status === "paid" ? "green" : "amber"}>
                      Counter {s.clinicOrder.invoice.status === "paid" ? "paid" : "due"}
                    </Badge>
                  )}
                  {!s.clinicOrder && s.quote && (
                    <Badge tone={s.quote.status === "APPROVED" ? "green" : "amber"}>
                      Counter {s.quote.status === "APPROVED" ? "paid" : "due"}
                    </Badge>
                  )}
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
          {quotes.map((q) => (
            <Card key={q.id} className="p-4">
              <p className="font-semibold text-navy-900">{q.quoteNumber}</p>
              <p className="text-sm text-navy-800/60">
                {q.origin} → {q.destination} · {SERVICE_LABEL[q.service]}
              </p>
              <div className="mt-2">
                <Badge tone="amber">{QUOTE_STATUS_LABEL[q.status] ?? q.status}</Badge>
              </div>
            </Card>
          ))}
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
