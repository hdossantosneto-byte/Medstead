import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SALES_KIND_LABEL, SALES_STAGE_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function SalesAccountsPage() {
  await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const accounts = await prisma.salesAccount.findMany({
    include: { owner: true, clinic: true },
    orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sales desk"
        title="Accounts"
        lede="Clinics, doctors, warehouse customers, charter clients. This is not the admin clinic-approval CRM."
      />
      <div className="grid gap-3">
        {accounts.map((a) => (
          <Link key={a.id} href={`/app/sales/${a.id}`}>
            <Card className="min-h-tap p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-2xl text-navy-900">{a.name}</p>
                <Badge>{SALES_STAGE_LABEL[a.stage]}</Badge>
              </div>
              <p className="mt-1 text-sm text-navy-800/60">
                {SALES_KIND_LABEL[a.kind]} · {a.country} · {a.owner.name}
              </p>
              {a.activityLine && <p className="mt-3 text-sm text-navy-800/70">{a.activityLine}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
