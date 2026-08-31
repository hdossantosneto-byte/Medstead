import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "@/lib/format";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-navy-900/8 bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  type,
  className,
  disabled,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-800",
    secondary: "bg-teal-600 text-white hover:bg-teal-700",
    ghost: "bg-white text-navy-900 border border-navy-900/15 hover:bg-sand",
    danger: "bg-red-700 text-white hover:bg-red-800",
  }[variant];
  const cls = clsx(
    "inline-flex min-h-tap items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50",
    styles,
    className,
  );
  if (href && !disabled) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type ?? "button"} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "navy",
}: {
  children: ReactNode;
  tone?: "navy" | "teal" | "amber" | "red" | "green" | "demo";
}) {
  const map = {
    navy: "bg-navy-900/8 text-navy-800",
    teal: "bg-teal-100 text-teal-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    green: "bg-emerald-100 text-emerald-800",
    demo: "bg-amber-50 text-amber-900 border border-amber-200",
  };
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", map[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl text-navy-900">{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-800/70">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-navy-800">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2";

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-900/15 bg-white/60 px-6 py-12 text-center">
      <p className="font-medium text-navy-900">{title}</p>
      {body && <p className="mt-1 text-sm text-navy-800/60">{body}</p>}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-navy-800">
      {children}
    </div>
  );
}
