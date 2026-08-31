import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CORRIDOR_LABEL, CORRIDOR_LIVE, FLIGHT_PHASE_LABEL } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const CORRIDORS = ["FLL_NAS", "FLL_FPO", "FLL_MSY"] as const;
const PHASES = [
  "T48_PREP",
  "T24_FREEZE",
  "T6_GO_NO_GO",
  "TENDER",
  "DEPARTED",
  "ARRIVED",
  "CUSTOMS",
  "POD",
] as const;

export default async function FlightsPage() {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const queue = await loadQueue(user);
  const [flights, ready] = await Promise.all([
    prisma.flight.findMany({
      include: { shipments: { include: { clinicOrder: { include: { clinic: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.findMany({
      where: {
        destination: { in: ["NAS", "FPO"] },
        status: { in: ["RELEASED_MANIFESTED", "IN_TRANSIT"] },
      },
      include: { clinicOrder: { include: { clinic: true, user: true } }, gates: true, flight: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dispatchable = ready.filter((s) => {
    const clinicReady =
      !s.clinicOrder ||
      s.clinicOrder.status === "MANIFEST_GENERATED" ||
      s.clinicOrder.status === "SHIPPED" ||
      s.clinicOrder.status === "IN_TRANSIT";
    return clinicReady && (!s.flight || s.flight.phase !== "DEPARTED");
  });

  return (
    <div>
      <PageHeader
        eyebrow="Del"
        title="Dispatch flight"
        lede="Doctors who placed the order do not block cargo. Finance cannot run this board. Public clock starts after release."
      />

      <div className="grid gap-3">
        {CORRIDORS.map((c) => (
          <Card key={c} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-2xl text-navy-900">{CORRIDOR_LABEL[c]}</p>
              {CORRIDOR_LIVE[c] ? (
                <Badge tone="green">Live</Badge>
              ) : (
                <Badge tone="amber">Not live yet</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-navy-800/70">
              {c === "FLL_MSY"
                ? "Gulf Coast / New Orleans is next. This corridor is listed on purpose — it is not a dead page."
                : "T-48 product / permits / aircraft / weather → T-24 freeze → T-6 go/no-go → tender → departure → arrival → customs → POD."}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Flight-day</p>
        <ol className="mt-3 space-y-2">
          {PHASES.map((p) => (
            <li key={p} className="text-sm text-navy-800">
              {FLIGHT_PHASE_LABEL[p]}
            </li>
          ))}
        </ol>
      </Card>

      <h2 className="mt-8 font-display text-2xl text-navy-900">Ready to dispatch</h2>
      <p className="mt-1 text-sm text-navy-800/60">
        One package, one button. The clinic doctor does not need to be on the phone.
      </p>
      <div className="mt-4 space-y-3">
        {dispatchable.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-navy-800/70">
              No Nassau or Freeport package is released yet. Confirm the date on a manifested
              package, then Dispatch flight lands here.
            </p>
          </Card>
        )}
        {dispatchable.map((s) => {
          const next = queue.find((i) => i.kind === "dispatch_flight" && i.shipmentId === s.id);
          const placedBy = s.clinicOrder?.user.role === "DOCTOR" ? "Doctor order" : "Clinic order";
          return (
            <Card key={s.id} className="p-5">
              <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
              <p className="mt-1 text-sm text-navy-800/70">
                {s.origin} → {s.destination}
                {s.clinicOrder ? ` · ${s.clinicOrder.orderNumber}` : ""} · {s.consignee}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="teal">{placedBy}</Badge>
                {s.clinicOrder && <Badge>{s.clinicOrder.status.replaceAll("_", " ")}</Badge>}
              </div>
              <div className="mt-5">
                {next ? (
                  <DedicatedNextButton
                    kind="dispatch_flight"
                    label="Dispatch flight"
                    shipmentId={s.id}
                    orderId={s.clinicOrderId ?? undefined}
                    flightId={s.flightId ?? undefined}
                  />
                ) : (
                  <DedicatedNextButton
                    kind="dispatch_flight"
                    label="Dispatch flight"
                    shipmentId={s.id}
                    orderId={s.clinicOrderId ?? undefined}
                  />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {flights.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="font-display text-2xl text-navy-900">Flight-days</h2>
          {flights.map((f) => {
            const next = queue.find(
              (i) => i.flightId === f.id || f.shipments.some((s) => i.shipmentId === s.id),
            );
            return (
              <Card key={f.id} className="p-5">
                <p className="font-semibold text-navy-900">{f.flightCode}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="teal">{CORRIDOR_LABEL[f.corridor]}</Badge>
                  <Badge>{FLIGHT_PHASE_LABEL[f.phase]}</Badge>
                  {f.goNoGo && <Badge tone={f.goNoGo === "GO" ? "green" : "red"}>{f.goNoGo}</Badge>}
                </div>
                {f.activityLine && <p className="mt-3 text-sm text-navy-800/70">{f.activityLine}</p>}
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
      )}
    </div>
  );
}
