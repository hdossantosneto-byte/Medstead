import { notFound } from "next/navigation";
import { BookEventForm, LogFollowUpForm, SalesAccountActions } from "@/components/sales-forms";
import { Badge, Card, PageHeader } from "@/components/ui";
import {
  AIR_TRIP_STATUS_LABEL,
  CLINIC_ORDER_LABEL,
  SALES_EVENT_LABEL,
  SALES_KIND_LABEL,
  SALES_STAGE_LABEL,
  TRIP_TYPE_LABEL,
} from "@/lib/constants";
import { when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function SalesAccountPage({ params }: { params: { id: string } }) {
  await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const account = await prisma.salesAccount.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      clinic: { include: { users: true, orders: { orderBy: { createdAt: "desc" }, take: 8 } } },
      customer: true,
      events: { include: { owner: true, flight: true }, orderBy: { occursAt: "desc" } },
      activities: { orderBy: { at: "desc" }, take: 20 },
      followUps: { orderBy: { dueAt: "desc" }, take: 6 },
    },
  });
  if (!account) notFound();

  const clinicUserIds = account.clinic?.users.map((u) => u.id) ?? [];
  const flightOr: Array<
    | { requestedById: string | { in: string[] } }
    | { salesEvents: { some: { accountId: string } } }
  > = [{ salesEvents: { some: { accountId: account.id } } }];
  if (clinicUserIds.length) flightOr.push({ requestedById: { in: clinicUserIds } });
  if (account.customerId) flightOr.push({ requestedById: account.customerId });
  const flights = await prisma.flight.findMany({
    where: { OR: flightOr },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  type Feed = { at: Date; title: string; body: string; tag: string };
  const feed: Feed[] = [];
  for (const a of account.activities.filter((row) => row.kind === "followup" || row.kind === "note" || row.kind === "order")) {
    feed.push({ at: a.at, title: a.title, body: a.body || "", tag: a.kind });
  }
  for (const fu of account.followUps) {
    feed.push({
      at: fu.doneAt ?? fu.dueAt,
      title: fu.doneAt ? "Follow-up logged" : "Follow-up due",
      body: fu.note || "Next conversation in-app.",
      tag: "followup",
    });
  }
  for (const o of account.clinic?.orders ?? []) {
    feed.push({
      at: o.createdAt,
      title: o.orderNumber,
      body: `${CLINIC_ORDER_LABEL[o.status]}${o.activityLine ? ` · ${o.activityLine}` : ""}`,
      tag: "order",
    });
  }
  for (const f of flights) {
    const dispatched = f.tripStatus === "DISPATCHED";
    feed.push({
      at: f.dispatchedAt ?? f.createdAt,
      title: dispatched ? `${f.flightCode} dispatched` : f.flightCode,
      body: `${TRIP_TYPE_LABEL[f.tripType]} · ${AIR_TRIP_STATUS_LABEL[f.tripStatus]} · ${f.origin}→${f.destination}${f.activityLine ? ` · ${f.activityLine}` : ""}`,
      tag: dispatched ? "dispatched" : "flight",
    });
  }
  for (const ev of account.events) {
    feed.push({
      at: ev.occursAt,
      title: ev.title,
      body: `${SALES_EVENT_LABEL[ev.kind]} · ${ev.status}${ev.owner ? ` · ${ev.owner.name}` : ""}${ev.flight ? ` · ${ev.flight.flightCode}` : ""}${ev.activityLine ? ` · ${ev.activityLine}` : ""}`,
      tag: "event",
    });
  }
  feed.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div>
      <PageHeader
        eyebrow={SALES_KIND_LABEL[account.kind]}
        title={account.name}
        lede={`${account.country} · ${account.owner.name} owns this conversation. No revenue totals on this desk.`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>{SALES_STAGE_LABEL[account.stage]}</Badge>
        {account.clinic && <Badge tone="teal">{account.clinic.name}</Badge>}
        {account.customer && <Badge tone="teal">{account.customer.name}</Badge>}
      </div>

      <div className="grid gap-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            Log follow-up
          </p>
          <div className="mt-3">
            <LogFollowUpForm accountId={account.id} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            Book an event
          </p>
          <p className="mt-1 text-sm text-navy-800/60">
            Charter day hands Del a trip. Warehouse tour hands Chris a visit.
          </p>
          <div className="mt-3">
            <BookEventForm accountId={account.id} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            Next conversion
          </p>
          <div className="mt-3">
            <SalesAccountActions accountId={account.id} kind={account.kind} />
          </div>
        </Card>
      </div>

      <h2 className="mt-8 font-display text-2xl text-navy-900">Timeline</h2>
      <p className="mt-1 text-sm text-navy-800/60">
        Orders, flights, follow-ups, and events on one feed.
      </p>
      <div className="mt-4 space-y-3">
        {feed.slice(0, 16).map((row, i) => (
          <Card key={`${row.title}-${i}`} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">{row.title}</p>
              <Badge tone="teal">{row.tag}</Badge>
            </div>
            <p className="mt-1 text-xs text-navy-800/50">{when(row.at)}</p>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">{row.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
