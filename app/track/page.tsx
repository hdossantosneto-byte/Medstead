import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { TrackForm } from "@/components/track-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Track a package" };

export default function TrackPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Orders & Packages"
          title="Track your package"
          lede="Enter a package ID in the format MS-YYYYMMDD-ORIGIN-DEST-####. Public clock starts after release."
        />
        <Card className="max-w-xl p-6">
          <TrackForm />
          <p className="mt-4 text-xs text-navy-800/50">Demo ID: MS-20260820-FLL-NAS-0001</p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
