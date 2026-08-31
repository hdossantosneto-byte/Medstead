import Link from "next/link";
import { SalesAccountForm } from "@/components/sales-account-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SALES_KIND_LABEL, SALES_STAGE_LABEL } from "@/lib/constants";
import { whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const STAGES = ["PROSPECT", "TALKING", "EVENT_SET", "BOOKED", "ACTIVE"] as const;

export default async function SalesAccountsPage() {
  await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const [accounts, clinics, customers] = await Promise.all([
    prisma.salesAccount.findMany({
      include: { owner: true, clinic: true },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.clinic.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["CUSTOMER", "PUBLIC"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const counts = Object.fromEntries(STAGES.map((s) => [s, accounts.filter((a) => a.stage === s).length]));

  return (
    <div>
      <PageHeader
        eyebrow="Sales desk"
        title="Accounts"
        lede="Your book. Not the admin clinic-approval CRM. No revenue totals."
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {STAGES.map((s) => (
          <div key={s} className="min-w-[7.5rem] rounded-2xl border border-navy-900/8 bg-white px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-700">
              {SALES_STAGE_LABEL[s]}
            </p>
            <p className="mt-1 font-display text-2xl text-navy-900">{counts[s]}</p>
          </div>
        ))}
      </div>
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
              {a.nextFollowUpAt && (
                <p className="mt-2 text-sm text-navy-800/70">Next {whenDate(a.nextFollowUpAt)}</p>
              )}
              {a.activityLine && <p className="mt-2 text-sm text-navy-800/70">{a.activityLine}</p>}
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <p className="font-display text-2xl text-navy-900">Open an account</p>
        <p className="mt-1 text-sm text-navy-800/60">
          Clinic, doctor, warehouse customer, or charter client. Link a live record when you have one.
        </p>
        <div className="mt-4">
          <SalesAccountForm clinics={clinics} customers={customers} />
        </div>
      </Card>
    </div>
  );
}
