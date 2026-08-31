import { Footer } from "@/components/footer";
import {
  CapabilityGrid,
  Eyebrow,
  GetStartedCta,
  HowItWorks,
  MarketingCtaBand,
  QuoteCta,
  Section,
  TrackCta,
} from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import { PUBLIC_LINE } from "@/lib/constants";

export const metadata = {
  title: "Freight",
  description: PUBLIC_LINE,
};

export default function FreightPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Eyebrow light>Freight</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Medical cargo to hard-to-reach destinations.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Express Air in 3–5 days. Standard Sea in 5–7 days. Quote and track in the MedStead
            Transport app — this page explains the service, it does not replace the app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedCta />
            <QuoteCta variant="ghost-light" />
            <TrackCta variant="ghost-light" />
          </div>
        </div>
      </section>

      <Section className="py-20">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-950">
          Four steps from quote to delivery.
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-navy-800/70">
          Fort Lauderdale is the operations hub — receive, check, and stage. The product is the
          destination other carriers struggle to finish.
        </p>
        <HowItWorks className="mt-10" />
      </Section>

      <div className="bg-sand">
        <Section className="py-20">
          <Eyebrow>Services</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-950">
            Air, sea, pickup, customs, and tracking.
          </h2>
          <CapabilityGrid className="mt-10" />
        </Section>
      </div>

      <Section className="py-20">
        <MarketingCtaBand />
      </Section>

      <Footer />
    </div>
  );
}
