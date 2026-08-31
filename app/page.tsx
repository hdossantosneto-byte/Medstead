import Link from "next/link";
import { Footer } from "@/components/footer";
import {
  CapabilityGrid,
  CtaButton,
  Eyebrow,
  GetStartedCta,
  MarketingCtaBand,
  QuoteCta,
  Section,
  TrackCta,
  TrustRow,
} from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import {
  MARKETING_EYEBROW,
  MARKETING_H1,
  PUBLIC_LINE,
  TAGLINE,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-300">
              {MARKETING_EYEBROW}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              {MARKETING_H1}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">{PUBLIC_LINE}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              {TAGLINE}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GetStartedCta />
              <TrackCta variant="ghost-light" />
            </div>
          </div>
          <div className="rounded-3xl bg-white p-8 text-navy-950 shadow-tile">
            {/* Official lockup — white card so the white-bg mark stays readable */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/medstead-logo.png"
              alt="MedStead Transport"
              className="mx-auto h-52 w-auto sm:h-60"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-sand px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-700">
                  Express Air
                </p>
                <p className="mt-1 text-sm font-semibold">3–5 days</p>
              </div>
              <div className="rounded-xl bg-sand px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-700">
                  Standard Sea
                </p>
                <p className="mt-1 text-sm font-semibold">5–7 days</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <Section className="py-8">
            <TrustRow light />
          </Section>
        </div>
      </section>

      <Section className="py-20">
        <Eyebrow>Two doors</Eyebrow>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-950 md:text-4xl">
          Freight is live. Clinics are coming soon.
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-navy-800/70">
          Start a shipment today. Healthcare access for hard-to-reach communities is on the way —
          telehealth is not live yet, and we do not book appointments here.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <p className="inline-flex rounded-full bg-forest-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-800">
              Live
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-navy-950">Freight</h3>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Medical cargo by air and sea. Quote, ship, and track in the MedStead Transport app.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GetStartedCta />
              <QuoteCta />
              <CtaButton href="/freight" variant="outline">
                How freight works
              </CtaButton>
            </div>
          </article>
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <p className="inline-flex rounded-full bg-navy-900/8 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy-800">
              Coming soon
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-navy-950">Clinics</h3>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Healthcare access for communities other networks leave behind. No clinic catalog on
              this site. Telehealth remains coming soon.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaButton href="/clinics" variant="navy">
                Learn about Clinics
              </CtaButton>
              <CtaButton href="/telehealth" variant="outline">
                Telehealth status
              </CtaButton>
            </div>
          </article>
        </div>
      </Section>

      <div className="bg-sand">
        <Section className="py-20">
          <Eyebrow>Capabilities</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-950 md:text-4xl">
            Built for medical cargo, not general freight theater.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-navy-800/70">
            Express air, standard sea, remote pickup, customs coordination, and live tracking —
            the same service tiles you will use in the app.
          </p>
          <CapabilityGrid className="mt-10" />
        </Section>
      </div>

      <Section className="py-20">
        <MarketingCtaBand />
        <p className="mt-8 text-center text-sm text-navy-800/55">
          Questions?{" "}
          <Link href="/contact" className="font-semibold text-forest-700 hover:underline">
            Contact the orders desk
          </Link>
          .
        </p>
      </Section>

      <Footer />
    </div>
  );
}
