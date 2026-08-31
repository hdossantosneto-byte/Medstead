import { Footer } from "@/components/footer";
import { ContactForm } from "@/components/contact-form";
import { Eyebrow, GetStartedCta, QuoteCta, Section, TrackCta } from "@/components/marketing";
import { PublicNav } from "@/components/public-nav";
import { CONTACT_ORDERS } from "@/lib/constants";

export const metadata = {
  title: "Contact",
  description: `Orders desk — ${CONTACT_ORDERS}`,
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Eyebrow light>Contact</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Talk to the orders desk.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Email{" "}
            <a href={`mailto:${CONTACT_ORDERS}`} className="font-semibold text-forest-300">
              {CONTACT_ORDERS}
            </a>
            . Quote and tracking live in the MedStead Transport app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GetStartedCta />
            <QuoteCta variant="ghost-light" />
            <TrackCta variant="ghost-light" />
          </div>
        </div>
      </section>

      <Section className="py-20">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>Direct</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
              {CONTACT_ORDERS}
            </h2>
            <p className="mt-3 text-sm leading-6 text-navy-800/70">
              Use email for shipment questions, clinic interest, and anything the app cannot
              answer yet. There is no phone tree and no public staff directory on this page.
            </p>
            <a
              href={`mailto:${CONTACT_ORDERS}`}
              className="mt-6 inline-flex min-h-tap items-center justify-center rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Email the desk
            </a>
          </article>
          <article className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-tile">
            <Eyebrow>Message</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950">
              Send a short note
            </h2>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">
              Opens your mail app addressed to {CONTACT_ORDERS}. Nothing is stored on this page.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </article>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
