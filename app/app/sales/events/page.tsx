import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SALES_EVENT_LABEL } from "@/lib/constants";
import { whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function SalesEventsPage() {
  await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const events = await prisma.salesEvent.findMany({
    include: { account: true, flight: true },
    orderBy: { occursAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sales desk"
        title="Events"
        lede="Dinners, site visits, warehouse tours, conferences, doctor charter days. Booking hands Del or ops a next action."
      />
      <div className="grid gap-3">
        {events.map((ev) => (
          <Link key={ev.id} href={`/app/sales/${ev.accountId}`}>
            <Card className="min-h-tap p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-2xl text-navy-900">{ev.title}</p>
                <Badge>{ev.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-navy-800/60">
                {SALES_EVENT_LABEL[ev.kind]} · {whenDate(ev.occursAt)} · {ev.account.name}
              </p>
              {ev.handedTo && (
                <p className="mt-2 text-sm text-navy-800/70">
                  Handed to {ev.handedTo === "DEL" ? "Del · MTG Airlines" : "warehouse ops"}
                </p>
              )}
              {ev.flight && (
                <p className="mt-1 text-sm text-navy-800/70">{ev.flight.flightCode} is on the air board.</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
