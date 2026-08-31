import { AirTripForm } from "@/components/air-trip-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { AIR_ARM, AIR_TRIP_STATUS_LABEL, CLINIC_ROLES, TRIP_TYPE_LABEL } from "@/lib/constants";
import { clockOn } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClinicCharterPage() {
  const user = await requireUser();
  if (!CLINIC_ROLES.includes(user.role)) redirect("/app");
  if (!clinicApproved(user)) redirect("/app/clinic/pending");

  const trips = await prisma.flight.findMany({
    where: {
      requestedById: user.id,
      tripType: { in: ["DOCTOR_CHARTER", "RESCUE_ORGAN"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow={AIR_ARM}
        title="Charter a flight"
        lede="Passenger charter for a doctor or clinic — not a clinic supply order. Del owns dispatch. No invoice totals on this screen."
      />
      <Card className="p-5">
        <AirTripForm
          tripTypes={["DOCTOR_CHARTER"]}
          title="Request a doctor charter"
          lede="Del schedules. Finance cannot fly. No WhatsApp."
        />
      </Card>
      <Card className="mt-4 p-5">
        <AirTripForm
          tripTypes={["RESCUE_ORGAN"]}
          title="Rescue / organ trip"
          lede="TIME-CRITICAL dispatch of a rescue organ trip. Not an organ procurement organization or UNOS member claim. No patient name."
          rescueFields
        />
      </Card>
      <div className="mt-6 space-y-3">
        {trips.map((f) => (
          <Card key={f.id} className={f.timeCritical ? "border-2 border-red-700 p-5" : "p-5"}>
            <p className="font-semibold text-navy-900">{f.flightCode}</p>
            <p className="mt-1 text-sm text-navy-800/70">
              {TRIP_TYPE_LABEL[f.tripType]} · {f.origin} → {f.destination}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{AIR_TRIP_STATUS_LABEL[f.tripStatus]}</Badge>
              {f.timeCritical && <Badge tone="red">TIME-CRITICAL</Badge>}
            </div>
            {f.clockStartedAt && (
              <p className="mt-3 font-display text-2xl text-red-700">{clockOn(f.clockStartedAt)}</p>
            )}
            {f.activityLine && <p className="mt-3 text-sm text-navy-800/70">{f.activityLine}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
