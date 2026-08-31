import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminInvoicesPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const invoices = await prisma.invoice.findMany({
    include: { order: { include: { clinic: true } }, payments: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Invoices" />
      <div className="space-y-3">
        {invoices.map((inv) => (
          <Card key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">
                {inv.number} · {inv.order.clinic.name}
              </p>
              <p className="text-sm text-navy-800/60">
                {money(inv.amount)} · paid {money(inv.paidAmount)} · {CLINIC_ORDER_LABEL[inv.order.status]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={inv.status === "paid" ? "green" : "amber"}>{inv.status}</Badge>
              <Button href={`/docs/commercial-invoice/${inv.orderId}`} variant="ghost">
                Print
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
