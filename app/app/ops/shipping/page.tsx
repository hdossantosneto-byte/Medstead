import Link from "next/link";
import { ActivityLine } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { GateToggle, ShipmentStatusForm } from "@/components/admin-forms";
import { SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsShippingPage() {
  await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const shipments = await prisma.shipment.findMany({
    include: { gates: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Ops"
        title="Shipping"
        lede="Logistics statuses are separate from clinic order statuses. All six gates must be green before Released/Manifested. Public clock starts after release."
      />
      <div className="space-y-4">
        {shipments.map((s) => {
          const green = s.gates.filter((g) => g.state === "GREEN").length;
          return (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/track/${s.shipmentCode}`} className="font-semibold text-navy-900 hover:underline">
                    {s.shipmentCode}
                  </Link>
                  <p className="text-sm text-navy-800/60">
                    {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]} · {s.consignee}
                  </p>
                </div>
                <Badge>{SHIPMENT_LABEL[s.status]}</Badge>
              </div>
              <p className="mt-2 text-xs text-navy-800/50">
                Gates {green}/6 green · {s.weightLb} lb · {s.pieces} pcs
                {s.promisedDate ? " · date set by Del" : ""}
              </p>
              <div className="mt-3">
                <ActivityLine text={s.activityLine} />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {s.gates.map((g) => (
                  <GateToggle key={g.id} shipmentId={s.id} name={g.name} state={g.state} />
                ))}
              </div>
              <div className="mt-4 max-w-sm">
                <ShipmentStatusForm shipmentId={s.id} current={s.status} canShip />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
