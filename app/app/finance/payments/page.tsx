import { Card, PageHeader } from "@/components/ui";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function PaymentsPage() {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const payments = await prisma.payment.findMany({
    include: { invoice: { include: { order: { include: { clinic: true } } } }, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Finance" title="Payments" lede="No bank account numbers are stored." />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-800/50">
              <th className="px-4 py-3">When</th>
              <th>Invoice</th>
              <th>Clinic</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-navy-900/8">
                <td className="px-4 py-2">{when(p.createdAt)}</td>
                <td>{p.invoice.number}</td>
                <td>{p.invoice.order.clinic.name}</td>
                <td>{money(p.amount)}</td>
                <td>
                  {p.method}
                  {p.online ? " · online" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
