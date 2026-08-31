import Link from "next/link";
import { NextQueue } from "@/components/next-queue";
import { Badge, Card, PageHeader } from "@/components/ui";
import { GATE_ORDER, WAREHOUSE } from "@/lib/constants";
import { isDel } from "@/lib/org";
import { loadQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsHome() {
  const user = await requireRole(["OPS"]);
  const del = isDel(user);
  const items = await loadQueue(user);
  const next = items[0];
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
  const allGreen = waitingGates === 0;
  const dispatchReady = del && next?.kind === "dispatch_flight" && allGreen;

  return (
    <div>
      <PageHeader
        eyebrow={del ? "Del · flight ops" : "Warehouse"}
        title={`Hello, ${user.name.split(" ")[0]}`}
        lede={
          del
            ? "Dispatch first. Doctors do not block FLL–NAS / FLL–FPO cargo."
            : "Pick, pack, and clear gates. Del owns dates and dispatch."
        }
      />

      {del && (
        <Link
          href="/app/flights"
          className="mb-4 flex min-h-[140px] flex-col justify-between rounded-3xl border-2 border-navy-900 bg-navy-900 p-6 text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
            Dispatch / flights
          </p>
          <p className="font-display text-4xl">Dispatch flight</p>
          <p className="text-sm text-white/70">
            {flights} live flight-days · Mexico and MSY labeled, not live
          </p>
        </Link>
      )}

      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
          Next job
        </p>
        <NextQueue items={next ? [next] : []} hero />
      </div>

      {dispatchReady ? (
        <p className="mb-6 text-sm text-navy-800/60">
          Six gates are green. Dispatch is the only big button.{" "}
          <Link href="/app/orders#pick-pack" className="font-semibold text-forest-800">
            Orders
          </Link>
          {" · "}
          <Link href="/app/orders#packages" className="font-semibold text-forest-800">
            Packages
          </Link>
        </p>
      ) : (
        <div className="grid gap-3">
          <Link
            href="/app/orders#pick-pack"
            className="flex min-h-[120px] flex-col justify-between rounded-3xl bg-navy-900 p-6 text-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
              Pick / pack
            </p>
            <p className="font-display text-4xl">Orders</p>
            <p className="text-sm text-white/70">{orders} open clinic + freight jobs</p>
          </Link>
          <Link
            href="/app/orders#packages"
            className="flex min-h-[120px] flex-col justify-between rounded-3xl bg-forest-600 p-6 text-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
              Ship / track
            </p>
            <p className="font-display text-4xl">Packages</p>
            <p className="text-sm text-white/80">{packages} trackable packages</p>
          </Link>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            Six-gate release
          </p>
          <p className="mt-2 font-display text-3xl text-navy-900">
            {allGreen ? "All green" : `${waitingGates} waiting`}
          </p>
          <p className="mt-1 text-sm text-navy-800/60">
            All six green before Del dispatches.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Warehouse</p>
          <p className="mt-2 font-display text-3xl text-navy-900">FLL-C15</p>
          <p className="mt-1 text-sm text-navy-800/60">{WAREHOUSE.line}</p>
        </Card>
      </div>

      {items.length > 1 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            After this · {items.length - 1} more
          </p>
          <NextQueue items={items.slice(1, 4)} />
        </div>
      )}

      <Card className="mt-6 p-5">
        <Badge tone="amber">Finance numbers hidden</Badge>
        <p className="mt-2 text-sm leading-6 text-navy-800/70">
          {del
            ? "Only you dispatch. Chris picks and packs. Finance cannot fly."
            : "Del owns dates and Dispatch flight. You confirm/verify warehouse jobs."}
        </p>
      </Card>
    </div>
  );
}
