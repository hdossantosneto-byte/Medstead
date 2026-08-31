import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CORRIDOR_LABEL, CORRIDOR_LIVE, FLIGHT_PHASE_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const CORRIDORS = ["FLL_NAS", "FLL_FPO", "FLL_MSY"] as const;

export default async function FlightsPage() {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const queue = await loadQueue(user);
  const flights = await prisma.flight.findMany({
    include: { shipments: { include: { clinicOrder: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Flight ops"
        title="Dispatch flight"
        lede="Del owns the flight-day. Doctors who placed the clinic order do not block cargo. Finance cannot run this board."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {CORRIDORS.map((c) => (
          <Card key={c} className="p-5">
            <p className="font-display text-xl text-navy-900">{CORRIDOR_LABEL[c]}</p>
            {CORRIDOR_LIVE[c] ? (
              <Badge tone="green">Live</Badge>
            ) : (
              <Badge tone="amber">Not live yet</Badge>
            )}
            <p className="mt-2 text-sm text-navy-800/60">
              {c === "FLL_MSY"
                ? "Gulf Coast / New Orleans is next. This is not a dead page."
                : "T-48 prep → T-24 freeze → T-6 go/no-go → dispatch."}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {flights.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-navy-800/70">
              No flight-day yet. Release a Nassau or Freeport package, confirm the date, then
              Dispatch flight from Next or Packages.
            </p>
          </Card>
        )}
        {flights.map((f) => {
          const next = queue.find((i) => i.flightId === f.id || f.shipments.some((s) => i.shipmentId === s.id));
          return (
            <Card key={f.id} className="p-5">
              <p className="font-semibold text-navy-900">{f.flightCode}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="teal">{CORRIDOR_LABEL[f.corridor]}</Badge>
                <Badge>{FLIGHT_PHASE_LABEL[f.phase]}</Badge>
                {f.goNoGo && <Badge tone={f.goNoGo === "GO" ? "green" : "red"}>{f.goNoGo}</Badge>}
              </div>
              {f.activityLine && <p className="mt-3 text-sm text-navy-800/70">{f.activityLine}</p>}
              <ul className="mt-3 text-sm text-navy-800/70">
                {f.shipments.map((s) => (
                  <li key={s.id}>
                    {s.shipmentCode}
                    {s.clinicOrder ? ` · ${s.clinicOrder.orderNumber}` : ""}
                  </li>
                ))}
              </ul>
              {next && next.kind !== "open" && (
                <div className="mt-4">
                  <DedicatedNextButton
                    kind={next.kind}
                    label={next.actionLabel}
                    orderId={next.orderId}
                    shipmentId={next.shipmentId}
                    flightId={next.flightId}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
