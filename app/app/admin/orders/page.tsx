import Link from "next/link";
import { RoleInbox } from "@/components/role-inbox";
import { ActivityLine, DedicatedNextButton } from "@/components/next-queue";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { InvoiceButton, ManifestButton, PendingPayButton, StatusOverride } from "@/components/admin-forms";
import { CLINIC_ORDER_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
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
        lede="Do this next is the inbox. Dedicated buttons move clinic and logistics together. Override is for exceptions only."
      />
      <RoleInbox />
      <div className="space-y-4">
        {orders.map((o) => {
          const total = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
          const gatesGreen = Boolean(
            o.shipment && o.shipment.gates.length > 0 && o.shipment.gates.every((g) => g.state === "GREEN"),
          );
          return (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-900">
                    {o.orderNumber} · {o.clinic.name}
                  </p>
                  <p className="text-sm text-navy-800/60">{money(total)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                  {o.shipment && (
                    <Badge tone="teal">
                      {SHIPMENT_LABEL[o.shipment.status]}
                      {o.shipment.publicClock ? "" : " · clock off"}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <ActivityLine text={o.activityLine} />
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-2">
                {o.status === "SUBMITTED" && (
                  <DedicatedNextButton kind="start_review" orderId={o.id} label="Start review" />
                )}
                {o.status === "UNDER_REVIEW" && (
                  <DedicatedNextButton kind="approve_order" orderId={o.id} label="Approve order" />
                )}
                {o.status === "APPROVED" && !o.invoice && <InvoiceButton orderId={o.id} />}
                {o.invoice && o.status === "INVOICE_GENERATED" && <PendingPayButton orderId={o.id} />}
                {o.status === "PREPARING_SHIPMENT" && gatesGreen && !o.manifest && (
                  <ManifestButton orderId={o.id} />
                )}
                <Button href={`/app/admin/orders/${o.id}`} variant="ghost">
                  Open
                </Button>
                <Link className="text-sm font-semibold text-teal-800" href={`/docs/commercial-invoice/${o.id}`}>
                  Docs
                </Link>
              </div>
              <p className="mt-4 text-xs text-navy-800/50">Override exception — both machines stay in sync.</p>
              <div className="mt-2">
                <StatusOverride orderId={o.id} current={o.status} />
              </div>
              {o.shipment && (
                <p className="mt-2 text-xs text-navy-800/50">
                  Linked {o.shipment.shipmentCode} · gates {gatesGreen ? "all green" : "not ready"}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
