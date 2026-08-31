import { Badge, Card, PageHeader } from "@/components/ui";
import { NextQueue } from "@/components/next-queue";
import { ROLE_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { clinicApproved, requireUser } from "@/lib/session";

export default async function AppHome() {
  const user = await requireUser();
  const items = await loadQueue(user);

  const owner =
    user.role === "MEDSTEAD_ADMIN"
      ? "Clint · sales / admin"
      : user.role === "OPS"
        ? "Del · delivery dates / ops"
        : user.role === "FINANCE"
          ? "Finance · payment and credit"
          : ROLE_LABEL[user.role];

  return (
    <div>
      <PageHeader
        eyebrow={owner}
        title="Do this next"
        lede="One list. Work waiting on you. One button does the next legal step and hands the record to the next role. No WhatsApp."
      />

      <NextQueue items={items} />

      <Card className="mt-8 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Who owns what
        </p>
        <p className="mt-2 text-sm leading-6 text-navy-800/70">
          Sales and admin CRM cannot promise delivery dates — only ops (Del). Finance cannot ship.
          Ops cannot see invoice totals. Clinic seats stay inactive until admin approval. No patient
          data in the sales CRM.
        </p>
        {user.role === "OPS" && (
          <p className="mt-3">
            <Badge tone="amber">Finance numbers hidden</Badge>
          </p>
        )}
        {user.role === "FINANCE" && (
          <p className="mt-3">
            <Badge tone="amber">Shipping actions disabled</Badge>
          </p>
        )}
        {user.role === "MEDSTEAD_ADMIN" && (
          <p className="mt-3">
            <Badge tone="amber">Date promises belong to Del</Badge>
          </p>
        )}
        {!clinicApproved(user) && (
          <p className="mt-3">
            <Badge tone="amber">Waiting on admin approval</Badge>
          </p>
        )}
      </Card>
    </div>
  );
}
