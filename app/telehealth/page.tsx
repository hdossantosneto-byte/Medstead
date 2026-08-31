import { Footer } from "@/components/footer";
import { CtaButton, Eyebrow, GetStartedCta, Section } from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import { CONTACT_ORDERS } from "@/lib/constants";

export const metadata = {
  title: "Telehealth",
  description: "Telehealth is coming soon. MedStead does not book appointments on this site.",
};

export default function TelehealthPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <p className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Coming soon
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Telehealth is not live.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            We do not schedule visits, hold an appointment calendar, or send you to book a
            specialist from this website. When telehealth opens, it will be announced here.
          </p>
        </div>
      </section>

      <Section className="py-20">
        <article className="mx-auto max-w-2xl rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
          <Eyebrow>Status</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
            Coming soon — nothing to book.
          </h2>
          <p className="mt-3 text-sm leading-6 text-navy-800/70">
            If you need cargo moved today, use Freight. If you have a clinic question, email{" "}
            <a href={`mailto:${CONTACT_ORDERS}`} className="font-semibold text-forest-700">
              {CONTACT_ORDERS}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <GetStartedCta />
            <CtaButton href="/clinics" variant="outline">
              Clinics
            </CtaButton>
            <CtaButton href="/contact" variant="outline">
              Contact
            </CtaButton>
          </div>
        </article>
      </Section>

      <Footer />
    </div>
  );
}
