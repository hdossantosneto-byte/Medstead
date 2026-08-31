"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runNextAction } from "@/lib/actions";
import type { QueueItem, QueueKind } from "@/lib/queue";
import { Button, Card, inputClass } from "@/components/ui";

export function NextQueue({ items, hero }: { items: QueueItem[]; hero?: boolean }) {
  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="font-display text-2xl text-navy-900">You&apos;re clear. Nothing is waiting on you.</p>
        <p className="mt-2 text-sm text-navy-800/60">
          When someone else finishes their step, the next item will land here. No WhatsApp. No guessing.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <QueueCard key={item.id} item={item} hero={hero && i === 0} />
      ))}
    </div>
  );
}

function QueueCard({ item, hero }: { item: QueueItem; hero?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");

  async function go() {
    if (item.kind === "open") {
      router.push(item.href);
      return;
    }
    setBusy(true);
    setError("");
    const res = await runNextAction({
      kind: item.kind,
      clinicId: item.clinicId,
      orderId: item.orderId,
      invoiceId: item.invoiceId,
      shipmentId: item.shipmentId,
      crmId: item.crmId,
      gate: item.gate,
      date: item.needsDate ? date : undefined,
      flightId: item.flightId,
      quoteId: item.quoteId,
    });
    setBusy(false);
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.push(item.href.startsWith("/app/ops") || item.href.startsWith("/app/flights") ? item.href : "/app");
    router.refresh();
  }

  return (
    <Card className={hero ? "border-2 border-navy-900 p-7" : "p-6"}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{item.who}</p>
      <h2 className={`mt-2 font-display text-navy-900 ${hero ? "text-3xl" : "text-2xl"}`}>{item.what}</h2>
      <p className="mt-2 text-sm leading-6 text-navy-800/70">{item.why}</p>
      {item.needsDate && (
        <input
          className={`${inputClass} mt-4 max-w-xs`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          onClick={go}
          disabled={busy || (item.needsDate && !date)}
          className={`min-h-tap w-full sm:w-auto ${hero ? "min-h-14 text-base" : ""}`}
        >
          {busy ? "Working…" : item.actionLabel}
        </Button>
        <a href={item.href} className="text-sm font-semibold text-teal-800 hover:underline">
          Open record
        </a>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </Card>
  );
}

export function DedicatedNextButton({
  kind,
  label,
  orderId,
  invoiceId,
  shipmentId,
  clinicId,
  crmId,
  flightId,
  quoteId,
  gate,
}: {
  kind: QueueKind;
  label: string;
  orderId?: string;
  invoiceId?: string;
  shipmentId?: string;
  clinicId?: string;
  crmId?: string;
  flightId?: string;
  quoteId?: string;
  gate?: import("@prisma/client").GateName;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <Button
        disabled={busy}
        className="min-h-tap w-full sm:w-auto"
        onClick={async () => {
          setBusy(true);
          setError("");
          const res = await runNextAction({
            kind,
            orderId,
            invoiceId,
            shipmentId,
            clinicId,
            crmId,
            flightId,
            quoteId,
            gate,
          });
          setBusy(false);
          if (res && "error" in res && res.error) {
            setError(res.error);
            return;
          }
          router.push("/app");
          router.refresh();
        }}
      >
        {busy ? "Working…" : label}
      </Button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function ActivityLine({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-navy-800">
      {text}
    </div>
  );
}
