import { Badge, Card, PageHeader } from "@/components/ui";
import { PaymentForm } from "@/components/admin-forms";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function FinanceInvoicesPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const invoices = await prisma.invoice.findMany({
    include: { order: { include: { clinic: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        lede="Outstanding clinic balances. Finance signs payment and credit. Warehouse and flight actions are not available here."
      />
      <div className="space-y-4">
        {invoices.map((inv) => {
          const remaining = Math.max(0, inv.amount - inv.paidAmount);
          return (
            <Card key={inv.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-900">
                    {inv.number} · {inv.order.clinic.name}
                  </p>
                  <p className="text-sm text-navy-800/60">
                    {money(inv.amount)} · outstanding {money(remaining)}
                  </p>
                </div>
                <Badge tone={inv.status === "paid" ? "green" : "amber"}>{inv.status}</Badge>
              </div>
              {remaining > 0 && (
                <div className="mt-4 max-w-sm">
                  <PaymentForm invoiceId={inv.id} remaining={remaining} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
