import Link from "next/link";
import { DedicatedNextButton } from "@/components/next-queue";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import {
  AIR_ARM,
  AIR_TRIP_STATUS_LABEL,
  AIRCRAFT_ROUTING,
  CORRIDOR_LABEL,
  CORRIDOR_LIVE,
  FLIGHT_PHASE_LABEL,
  PART135_BANNER,
  TRIP_TYPE_LABEL,
} from "@/lib/constants";
import { clockOn } from "@/lib/format";
import { isDel, isPilot } from "@/lib/org";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

const CORRIDORS = ["FLL_NAS", "FLL_FPO", "FLL_MSY"] as const;
const TRIP_ORDER = [
  "RESCUE_ORGAN",
  "MEDICAL_CARGO",
  "COMPANY_TRAVEL",
  "PERSONAL_GOODS",
  "DOCTOR_CHARTER",
] as const;

function cargoKind(tripType: string) {
  if (tripType === "RESCUE_ORGAN") return "organ";
  if (tripType === "DOCTOR_CHARTER" || tripType === "COMPANY_TRAVEL") return "passengers";
  return "cargo";
}

export default async function FlightsPage() {
  const user = await requireUser();
  if (user.role === "FINANCE") redirect("/app");
  if (user.role !== "OPS" && user.role !== "PILOT" && user.role !== "MEDSTEAD_ADMIN") {
    redirect("/app");
  }

  const del = isDel(user);
  const pilot = isPilot(user);
  const queue = await loadQueue(user);
  const [flights, ready] = await Promise.all([
    prisma.flight.findMany({
      include: {
        shipments: { include: { clinicOrder: { include: { clinic: true } } } },
        requestedBy: true,
        assignedPilot: true,
        callLogs: true,
      },
      orderBy: [{ timeCritical: "desc" }, { createdAt: "desc" }],
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
        eyebrow={AIR_ARM}
        title="Dispatch airline"
        lede={
          del
            ? "Cargo, travel, charter, rescue. Doctors do not block dispatch. Finance cannot fly. Notify pilots in-app."
            : pilot
              ? "Your brief lands here when Del dispatches or taps Notify pilots. Acknowledge in-app. No text thread."
              : "Del owns this board. Warehouse picks and packs. This is not a second company homepage."
        }
        actions={
          <Button href="/app/flights/135" variant="ghost">
            Part 135 — not live
          </Button>
        }
      />

      <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
        <p className="text-sm leading-6 text-navy-800">{PART135_BANNER}</p>
      </Card>

      <div className="grid gap-3">
        {CORRIDORS.map((c) => (
          <Card key={c} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-2xl text-navy-900">{CORRIDOR_LABEL[c]}</p>
              {CORRIDOR_LIVE[c] ? <Badge tone="green">Live</Badge> : <Badge tone="amber">Not live yet</Badge>}
            </div>
            <p className="mt-2 text-sm text-navy-800/70">
              {c === "FLL_MSY"
                ? "Gulf Coast / New Orleans is next. Listed on purpose — Del does not dispatch it yet."
                : "FLL–NAS and FLL–FPO are live medical-cargo corridors."}
            </p>
          </Card>
        ))}
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-2xl text-navy-900">Mexico corridor</p>
            <Badge tone="amber">Not live yet</Badge>
          </div>
          <p className="mt-2 text-sm text-navy-800/70">
            Label only. Del does not dispatch Mexico from this board yet.
          </p>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
          Aircraft routing
        </p>
        <ul className="mt-3 space-y-2 text-sm text-navy-800">
          {AIRCRAFT_ROUTING.map((r) => (
            <li key={r.kind} className="flex justify-between gap-3">
              <span>{r.kind}</span>
              <span className="text-navy-800/60">{r.route}</span>
            </li>
          ))}
        </ul>
      </Card>

      {del && (
        <div className="mt-8">
          <h2 className="font-display text-2xl text-navy-900">Ready medical cargo</h2>
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
                    <Badge>Medical cargo</Badge>
                    {s.clinicOrder && <Badge>{s.clinicOrder.status.replaceAll("_", " ")}</Badge>}
                  </div>
                  <div className="mt-5">
                    <DedicatedNextButton
                      kind="dispatch_flight"
                      label="Dispatch flight"
                      shipmentId={s.id}
                      orderId={s.clinicOrderId ?? undefined}
                      flightId={next?.flightId ?? s.flightId ?? undefined}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {TRIP_ORDER.map((type) => {
        const rows = flights.filter((f) => f.tripType === type);
        if (rows.length === 0) return null;
        return (
          <div key={type} className="mt-8 space-y-3">
            <h2 className="font-display text-2xl text-navy-900">{TRIP_TYPE_LABEL[type]}</h2>
            {type === "RESCUE_ORGAN" && (
              <p className="text-sm text-navy-800/60">
                TIME-CRITICAL dispatch of a rescue organ trip. Not an organ procurement organization
                or UNOS member claim.
              </p>
            )}
            {rows.map((f) => {
              const rescue = f.tripType === "RESCUE_ORGAN";
              const clock = clockOn(f.clockStartedAt);
              const notify = queue.find((i) => i.kind === "notify_pilots" && i.flightId === f.id);
              const schedule = queue.find((i) => i.kind === "schedule_charter" && i.flightId === f.id);
              const airDisp = queue.find((i) => i.kind === "dispatch_air_trip" && i.flightId === f.id);
              const cargoDisp = queue.find((i) => i.kind === "dispatch_flight" && i.flightId === f.id);
              const brief = queue.find((i) => i.kind === "acknowledge_brief" && i.flightId === f.id);
              return (
                <Card
                  key={f.id}
                  className={rescue ? "border-2 border-red-700 p-5" : "p-5"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-navy-900">{f.flightCode}</p>
                    {rescue && <Badge tone="red">TIME-CRITICAL</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-navy-800/70">
                    {f.origin} → {f.destination} · {cargoKind(f.tripType)}
                    {f.assignedPilot ? ` · Pilot ${f.assignedPilot.name}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="teal">{CORRIDOR_LABEL[f.corridor]}</Badge>
                    <Badge>{AIR_TRIP_STATUS_LABEL[f.tripStatus]}</Badge>
                    <Badge>{FLIGHT_PHASE_LABEL[f.phase]}</Badge>
                    {f.goNoGo && <Badge tone={f.goNoGo === "GO" ? "green" : "red"}>{f.goNoGo}</Badge>}
                    {!f.live && <Badge tone="amber">Not live</Badge>}
                    {f.pilotAdvisedAt && <Badge tone="green">Pilot advised</Badge>}
                    {f.callLogs.length > 0 && <Badge tone="amber">Phone intake</Badge>}
                  </div>
                  {clock && (
                    <p className="mt-3 font-display text-3xl text-red-700">{clock}</p>
                  )}
                  {f.purpose && <p className="mt-3 text-sm text-navy-800/80">{f.purpose}</p>}
                  {f.passengerNote && (
                    <p className="mt-1 text-sm text-navy-800/60">{f.passengerNote}</p>
                  )}
                  {f.custodyNote && (
                    <p className="mt-2 text-sm text-navy-800/80">Custody: {f.custodyNote}</p>
                  )}
                  {f.temperatureNote && (
                    <p className="mt-1 text-sm text-navy-800/80">Temperature: {f.temperatureNote}</p>
                  )}
                  {f.activityLine && <p className="mt-3 text-sm text-navy-800/70">{f.activityLine}</p>}
                  {f.callLogs[0] && (
                    <p className="mt-2 text-sm text-navy-800/70">
                      Phone · {f.callLogs[0].callerOrg || f.callLogs[0].callerName} · {f.callLogs[0].callerPhone}
                    </p>
                  )}
                  {f.requestedBy && (
                    <p className="mt-2 text-xs text-navy-800/50">Opened by {f.requestedBy.name}</p>
                  )}
                  <div className="mt-4 grid gap-3">
                    {del && notify && (
                      <DedicatedNextButton
                        kind="notify_pilots"
                        label="Notify pilots"
                        flightId={f.id}
                      />
                    )}
                    {del && schedule && (
                      <DedicatedNextButton
                        kind="schedule_charter"
                        label="Schedule trip"
                        flightId={f.id}
                      />
                    )}
                    {del && airDisp && (
                      <DedicatedNextButton
                        kind="dispatch_air_trip"
                        label={rescue ? "Dispatch TIME-CRITICAL" : "Dispatch flight"}
                        flightId={f.id}
                      />
                    )}
                    {del && cargoDisp && f.shipments[0] && (
                      <DedicatedNextButton
                        kind="dispatch_flight"
                        label="Dispatch flight"
                        shipmentId={f.shipments[0].id}
                        flightId={f.id}
                      />
                    )}
                    {pilot && brief && (
                      <DedicatedNextButton
                        kind="acknowledge_brief"
                        label="Acknowledge brief"
                        flightId={f.id}
                      />
                    )}
                    {!del && !pilot && (
                      <p className="text-sm text-navy-800/60">Del taps dispatch and Notify pilots.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}

      {del && (
        <p className="mt-8 text-sm text-navy-800/60">
          Open company travel from{" "}
          <Link href="/app/travel" className="font-semibold text-forest-800">
            Company travel
          </Link>
          . Clinics request a charter from their seat.
        </p>
      )}
    </div>
  );
}
