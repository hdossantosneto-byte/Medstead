import Link from "next/link";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function CustomerHome() {
  const user = await requireUser();
  const quotes = await prisma.freightQuote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const shipments = await prisma.shipment.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Freight customer"
        title="My freight"
        lede="Quotes, shipments, rewards, and your WareSpace suite. Public clock starts after release."
        actions={<Button href="/freight">New quote</Button>}
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Shipments</p>
          <p className="mt-2 font-display text-3xl">{shipments.length}</p>
        </Card>
      </div>
      <h2 className="font-display text-xl text-navy-900">Quotes</h2>
      <div className="mt-3 space-y-2">
        {quotes.map((q) => (
          <Card key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <span className="font-semibold">{q.quoteNumber}</span>
            <span className="text-sm text-navy-800/60">
              {q.origin} → {q.destination} · {SERVICE_LABEL[q.service]}
            </span>
            <span>
              {money(q.listAmount)} · online {money(q.onlineAmount)}
            </span>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 font-display text-xl text-navy-900">Shipments</h2>
      <div className="mt-3 space-y-2">
        {shipments.map((s) => (
          <Link key={s.id} href={`/track/${s.shipmentCode}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2 p-4 hover:border-teal-300">
              <span className="font-semibold">{s.shipmentCode}</span>
              <Badge>{SHIPMENT_LABEL[s.status]}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
