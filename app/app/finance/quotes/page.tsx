import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { QUOTE_STATUS_LABEL, SERVICE_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function FinanceQuotesPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const quotes = await prisma.freightQuote.findMany({
    include: { user: true, shipment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Freight quotes"
        lede="Customer sees Quote under review until you approve. List vs online (10% off)."
      />
      <div className="space-y-3">
        {quotes.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{q.quoteNumber}</p>
                <p className="text-sm text-navy-800/60">
                  {q.origin} → {q.destination} · {SERVICE_LABEL[q.service]} · {q.user?.name ?? "Guest"} ·{" "}
                  {when(q.createdAt)}
                </p>
                {q.retailerUrl && (
                  <p className="mt-1 truncate text-xs text-navy-800/50">{q.retailerUrl}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(q.listAmount)}</p>
                <p className="text-xs text-teal-800">Online {money(q.onlineAmount)}</p>
                <Badge tone={q.status === "APPROVED" ? "green" : "amber"}>
                  {QUOTE_STATUS_LABEL[q.status] ?? q.status}
                </Badge>
              </div>
            </div>
            {q.status === "UNDER_REVIEW" && (
              <div className="mt-4">
                <DedicatedNextButton kind="approve_quote" label="Approve quote" quoteId={q.id} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
