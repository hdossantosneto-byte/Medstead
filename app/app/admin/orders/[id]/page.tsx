import { notFound } from "next/navigation";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { InvoiceButton, ManifestButton, StatusOverride } from "@/components/admin-forms";
import { CLINIC_ORDER_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const order = await prisma.clinicOrder.findUnique({
    where: { id: params.id },
    include: { clinic: true, items: { include: { product: true } }, invoice: true, manifest: true },
  });
  if (!order) notFound();
  const total = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  return (
    <div>
      <PageHeader eyebrow={order.clinic.name} title={order.orderNumber} />
      <Card className="p-6">
        <Badge>{CLINIC_ORDER_LABEL[order.status]}</Badge>
        <div className="mt-4">
          <StatusOverride orderId={order.id} current={order.status} />
        </div>
        <table className="mt-6 w-full text-sm">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-t border-navy-900/8">
                <td className="py-2">{i.product.name}</td>
                <td>{i.qty}</td>
                <td>{money(i.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 font-semibold">Total {money(total)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!order.invoice && <InvoiceButton orderId={order.id} />}
          {!order.manifest && <ManifestButton orderId={order.id} />}
          <Button href={`/docs/commercial-invoice/${order.id}`} variant="ghost">
            Commercial invoice
          </Button>
          <Button href={`/docs/packing-list/${order.id}`} variant="ghost">
            Packing list
          </Button>
          <Button href={`/docs/air-waybill/${order.id}`} variant="ghost">
            Air waybill
          </Button>
          <Button href={`/docs/customs-declaration/${order.id}`} variant="ghost">
            Customs declaration
          </Button>
          <Button href={`/docs/manifest/${order.id}`} variant="ghost">
            Import/export manifest
          </Button>
        </div>
      </Card>
    </div>
  );
}
