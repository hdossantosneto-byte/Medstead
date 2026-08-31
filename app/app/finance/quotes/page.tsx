import { Badge, Card, PageHeader } from "@/components/ui";
import { SERVICE_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function FinanceQuotesPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const quotes = await prisma.freightQuote.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Finance" title="Freight quotes" lede="List vs online (10% off) amounts." />
      <div className="space-y-3">
        {quotes.map((q) => (
          <Card key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">{q.quoteNumber}</p>
              <p className="text-sm text-navy-800/60">
                {q.origin} → {q.destination} · {SERVICE_LABEL[q.service]} · {q.user?.name ?? "Guest"} · {when(q.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{money(q.listAmount)}</p>
              <p className="text-xs text-teal-800">Online {money(q.onlineAmount)}</p>
              <Badge>{q.weightLb} lb</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
