"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  bookSalesEvent,
  convertSalesToOrder,
  logSalesFollowUp,
  salesRequestCharter,
} from "@/lib/actions";
import { SALES_EVENT_LABEL } from "@/lib/constants";
import { Button, Field, inputClass } from "@/components/ui";

export function LogFollowUpForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await logSalesFollowUp(accountId, note);
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        setNote("");
        router.refresh();
      }}
    >
      <Field label="What did you hear">
        <textarea
          className={inputClass}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="No patient names. Next conversation only."
        />
      </Field>
      <Button type="submit" disabled={busy} className="min-h-tap w-full">
        {busy ? "Saving…" : "Log follow-up"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function BookEventForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  type EventKind = "DINNER" | "SITE_VISIT" | "WAREHOUSE_TOUR" | "CONFERENCE" | "DOCTOR_CHARTER_DAY";
  const [kind, setKind] = useState<EventKind>("DINNER");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await bookSalesEvent({ accountId, kind, date });
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
      }}
    >
      <Field label="Event">
        <select
          className={inputClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as EventKind)}
        >
          {Object.entries(SALES_EVENT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Button type="submit" disabled={busy} className="min-h-tap w-full">
        {busy ? "Booking…" : "Book event"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function SalesAccountActions({
  accountId,
  kind,
}: {
  accountId: string;
  kind: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(which: "order" | "charter") {
    setBusy(which);
    setError("");
    const res = which === "order" ? await convertSalesToOrder(accountId) : await salesRequestCharter(accountId);
    setBusy("");
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      {(kind === "CLINIC" || kind === "DOCTOR") && (
        <Button disabled={busy !== ""} className="min-h-tap w-full" onClick={() => run("order")}>
          {busy === "order" ? "Working…" : "Convert to clinic order"}
        </Button>
      )}
      {(kind === "CHARTER" || kind === "DOCTOR") && (
        <Button
          variant="secondary"
          disabled={busy !== ""}
          className="min-h-tap w-full"
          onClick={() => run("charter")}
        >
          {busy === "charter" ? "Working…" : "Request charter"}
        </Button>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
