import { Badge, Card, PageHeader } from "@/components/ui";
import { GATE_LABEL, GATE_ORDER, SHIPMENT_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function CompliancePage() {
  await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const shipments = await prisma.shipment.findMany({
    include: { gates: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Six-gate release"
        title="Compliance"
        lede="Customer/consignee, product/source, commercial/finance, export/import, packaging/quality, carrier/capacity. Finance signs payment/credit. All green before manifest. Reps cannot promise dates — Del owns delivery-date promises."
      />
      <div className="space-y-4">
        {shipments.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
              <Badge>{SHIPMENT_LABEL[s.status]}</Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GATE_ORDER.map((name) => {
                const g = s.gates.find((x) => x.name === name);
                const tone = g?.state === "GREEN" ? "green" : g?.state === "RED" ? "red" : "amber";
                return (
                  <div key={name} className="rounded-xl bg-sand px-3 py-2">
                    <p className="text-xs font-medium text-navy-800">{GATE_LABEL[name]}</p>
                    <Badge tone={tone}>{g?.state ?? "PENDING"}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
