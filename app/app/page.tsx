import { NextQueue } from "@/components/next-queue";
import { PageHeader } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { requireUser } from "@/lib/session";

export default async function AppHome() {
  const user = await requireUser();
  const items = await loadQueue(user);

  const owner =
    user.role === "MEDSTEAD_ADMIN"
      ? "Clint · sales / admin"
      : user.role === "OPS"
        ? "Del · fulfillment"
        : user.role === "FINANCE"
          ? "Finance · payment and credit"
          : ROLE_LABEL[user.role];

  return (
    <div>
      <PageHeader eyebrow={owner} title="Do this next" />
      <NextQueue items={items.slice(0, 1)} hero />
      {items.length > 1 && (
        <p className="mt-3 text-sm text-navy-800/60">{items.length - 1} more after this one.</p>
      )}
      {items.length > 1 && (
        <div className="mt-4">
          <NextQueue items={items.slice(1)} />
        </div>
      )}
    </div>
  );
}
