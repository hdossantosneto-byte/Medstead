import { AirTripForm } from "@/components/air-trip-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { AIR_ARM, AIR_TRIP_STATUS_LABEL, TRIP_TYPE_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TravelPage() {
  const user = await requireUser();
  const admin = user.role === "MEDSTEAD_ADMIN" || user.role === "OPS";
  const customer = user.role === "CUSTOMER" || user.role === "PUBLIC";
  if (!admin && !customer) redirect("/app");

  const trips = await prisma.flight.findMany({
    where: {
      tripType: { in: ["COMPANY_TRAVEL", "PERSONAL_GOODS"] },
      ...(admin ? {} : { requestedById: user.id }),
    },
    include: { assignedPilot: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow={AIR_ARM}
        title={admin ? "Company travel" : "Personal goods"}
        lede={
          admin
            ? "Hairson and company people. Del dispatches on the air-arm board. This is not a second company homepage."
            : "Household / personal cargo on an MTG Airlines trip. Public freight IDs stay MS-."
        }
      />
      <Card className="p-5">
        {admin ? (
          <AirTripForm
            tripTypes={["COMPANY_TRAVEL", "PERSONAL_GOODS", "RESCUE_ORGAN"]}
            title="Open a trip"
            lede="Rescue organ trips are TIME-CRITICAL dispatch only — not an OPO or UNOS claim."
            rescueFields
          />
        ) : (
          <AirTripForm
            tripTypes={["PERSONAL_GOODS"]}
            title="Request a personal goods move"
            lede="Del schedules it. No WhatsApp."
          />
        )}
      </Card>
      <div className="mt-6 space-y-3">
        {trips.map((f) => (
          <Card key={f.id} className="p-5">
            <p className="font-semibold text-navy-900">{f.flightCode}</p>
            <p className="mt-1 text-sm text-navy-800/70">
              {TRIP_TYPE_LABEL[f.tripType]} · {f.origin} → {f.destination}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{AIR_TRIP_STATUS_LABEL[f.tripStatus]}</Badge>
              {!f.live && <Badge tone="amber">Not live</Badge>}
              {f.timeCritical && <Badge tone="red">TIME-CRITICAL</Badge>}
            </div>
            {f.activityLine && <p className="mt-3 text-sm text-navy-800/70">{f.activityLine}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
