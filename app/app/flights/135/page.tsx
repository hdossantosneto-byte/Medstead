import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { AIR_ARM, PART135_BANNER } from "@/lib/constants";
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

  const rows = [
    { label: "Aircraft", value: board.aircraftNote || "Placeholder — Hairson fills later." },
    { label: "Crew", value: board.crewNote || "Placeholder — Hairson fills later." },
    { label: "Duty / rest", value: board.dutyRestNote || "Placeholder — Hairson fills later." },
    { label: "Ops specs", value: board.opsSpecsNote || "Placeholder — Hairson fills later." },
    { label: "Maintenance", value: board.maintenanceNote || "Placeholder — Hairson fills later." },
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
            On-demand charter {board.onDemandCharter ? "listed" : "placeholder"}
          </Badge>
          <Badge tone={board.cargoOps ? "green" : "amber"}>
            Cargo ops {board.cargoOps ? "listed" : "placeholder"}
          </Badge>
        </div>
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
