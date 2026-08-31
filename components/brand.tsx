import Link from "next/link";
import { clsx } from "@/lib/format";

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
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center",
        light && "rounded-lg bg-white px-1.5 py-1",
      )}
    >
      <img
        src="/medstead-logo.svg"
        alt="MedStead"
        className={compact ? "h-11 w-auto sm:h-12" : "h-16 w-auto sm:h-[4.5rem]"}
      />
      <span className="sr-only">MedStead — Faster access. Better care.</span>
    </Link>
  );
}
