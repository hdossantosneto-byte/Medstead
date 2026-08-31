import { FleetList } from "@/components/fleet-forms";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { AIR_ARM, PART135_BANNER, PART135_FLEET_LINE, PART135_NOT_ON_FILE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Part135Page() {
  const user = await requireUser();
  if (user.role !== "OPS" && user.role !== "PILOT" && user.role !== "MEDSTEAD_ADMIN") {
    redirect("/app");
  }

  const board =
    (await prisma.part135Readiness.findUnique({ where: { id: "mtg-airlines" } })) ?? {
      operatorName: AIR_ARM,
      live: false,
      certificateNote: PART135_BANNER,
      aircraftNote: "",
      crewNote: "",
      dutyRestNote: "",
      opsSpecsNote: "",
      maintenanceNote: "",
      onDemandCharter: false,
      cargoOps: false,
    };

  const fleet = await prisma.aircraft.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  const rows = [
    { label: "Crew", value: board.crewNote || PART135_NOT_ON_FILE },
    { label: "Duty / rest", value: board.dutyRestNote || PART135_NOT_ON_FILE },
    { label: "Ops specs", value: board.opsSpecsNote || PART135_NOT_ON_FILE },
    { label: "Maintenance", value: board.maintenanceNote || PART135_NOT_ON_FILE },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={AIR_ARM}
        title="Part 135 readiness"
        lede="Structure only. This board is not a certificate and does not make MedStead or MTG Airlines a certificated Part 135 operator."
      />
      <Notice>{PART135_BANNER}</Notice>
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-2xl text-navy-900">{board.operatorName}</p>
          <Badge tone="amber">NOT LIVE</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-navy-800/70">{board.certificateNote}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={board.onDemandCharter ? "green" : "amber"}>
            On-demand charter {board.onDemandCharter ? "listed" : "not live"}
          </Badge>
          <Badge tone={board.cargoOps ? "green" : "amber"}>
            Cargo ops {board.cargoOps ? "listed" : "not live"}
          </Badge>
        </div>
      </Card>
      <Card className="mt-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Aircraft</p>
        <p className="mt-2 text-sm leading-6 text-navy-800">{PART135_FLEET_LINE}</p>
        <FleetList aircraft={fleet} />
      </Card>
      <div className="mt-4 grid gap-3">
        {rows.map((r) => (
          <Card key={r.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
              {r.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-navy-800">{r.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
