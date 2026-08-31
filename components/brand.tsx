import Link from "next/link";
import { clsx } from "@/lib/format";

/**
 * Official MedStead Transport lockup (Hairson). Pixel crops only — no redrawn globe.
 * Compact = illustration + MEDSTEAD wordmark. Lockup = full vertical mark.
 */
export function Wordmark({
  href = "/",
  light = false,
  compact = false,
  size,
}: {
  href?: string;
  light?: boolean;
  compact?: boolean;
  size?: "compact" | "footer" | "lockup";
}) {
  const kind = size ?? (compact ? "compact" : "lockup");
  const src = kind === "compact" ? "/medstead-compact.png" : "/medstead-logo.png";
  const height =
    kind === "compact"
      ? "h-10 w-auto max-w-[220px] sm:h-11 sm:max-w-[260px]"
      : kind === "footer"
        ? "h-24 w-auto sm:h-28"
        : "h-40 w-auto sm:h-48 md:h-56";

  return (
    <Link
      href={href}
      className={clsx("inline-flex items-center", light && "rounded-lg bg-white px-1.5 py-1")}
    >
      {/* Official lockup PNG — not the old SVG globe crop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="MedStead Transport" className={height} />
      <span className="sr-only">MedStead Transport — Faster access. Better care.</span>
    </Link>
  );
}
