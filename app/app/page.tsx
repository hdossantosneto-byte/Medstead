import Link from "next/link";
import { NextQueue } from "@/components/next-queue";
import { Card, PageHeader } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { isDel } from "@/lib/org";
import { osArmsFor } from "@/lib/os";
import { loadQueue } from "@/lib/queue";
import { requireUser } from "@/lib/session";

export default async function AppHome() {
  const user = await requireUser();
  const items = await loadQueue(user);
  const arms = osArmsFor(user.role);

  const owner =
    user.role === "MEDSTEAD_ADMIN"
      ? "Clint · company management"
      : user.role === "OPS"
        ? isDel(user)
          ? "Del · MTG Airlines"
          : "Chris · 3PL for meds"
        : user.role === "FINANCE"
          ? "Finance · accounting"
          : user.role === "PILOT"
            ? "Pilot · MTG Airlines"
            : ROLE_LABEL[user.role];

  return (
    <div>
      <PageHeader
        eyebrow={owner}
        title="Do this next"
        lede="One operating system. One login. Your next action is the only big button."
      />
      <NextQueue items={items.slice(0, 1)} hero />
      {items.length > 1 && (
        <p className="mt-3 text-sm text-navy-800/60">{items.length - 1} more after this one.</p>
      )}
      {items.length > 1 && (
        <div className="mt-4">
          <NextQueue items={items.slice(1)} />
        </div>
      )}

      <p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
        Company OS
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {arms.map((arm) => (
          <Link key={arm.title} href={arm.href}>
            <Card className="min-h-tap p-5">
              <p className="font-display text-2xl text-navy-900">{arm.title}</p>
              <p className="mt-1 text-sm text-navy-800/60">{arm.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
