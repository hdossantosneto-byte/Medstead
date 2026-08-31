import { Footer } from "@/components/footer";
import {
  CtaButton,
  Eyebrow,
  GetStartedCta,
  Section,
} from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import { CONTACT_ORDERS, MISSION } from "@/lib/constants";

export const metadata = {
  title: "Clinics",
  description:
    "Healthcare access for hard-to-reach communities. Clinic services and telehealth are coming soon.",
};

export default function ClinicsPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <p className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Coming soon
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Healthcare access for hard-to-reach communities.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{MISSION}</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Clinics is the second door. It is not live yet. There is no catalog, no booking, and
            no appointment calendar on this site.
          </p>
        </div>
      </section>

      <Section className="py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>What this is</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
              Access, not a storefront.
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              MedStead exists so communities other carriers leave behind can still get medicine,
              supplies, and coordinated care. When Clinics opens, licensed healthcare businesses
              will work with us through that door — not through a public product list.
            </p>
          </article>
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>Telehealth</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
              Coming soon. Not bookable today.
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Telehealth is not live. We do not schedule visits, hold an appointment calendar, or
              ask you to see a specialist from this website. Check the status page if you need a
              clear yes or no.
            </p>
            <div className="mt-6">
              <CtaButton href="/telehealth" variant="outline">
                Telehealth status
              </CtaButton>
            </div>
          </article>
        </div>

        <div className="mt-5 rounded-3xl bg-sand px-8 py-10">
          <Eyebrow>Need to move cargo now?</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
            Freight is the live door.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-800/70">
            If you are shipping medicine or supplies today, use Get Started or request a quote in
            the MedStead Transport app. For clinic questions that cannot wait, email{" "}
            <a href={`mailto:${CONTACT_ORDERS}`} className="font-semibold text-forest-700">
              {CONTACT_ORDERS}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <GetStartedCta />
            <CtaButton href="/freight" variant="outline">
              Freight services
            </CtaButton>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
