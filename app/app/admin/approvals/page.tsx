import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { ApproveButton } from "@/components/admin-forms";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function ApprovalsPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const pending = await prisma.clinic.findMany({
    where: { approved: false },
    include: { users: true },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Approval queue"
        title="Clinic activations"
        lede="My Clinic seats stay inactive until you approve the organization. Approving flips clinic.approved and activates linked clinic_admin / doctor / pharmacy users."
      />
      {pending.length === 0 ? (
        <Empty title="Queue is clear" />
      ) : (
        <div className="space-y-3">
          {pending.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{c.name}</p>
                  <p className="text-sm text-navy-800/60">
                    {c.city}, {c.country} · {c.licenseNote}
                  </p>
                  <ul className="mt-2 text-xs text-navy-800/50">
                    {c.users.map((u) => (
                      <li key={u.id}>
                        {u.name} · {u.email} · {u.role} · {u.active ? "active" : "inactive"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="amber">Pending</Badge>
                  <ApproveButton clinicId={c.id} approved={false} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
