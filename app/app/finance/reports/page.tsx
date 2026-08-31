import { Card, PageHeader } from "@/components/ui";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function ReportsPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const invoices = await prisma.invoice.findMany();
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const quotes = await prisma.freightQuote.findMany();
  const quoted = quotes.reduce((s, q) => s + q.listAmount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Reports"
        lede="Collections snapshot for the demo ledger. Flight and warehouse controls stay with ops."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Billed</p>
          <p className="mt-2 font-display text-3xl text-navy-900">{money(billed)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Collected</p>
          <p className="mt-2 font-display text-3xl text-navy-900">{money(collected)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Outstanding</p>
          <p className="mt-2 font-display text-3xl text-navy-900">{money(billed - collected)}</p>
        </Card>
        <Card className="p-6 md:col-span-3">
          <p className="text-sm text-navy-800/70">
            Freight quotes on file: {money(quoted)} list. Clinic invoice #{invoices.length}. Finance
            cannot tender cargo or freeze a flight-day manifest.
          </p>
        </Card>
      </div>
    </div>
  );
}
