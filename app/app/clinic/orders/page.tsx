import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function ClinicOrdersPage() {
  const user = await requireUser();
  if (!clinicApproved(user) || !user.clinic) redirect("/app/clinic/pending");

  const orders = await prisma.clinicOrder.findMany({
    where: { clinicId: user.clinic.id },
    include: { items: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="My Clinic"
        title="Orders"
        lede="Eleven clinic statuses from Submitted through Delivered. Prices include delivery within 7 days."
      />
      {orders.length === 0 ? (
        <Empty title="No orders yet" body="Browse the catalog to place the first one." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const total = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
            return (
              <Link key={o.id} href={`/app/clinic/orders/${o.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:border-teal-300">
                  <div>
                    <p className="font-semibold text-navy-900">{o.orderNumber}</p>
                    <p className="text-xs text-navy-800/50">{when(o.createdAt)}</p>
                  </div>
                  <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                  <p className="text-sm font-semibold">{money(total)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
