import { notFound, redirect } from "next/navigation";
import { ActivityLine } from "@/components/next-queue";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, CLINIC_ORDER_STATUSES } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function ClinicOrderDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!clinicApproved(user) || !user.clinic) redirect("/app/clinic/pending");

  const order = await prisma.clinicOrder.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } }, invoice: true, manifest: true, events: true },
  });
  if (!order || order.clinicId !== user.clinic.id) notFound();
  const total = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const current = CLINIC_ORDER_STATUSES.indexOf(order.status);

  return (
    <div>
      <PageHeader eyebrow="Clinic order" title={order.orderNumber} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ol className="space-y-2">
            {CLINIC_ORDER_STATUSES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${i <= current ? "bg-teal-600" : "bg-navy-900/15"}`} />
                <span className={i <= current ? "font-semibold text-navy-900" : "text-navy-800/40"}>
                  {CLINIC_ORDER_LABEL[s]}
                </span>
              </li>
            ))}
          </ol>
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-navy-800/50">
                <th className="pb-2">SKU</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Book</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-t border-navy-900/8">
                  <td className="py-2">
                    {i.product.name}
                    <div className="text-xs text-navy-800/40">{i.product.sku}</div>
                  </td>
                  <td>{i.qty}</td>
                  <td>{money(i.unitPrice)}</td>
                  <td>{i.priceLabel === "DEMO" ? <Badge tone="demo">DEMO</Badge> : <Badge tone="green">Sourced</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-right font-semibold">Total {money(total)}</p>
        </Card>
        <Card className="p-6">
          <ActivityLine text={order.activityLine} />
          <div className="mt-3">
            <Badge>{CLINIC_ORDER_LABEL[order.status]}</Badge>
          </div>
          {order.invoice && (
            <p className="mt-4 text-sm">
              Invoice {order.invoice.number} · {money(order.invoice.amount)}
            </p>
          )}
          {order.manifest && (
            <p className="mt-2 text-sm">Manifest {order.manifest.number}</p>
          )}
          {order.promisedDate && (
            <p className="mt-2 text-sm">Delivery date (set by Del): {when(order.promisedDate)}</p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {order.invoice && (
              <Button href={`/docs/commercial-invoice/${order.id}`} variant="ghost">
                Commercial invoice
              </Button>
            )}
            <Button href={`/docs/packing-list/${order.id}`} variant="ghost">
              Packing list
            </Button>
          </div>
          <ul className="mt-6 space-y-1 text-xs text-navy-800/50">
            {order.events.map((e) => (
              <li key={e.id}>
                {when(e.createdAt)} · {e.toStatus}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
