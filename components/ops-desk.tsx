"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INVOICE_STATUS_LABEL,
  PUBLIC_TRACK_LABEL,
  PUBLIC_TRACK_STEPS,
} from "@/lib/constants";
import { money } from "@/lib/format";
import { Button, Field, inputClass } from "@/components/ui";

type DeskRow = {
  shipmentCode: string;
  consignee: string;
  contactEmail: string | null;
  destination: string;
  service: string;
  publicStep: string;
  listAmount: number | null;
  invoiceUsd: number | null;
  invoiceStatus: string;
};

export function OpsDeskLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="grid max-w-sm gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/ops/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        if (!res.ok) {
          setError("PIN not accepted");
          return;
        }
        router.refresh();
      }}
    >
      <Field label="Ops PIN">
        <input className={inputClass} type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="min-h-tap">
        Open freight desk
      </Button>
    </form>
  );
}

export function OpsDeskLogout() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-tap"
      onClick={async () => {
        await fetch("/api/ops/logout", { method: "POST" });
        router.refresh();
      }}
    >
      Close desk
    </Button>
  );
}

export function OpsDeskCard({ row }: { row: DeskRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(row.publicStep);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(String(row.invoiceUsd ?? row.listAmount ?? ""));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/ops/shipments/${encodeURIComponent(row.shipmentCode)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Update failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <article className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-950">{row.shipmentCode}</p>
          <p className="text-sm text-navy-800/60">
            {row.consignee}
            {row.contactEmail ? ` · ${row.contactEmail}` : ""} · {row.destination}
          </p>
        </div>
        <p className="text-sm text-navy-800/70">
          {row.listAmount != null ? `Est. ${money(row.listAmount)}` : "No estimate"} ·{" "}
          {INVOICE_STATUS_LABEL[row.invoiceStatus] ?? row.invoiceStatus}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Public status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {PUBLIC_TRACK_STEPS.map((s) => (
              <option key={s} value={s}>
                {PUBLIC_TRACK_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tracking note">
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional public note"
          />
        </Field>
        <Field label="Invoice amount">
          <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="min-h-tap w-full"
          disabled={busy}
          onClick={() => void patch({ action: "set_status", status, note })}
        >
          Update track
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-tap w-full"
          disabled={busy}
          onClick={() => void patch({ action: "issue_invoice", amountUsd: Number(amount) || undefined, note })}
        >
          Issue invoice
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-tap w-full"
          disabled={busy}
          onClick={() => void patch({ action: "pay_later", amountUsd: Number(amount) || undefined })}
        >
          Pay later
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-tap w-full"
          disabled={busy}
          onClick={() => void patch({ action: "mark_paid", amountUsd: Number(amount) || undefined })}
        >
          Mark paid
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-forest-800">{message}</p>}
    </article>
  );
}
