import Link from "next/link";
import { NextQueue } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { GATE_ORDER, WAREHOUSE } from "@/lib/constants";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsHome() {
  const user = await requireRole(["OPS"]);
  const items = await loadQueue(user);
  const [orders, packages, flights] = await Promise.all([
    prisma.clinicOrder.count({ where: { status: { not: "DELIVERED" } } }),
    prisma.shipment.count({ where: { status: { not: "DELIVERED_CLOSED" } } }),
    prisma.flight.count({ where: { live: true, phase: { not: "POD" } } }),
  ]);
  const openShipments = await prisma.shipment.findMany({
    where: { status: { not: "DELIVERED_CLOSED" } },
    include: { gates: true },
  });
  const waitingGates = openShipments.filter(
    (s) =>
      s.gates.length < GATE_ORDER.length || s.gates.some((g) => g.state !== "GREEN"),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Medication operations"
        title={`Hello, ${user.name.split(" ")[0]}`}
        lede="Fulfillment on your phone. One next job. No WhatsApp. Finance numbers stay hidden."
      />

      <div className="grid gap-3">
        <Link
          href="/app/ops/orders"
          className="flex min-h-[120px] flex-col justify-between rounded-3xl bg-navy-900 p-6 text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">Pick / pack</p>
          <p className="font-display text-4xl">Orders</p>
          <p className="text-sm text-white/70">{orders} open clinic + freight jobs</p>
        </Link>
        <Link
          href="/app/ops/packages"
          className="flex min-h-[120px] flex-col justify-between rounded-3xl bg-forest-600 p-6 text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Track / release</p>
          <p className="font-display text-4xl">Packages</p>
          <p className="text-sm text-white/80">{packages} trackable packages</p>
        </Link>
        <Link
          href="/app/flights"
          className="flex min-h-[120px] flex-col justify-between rounded-3xl border-2 border-navy-900 bg-white p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Del</p>
          <p className="font-display text-4xl text-navy-900">Dispatch flight</p>
          <p className="text-sm text-navy-800/70">
            {flights} live flight-days · doctors do not block cargo
          </p>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            Six-gate release
          </p>
          <p className="mt-2 font-display text-3xl text-navy-900">
            {waitingGates === 0 ? "All green first" : `${waitingGates} waiting`}
          </p>
          <p className="mt-1 text-sm text-navy-800/60">All six green before manifest and dispatch.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Warehouse</p>
          <p className="mt-2 font-display text-3xl text-navy-900">FLL-C15</p>
          <p className="mt-1 text-sm text-navy-800/60">{WAREHOUSE.line}</p>
        </Card>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
          Next job · {items.length} waiting
        </p>
        <NextQueue items={items.slice(0, 3)} />
        {items.length > 3 && (
          <p className="mt-3 text-sm">
            <a href="/app" className="font-semibold text-forest-800">
              See all {items.length} on Next
            </a>
          </p>
        )}
      </div>

      <Card className="mt-6 p-5">
        <Badge tone="amber">Finance numbers hidden</Badge>
        <p className="mt-2 text-sm leading-6 text-navy-800/70">
          Sales cannot promise dates. Only Del dispatches FLL–NAS and FLL–FPO. Gulf Coast / New
          Orleans is not live yet.
        </p>
      </Card>
    </div>
  );
}
