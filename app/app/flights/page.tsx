import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export default async function FlightsPage() {
  await requireUser();
  return (
    <div>
      <PageHeader
        eyebrow="Coming later"
        title="Flight ops"
        lede="FLL–NAS, FLL–FPO, and future MSY flight-day controls (T-48 / T-24 / T-6) will live here. This module is intentionally a stub."
      />
      <Card className="p-8">
        <p className="text-sm leading-6 text-navy-800/70">
          Planned corridors: Fort Lauderdale to Nassau and Freeport, then Gulf Coast / New Orleans,
          then Jamaica and the wider Caribbean. Finance cannot run flights. Medication operations
          cannot see finance totals. Manifest freeze remains an ops function once this module ships.
        </p>
        <p className="mt-4 text-sm font-semibold text-teal-800">Status: coming later</p>
      </Card>
    </div>
  );
}
