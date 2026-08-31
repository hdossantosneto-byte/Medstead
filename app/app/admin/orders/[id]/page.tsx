import { notFound } from "next/navigation";
import { ActivityLine, DedicatedNextButton } from "@/components/next-queue";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { InvoiceButton, ManifestButton, PendingPayButton, StatusOverride } from "@/components/admin-forms";
import { CLINIC_ORDER_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const order = await prisma.clinicOrder.findUnique({
    where: { id: params.id },
    include: {
      clinic: true,
      items: { include: { product: true } },
      invoice: true,
      manifest: true,
      shipment: { include: { gates: true } },
    },
  });
  if (!order) notFound();
  const total = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const gatesGreen = Boolean(
    order.shipment &&
      order.shipment.gates.length > 0 &&
      order.shipment.gates.every((g) => g.state === "GREEN"),
  );

  return (
    <div>
      <PageHeader eyebrow={order.clinic.name} title={order.orderNumber} />
      <Card className="p-6">
        <ActivityLine text={order.activityLine} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{CLINIC_ORDER_LABEL[order.status]}</Badge>
          {order.shipment && (
            <Badge tone="teal">
              {order.shipment.shipmentCode} · {SHIPMENT_LABEL[order.shipment.status]}
              {order.shipment.publicClock ? " · clock on" : " · clock off"}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          {order.status === "SUBMITTED" && (
            <DedicatedNextButton kind="start_review" orderId={order.id} label="Start review" />
          )}
          {order.status === "UNDER_REVIEW" && (
            <DedicatedNextButton kind="approve_order" orderId={order.id} label="Approve order" />
          )}
          {order.status === "APPROVED" && !order.invoice && <InvoiceButton orderId={order.id} />}
          {order.status === "INVOICE_GENERATED" && <PendingPayButton orderId={order.id} />}
          {order.status === "PREPARING_SHIPMENT" && gatesGreen && !order.manifest && (
            <ManifestButton orderId={order.id} />
          )}
        </div>
        <p className="mt-5 text-xs text-navy-800/50">
          Dedicated buttons move clinic and logistics together. Override is for exceptions only.
        </p>
        <div className="mt-2">
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
