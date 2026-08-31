import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "@/lib/format";
import {
  APP_GET_STARTED,
  APP_QUOTE,
  APP_TRACK,
  CONTACT_ORDERS,
} from "@/lib/constants";

export const MARKETING_NAV = [
  { href: "/freight", label: "Freight" },
  { href: "/clinics", label: "Clinics" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const CAPABILITIES = [
  {
    title: "Express Air",
    meta: "3–5 days",
    body: "Priority air for time-sensitive medicine and supplies. The public clock starts after release — not while cargo is still being sourced.",
    icon: "plane" as const,
  },
  {
    title: "Standard Sea",
    meta: "5–7 days",
    body: "Cost-efficient ocean service for heavier clinic and personal freight when the destination allows a longer window.",
    icon: "ship" as const,
  },
  {
    title: "Hard-to-reach pickup",
    meta: "Remote and island markets",
    body: "We specialize in communities other carriers struggle to finish. Remote and island markets are the work, not a side lane.",
    icon: "pin" as const,
  },
  {
    title: "Customs Support",
    meta: "Documentation help",
    body: "We coordinate medical-cargo paperwork with the people who need it. MedStead is not a licensed customs broker.",
    icon: "shield" as const,
  },
  {
    title: "Live Tracking",
    meta: "Release to delivery",
    body: "Follow the shipment in the MedStead Transport app once it is released. Track a package anytime.",
    icon: "radar" as const,
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Request a quote",
    body: "Tell us origin, destination, and cargo in the MedStead Transport app.",
  },
  {
    step: "02",
    title: "We prepare the shipment",
    body: "Cargo is received, checked, and staged at the Fort Lauderdale operations hub.",
  },
  {
    step: "03",
    title: "We move it",
    body: "Express Air or Standard Sea, matched to the destination and the clock the cargo needs.",
  },
  {
    step: "04",
    title: "You track it",
    body: "Live updates from release through delivery — no phone tree required.",
  },
];

export const TRUST_ITEMS = [
  { label: "Medical cargo", detail: "Medicine and supplies, not general parcel" },
  { label: "Hard-to-reach destinations", detail: "The specialty, not a brochure lane" },
  { label: "Air and sea", detail: "3–5 days air · 5–7 days sea" },
  { label: "Orders desk", detail: CONTACT_ORDERS },
];

export function CtaButton({
  href,
  children,
  variant = "green",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "green" | "blue" | "navy" | "outline" | "ghost-light";
  className?: string;
}) {
  const styles = {
    green: "bg-brand-green text-white hover:bg-forest-700",
    blue: "bg-brand-blue text-white hover:bg-blue-700",
    navy: "bg-navy-950 text-white hover:bg-navy-800",
    outline: "border border-navy-900/15 bg-white text-navy-900 hover:bg-sand",
    "ghost-light": "border border-white/25 bg-transparent text-white hover:bg-white/10",
  }[variant];
  const cls = clsx(
    "inline-flex min-h-tap items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold tracking-tight transition",
    styles,
    className,
  );
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function GetStartedCta({ className }: { className?: string }) {
  return (
    <CtaButton href={APP_GET_STARTED} variant="green" className={className}>
      Get Started
    </CtaButton>
  );
}

export function TrackCta({
  variant = "blue",
  className,
}: {
  variant?: "green" | "blue" | "navy" | "outline" | "ghost-light";
  className?: string;
}) {
  return (
    <CtaButton href={APP_TRACK} variant={variant} className={className}>
      Track a shipment
    </CtaButton>
  );
}

export function QuoteCta({
  variant = "outline",
  className,
}: {
  variant?: "green" | "blue" | "navy" | "outline" | "ghost-light";
  className?: string;
}) {
  return (
    <CtaButton href={APP_QUOTE} variant={variant} className={className}>
      Request a quote
    </CtaButton>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={clsx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={clsx(
        "text-xs font-semibold uppercase tracking-[0.18em]",
        light ? "text-forest-300" : "text-forest-700",
      )}
    >
      {children}
    </p>
  );
}

export function CapabilityIcon({ name }: { name: (typeof CAPABILITIES)[number]["icon"] }) {
  const common = "h-6 w-6 text-forest-600";
  if (name === "plane") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "ship") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 17c1.5 1.4 3.6 2 6 2s4.5-.6 6-2c1.5 1.4 3.6 2 6 2M3 17l2-8h14l2 8M8 9V6h8v3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3 5 6v6c0 5 3.2 8.4 7 9.5 3.8-1.1 7-4.5 7-9.5V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 5v2M12 17v2M5 12H7M17 12h2M7.2 7.2l1.4 1.4M15.4 15.4l1.4 1.4M7.2 16.8l1.4-1.4M15.4 8.6l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CapabilityGrid({ className }: { className?: string }) {
  return (
    <div className={clsx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {CAPABILITIES.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-tile"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50">
            <CapabilityIcon name={item.icon} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
            {item.meta}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-navy-950">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-navy-800/70">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function HowItWorks({ className }: { className?: string }) {
  return (
    <ol className={clsx("grid gap-4 md:grid-cols-4", className)}>
      {HOW_IT_WORKS.map((item) => (
        <li key={item.step} className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-tile">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-700">
            {item.step}
          </p>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-navy-950">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-navy-800/70">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function TrustRow({ light = false }: { light?: boolean }) {
  return (
    <div
      className={clsx(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
        light ? "text-white" : "text-navy-900",
      )}
    >
      {TRUST_ITEMS.map((item) => (
        <div key={item.label}>
          <p className="text-sm font-semibold tracking-tight">{item.label}</p>
          <p className={clsx("mt-1 text-sm leading-6", light ? "text-white/65" : "text-navy-800/65")}>
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export function MarketingCtaBand() {
  return (
    <div className="rounded-3xl bg-navy-950 px-6 py-10 text-white sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-300">
        Ready when you are
      </p>
      <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
        Quote, ship, and track in the MedStead Transport app.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
        Freight is live. Clinics and telehealth are coming soon. This site stays here — the app
        opens in a new flow, not as a redirect of medsteadgroup.com.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <GetStartedCta />
        <TrackCta variant="ghost-light" />
        <QuoteCta variant="ghost-light" />
      </div>
    </div>
  );
}
