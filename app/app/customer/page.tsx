import Link from "next/link";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { QUOTE_STATUS_LABEL, SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function CustomerHome() {
  const user = await requireUser();
  const quotes = await prisma.freightQuote.findMany({
    where: { userId: user.id },
    include: { shipment: true },
    orderBy: { createdAt: "desc" },
  });
  const shipments = await prisma.shipment.findMany({
    where: { customerId: user.id },
    include: { quote: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Your orders"
        title="Orders"
        lede="Status and Track package. Del owns delivery dates."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button href="/shop-and-ship" className="min-h-tap">
              Shop & Ship
            </Button>
            <Button href="/freight" variant="ghost" className="min-h-tap">
              + New order
            </Button>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Points</p>
          <p className="mt-2 font-display text-3xl">{user.rewardsPoints}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Suite</p>
          <p className="mt-2 font-display text-2xl">{user.warehouseCode ?? "Unassigned"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Packages</p>
          <p className="mt-2 font-display text-3xl">{shipments.length}</p>
        </Card>
      </div>

      <h2 className="font-display text-xl text-navy-900">Your orders</h2>
      {shipments.length === 0 && quotes.length === 0 ? (
        <Empty title="No orders yet" body="Shop & Ship a retailer link, or start a freight quote." />
      ) : (
        <div className="mt-3 space-y-3">
          {shipments.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
                  <p className="text-xs text-navy-800/50">
                    {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]} · {when(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="teal">{SHIPMENT_LABEL[s.status]}</Badge>
                  {s.quote && (
                    <Badge>{QUOTE_STATUS_LABEL[s.quote.status] ?? s.quote.status}</Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button href={`/track/${s.shipmentCode}`} className="min-h-tap">
                  Track package
                </Button>
                <Button href="/orders" variant="ghost" className="min-h-tap">
                  Orders & Packages
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {quotes.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-xl text-navy-900">Quotes</h2>
          <div className="mt-3 space-y-2">
            {quotes.map((q) => (
              <Card key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{q.quoteNumber}</p>
                  <p className="text-sm text-navy-800/60">
                    {q.origin} → {q.destination} · {SERVICE_LABEL[q.service]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{QUOTE_STATUS_LABEL[q.status] ?? q.status}</Badge>
                  <span className="text-sm">
                    {money(q.listAmount)} · online {money(q.onlineAmount)}
                  </span>
                  {q.shipment && (
                    <Link href={`/track/${q.shipment.shipmentCode}`} className="text-sm font-semibold text-forest-800">
                      Track package
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
