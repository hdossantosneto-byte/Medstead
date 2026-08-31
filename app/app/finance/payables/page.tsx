import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { MarkPaySentButton } from "@/components/payroll-forms";
import { ADP_BANNER, PAYING_ENTITY, PAY_METHOD_ZELLE } from "@/lib/constants";
import { money, whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function PayablesPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const rows = await prisma.scheduledPay.findMany({
    where: { invoiceNumber: { not: null } },
    include: { payee: true },
    orderBy: { dueAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Finance books"
        title="Payables"
        lede="Vendor and settlement dates only. This is not clinic AR. This screen does not send money."
      />
      <Notice>{ADP_BANNER}</Notice>
      <p className="mt-3 text-sm text-navy-800/70">
        Paying entity: <strong>{PAYING_ENTITY}</strong>. Source of pay:{" "}
        <strong>{PAY_METHOD_ZELLE}</strong>. Last-4 only. Ops cannot see these totals.
      </p>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <Card key={row.id} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
              {row.invoiceNumber}
            </p>
            <p className="mt-2 font-semibold text-navy-900">{row.payee.displayName}</p>
            <p className="mt-2 font-display text-3xl text-navy-900">{money(row.amount)}</p>
            <p className="mt-2 text-sm text-navy-800/70">
              Invoice {whenDate(row.dueAt)} · Due upon receipt
            </p>
            <p className="mt-1 text-sm text-navy-800/70">{PAYING_ENTITY}</p>
            <p className="mt-1 text-sm text-navy-800/70">{PAY_METHOD_ZELLE}</p>
            {row.note && <p className="mt-3 text-sm leading-6 text-navy-800/70">{row.note}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge tone={row.status === "SENT" ? "green" : "amber"}>
                {row.status === "SENT" ? "Sent" : "Scheduled / not sent"}
              </Badge>
              {row.status === "SCHEDULED" && <MarkPaySentButton id={row.id} />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
