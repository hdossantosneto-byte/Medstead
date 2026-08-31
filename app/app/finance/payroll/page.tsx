import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { MarkPaySentButton } from "@/components/payroll-forms";
import { ADP_BANNER, PAYING_ENTITY, PAY_METHOD_ZELLE } from "@/lib/constants";
import { money, whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function PayrollPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const rows = await prisma.scheduledPay.findMany({
    include: { payee: true },
    orderBy: { dueAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Finance books"
        title="Payroll"
        lede="Scheduled pay dates only. This screen does not send money."
      />
      <Notice>{ADP_BANNER}</Notice>
      <p className="mt-3 text-sm text-navy-800/70">
        Paying entity: <strong>{PAYING_ENTITY}</strong>. Source of pay:{" "}
        <strong>{PAY_METHOD_ZELLE}</strong>. Last-4 only. Payees are not employees. Clinic AR stays
        on Invoices.
      </p>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <Card key={row.id} className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-navy-900">{row.payee.displayName}</p>
                {row.payee.roleLabel && (
                  <p className="text-xs text-navy-800/50">{row.payee.roleLabel}</p>
                )}
                <p className="mt-2 font-display text-3xl text-navy-900">{money(row.amount)}</p>
                <p className="mt-1 text-sm text-navy-800/70">Due {whenDate(row.dueAt)}</p>
                <p className="mt-1 text-sm text-navy-800/70">{PAY_METHOD_ZELLE}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Badge tone={row.status === "SENT" ? "green" : "amber"}>
                  {row.status === "SENT" ? "Sent" : "Scheduled / not sent"}
                </Badge>
                {row.status === "SCHEDULED" && <MarkPaySentButton id={row.id} />}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
