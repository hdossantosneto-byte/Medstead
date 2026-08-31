import { TrackForm } from "@/components/track-form";
import { Card } from "@/components/ui";

export const metadata = { title: "Track a package" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Live tracking</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-950">Track your package</h1>
      <p className="mt-4 text-navy-800/70">
        Enter a booking ID in the format MS-YYYYMMDD-ORIGIN-DEST-####. Public transit starts after
        ops releases the shipment.
      </p>
      <Card className="mt-8 p-6">
        <TrackForm />
        <p className="mt-4 text-xs text-navy-800/50">Demo ID: MS-20260820-FLL-NAS-0001</p>
      </Card>
    </div>
  );
}
