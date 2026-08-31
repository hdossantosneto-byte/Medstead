import Link from "next/link";
import { clsx } from "@/lib/format";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={clsx("h-8 w-8", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#0B2545" />
      <path
        d="M8 18.5V13.2c0-1.2.9-2.2 2.1-2.2h2.4L16 8l3.5 3h2.4c1.2 0 2.1 1 2.1 2.2v5.3c0 3.3-2.6 5.5-8 5.5s-8-2.2-8-5.5z"
        fill="#14B8A6"
      />
      <path d="M14.2 14.2h3.6v1.6h-3.6z" fill="#0B2545" />
      <path d="M15.2 13.2h1.6v3.6h-1.6z" fill="#0B2545" />
    </svg>
  );
}

export function Wordmark({
  href = "/",
  light = false,
  compact = false,
}: {
  href?: string;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Mark />
      <span
        className={clsx(
          "wordmark font-display text-xl font-semibold tracking-tight",
          light ? "text-white" : "text-navy-900",
        )}
      >
        MedStead
        {!compact && (
          <span
            className={clsx(
              "ml-2 hidden text-[10px] font-sans font-semibold uppercase tracking-[0.18em] sm:inline",
              light ? "text-teal-300" : "text-teal-700",
            )}
          >
            Faster access. Better care.
          </span>
        )}
      </span>
    </Link>
  );
}
