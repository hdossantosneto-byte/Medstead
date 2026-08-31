import Link from "next/link";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { InvoiceButton, ManifestButton, PendingPayButton, StatusOverride } from "@/components/admin-forms";
import { CLINIC_ORDER_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminOrdersPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const orders = await prisma.clinicOrder.findMany({
    include: { clinic: true, items: true, invoice: true, manifest: true, shipment: { include: { gates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Clinic orders"
        lede="Override any of the 11 statuses. Generate invoices and manifests. Payment pending and submitted should also surface on manifests."
      />
      <div className="space-y-4">
        {orders.map((o) => {
          const total = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
          const green = o.shipment?.gates.every((g) => g.state === "GREEN");
          return (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-900">
                    {o.orderNumber} · {o.clinic.name}
                  </p>
                  <p className="text-sm text-navy-800/60">{money(total)}</p>
                </div>
                <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
              </div>
              <div className="mt-4">
                <StatusOverride orderId={o.id} current={o.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!o.invoice && <InvoiceButton orderId={o.id} />}
                {o.invoice && o.status === "INVOICE_GENERATED" && <PendingPayButton orderId={o.id} />}
                {!o.manifest && <ManifestButton orderId={o.id} />}
                <Button href={`/app/admin/orders/${o.id}`} variant="ghost">
                  Open
                </Button>
                <Link className="text-sm font-semibold text-teal-800" href={`/docs/commercial-invoice/${o.id}`}>
                  Docs
                </Link>
              </div>
              {o.shipment && (
                <p className="mt-2 text-xs text-navy-800/50">
                  Linked shipment {o.shipment.shipmentCode} · gates {green ? "all green" : "not ready"}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
