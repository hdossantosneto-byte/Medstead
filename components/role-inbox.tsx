import { NextQueue } from "@/components/next-queue";
import { loadQueue } from "@/lib/queue";
import { requireUser } from "@/lib/session";

export async function RoleInbox({ limit = 3 }: { limit?: number }) {
  const user = await requireUser();
  const items = await loadQueue(user);
  if (items.length === 0) return null;
  const shown = items.slice(0, limit);
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
        Do this next · {items.length} waiting
      </p>
      <NextQueue items={shown} />
      {items.length > limit && (
        <p className="mt-3 text-sm">
          <a href="/app" className="font-semibold text-teal-800 hover:underline">
            See all {items.length} items on the inbox
          </a>
        </p>
      )}
    </div>
  );
}
