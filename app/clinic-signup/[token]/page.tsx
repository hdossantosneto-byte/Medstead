import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { ClinicInviteForm } from "@/components/clinic-invite-form";
import { Card, PageHeader } from "@/components/ui";

const PRESETS: Record<string, string> = {
  "360": "360 Wellness",
  demo: "New clinic",
  pharmacy: "Pharmacy partner",
};

export const metadata = { title: "Clinic invite" };

export default function ClinicSignupPage({ params }: { params: { token: string } }) {
  const preset = PRESETS[params.token.toLowerCase()];
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-xl px-4 py-10 pb-28">
        <PageHeader
          eyebrow="Clinic invite"
          title={preset ?? "Join MedStead"}
          lede="Seats stay inactive until Clint approves. This is not a consumer pharmacy shop."
        />
        <Card className="p-6">
          <ClinicInviteForm token={params.token} presetName={preset} />
        </Card>
      </div>
      <Footer />
    </div>
  );
}
