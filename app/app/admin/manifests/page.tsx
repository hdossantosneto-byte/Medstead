import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminManifestsPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const manifests = await prisma.manifest.findMany({
    include: { order: { include: { clinic: true } } },
    orderBy: { createdAt: "desc" },
  });
  const surface = await prisma.clinicOrder.findMany({
    where: { status: { in: ["SUBMITTED", "PAYMENT_PENDING"] } },
    include: { clinic: true },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Manifests"
        lede="Generated import/export manifests. Also surface Submitted and Payment Pending orders that still need a packet."
      />
      {surface.length > 0 && (
        <Card className="mb-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Needs attention
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {surface.map((o) => (
              <li key={o.id}>
                {o.orderNumber} · {o.clinic.name} · {CLINIC_ORDER_LABEL[o.status]}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="space-y-3">
        {manifests.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">{m.number}</p>
              <p className="text-sm text-navy-800/60">
                {m.order.orderNumber} · {m.origin} → {m.destination} · {m.order.clinic.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{CLINIC_ORDER_LABEL[m.order.status]}</Badge>
              <Button href={`/docs/manifest/${m.orderId}`} variant="ghost">
                Print
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
