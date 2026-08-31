import { Badge, Card, PageHeader } from "@/components/ui";
import { ApproveButton } from "@/components/admin-forms";
import { MARKET_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function ClinicsPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const clinics = await prisma.clinic.findMany({
    include: { users: true, orders: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Clinics"
        lede="USA and international organizations. Each market sees a different price book."
      />
      <div className="space-y-3">
        {clinics.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">{c.name}</p>
              <p className="text-sm text-navy-800/60">
                {c.city}, {c.country} · {c.type} · {c.users.length} users · {c.orders.length} orders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={c.approved ? "green" : "amber"}>{c.approved ? "Approved" : "Pending"}</Badge>
              <Badge>{MARKET_LABEL[c.market]}</Badge>
              <ApproveButton clinicId={c.id} approved={c.approved} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
