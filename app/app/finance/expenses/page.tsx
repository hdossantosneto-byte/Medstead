import { ExpenseForm } from "@/components/expense-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { money, whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function ExpensesPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const rows = await prisma.expenseReport.findMany({
    include: { user: true },
    orderBy: { incurredAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Finance books"
        title="Expenses"
        lede="Team files expenses here. Scheduled pay stays on Payroll. No bank balances."
      />
      <ExpenseForm />
      <div className="mt-6 space-y-3">
        {rows.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-navy-800/60">No expenses filed yet.</p>
          </Card>
        )}
        {rows.map((row) => (
          <Card key={row.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{row.title}</p>
                <p className="text-sm text-navy-800/60">
                  {row.user.name} · {whenDate(row.incurredAt)}
                </p>
                {row.note && <p className="mt-1 text-sm text-navy-800/70">{row.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-navy-900">{money(row.amount)}</p>
                <Badge>{row.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
