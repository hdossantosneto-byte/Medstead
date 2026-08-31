import { Badge, Card, PageHeader } from "@/components/ui";
import { CrmStageForm } from "@/components/admin-forms";
import { CRM_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function CrmPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const accounts = await prisma.crmAccount.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <PageHeader
        eyebrow="Admin CRM"
        title="Sales pipeline"
        lede="Targeted → Contacted → Discovery → Qualified → Forum/Consult → Eligibility review → Activated → First service → Repeat → Strategic. Hold/lost with a reason. No patient data in this CRM. ENABLE cycle: Educate, Navigate, Activate, Build, Leverage, Expand."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-navy-900">{a.name}</p>
              <Badge>{CRM_LABEL[a.stage]}</Badge>
              <Badge tone="teal">{a.market}</Badge>
            </div>
            <p className="mt-1 text-xs text-navy-800/50">
              {a.kind} · {a.country}
            </p>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">{a.ownerNote}</p>
            {a.holdReason && <p className="mt-2 text-sm text-amber-800">Reason: {a.holdReason}</p>}
            <div className="mt-4">
              <CrmStageForm id={a.id} stage={a.stage} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
