import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Button, Card, Field, inputClass, PageHeader } from "@/components/ui";

export const metadata = { title: "Track a shipment" };

export default function TrackPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Visibility"
          title="Track a MedStead shipment"
          lede="Enter a shipment ID in the format MS-YYYYMMDD-ORIGIN-DEST-####. Public clock starts after release."
        />
        <Card className="max-w-xl p-6">
          <form action="/track/lookup" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Shipment ID">
                <input
                  className={inputClass}
                  name="code"
                  placeholder="MS-20260820-FLL-NAS-0001"
                  required
                />
              </Field>
            </div>
            <Button type="submit">Track</Button>
          </form>
          <p className="mt-4 text-xs text-navy-800/50">
            Demo ID: MS-20260820-FLL-NAS-0001
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
