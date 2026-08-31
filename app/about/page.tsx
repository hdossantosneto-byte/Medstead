import { Footer } from "@/components/footer";
import { CtaButton, Eyebrow, GetStartedCta, Section } from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import { CONTACT_ORDERS, MISSION, PUBLIC_LINE, TAGLINE, WAREHOUSE } from "@/lib/constants";

export const metadata = {
  title: "About",
  description: MISSION,
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Eyebrow light>About MedStead</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {MISSION}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{PUBLIC_LINE}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {TAGLINE}
          </p>
        </div>
      </section>

      <Section className="py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile lg:col-span-2">
            <Eyebrow>Specialty</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
              Hard-to-reach destinations.
            </h2>
            <p className="mt-4 text-sm leading-7 text-navy-800/75">
              MedStead Transport moves medicine and supplies to communities other carriers
              struggle to reach — remote markets, island markets, and last miles that general
              freight treats as an exception. That specialty is the company. We are not a single
              corridor brochure, and we do not sell a destination as the product.
            </p>
            <p className="mt-4 text-sm leading-7 text-navy-800/75">
              Publicly we are MedStead and MedStead Transport. The company is MEDSTEAD LLC.
              Marketing and orders mail live at medsteadgroup.com. Freight operations live in the
              MedStead Transport app.
            </p>
          </article>
          <article className="rounded-3xl bg-navy-950 p-8 text-white">
            <Eyebrow light>Operations hub</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Fort Lauderdale</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              The hub is where cargo is received, checked, and staged. It is operations — not the
              whole story, and not the homepage headline.
            </p>
            <p className="mt-5 text-sm leading-6 text-white/80">{WAREHOUSE.line}</p>
          </article>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-navy-950">
              Two doors. One mission.
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Freight is live today: Express Air, Standard Sea, hard-to-reach pickup, customs
              coordination, and live tracking. Clinics — healthcare access for those same
              communities — is coming soon. Telehealth is not live and cannot be booked here.
            </p>
          </article>
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>Customs</Eyebrow>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-navy-950">
              Coordination, not brokerage.
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              MedStead is not a licensed customs broker. We help gather and move the documents
              medical cargo needs. Duties and formal entry stay with the importer of record.
            </p>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <GetStartedCta />
          <CtaButton href="/contact" variant="outline">
            Contact {CONTACT_ORDERS}
          </CtaButton>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
