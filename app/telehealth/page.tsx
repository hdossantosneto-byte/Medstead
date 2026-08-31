import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Button, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Telehealth partners" };

export default function TelehealthPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <PageHeader
          eyebrow="Partners"
          title="Telehealth"
          lede="MedStead does not schedule visits in this app. Licensed telehealth is a partner redirect from your clinic."
        />
        <Card className="p-8">
          <p className="text-sm leading-6 text-navy-800/70">
            Ask your clinic which licensed partner they use. Completing care there does not put
            patient records in the MedStead CRM.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button href="/contact" className="min-h-tap">
              Continue to support
            </Button>
            <Button href="/orders" variant="ghost" className="min-h-tap">
              Orders & Packages
            </Button>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
