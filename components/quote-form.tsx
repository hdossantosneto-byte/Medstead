"use client";

import { useState } from "react";
import { DESTINATIONS, ONLINE_PAY_DISCOUNT, SERVICE_WINDOW } from "@/lib/constants";
import { quoteFreight } from "@/lib/pricing";
import { money } from "@/lib/format";
import { Button, Card, Field, inputClass, Notice } from "@/components/ui";

export function QuoteForm({
  persist = false,
}: {
  persist?: boolean;
}) {
  const [origin, setOrigin] = useState("FLL");
  const [destination, setDestination] = useState("NAS");
  const [service, setService] = useState<"EXPRESS_AIR" | "STANDARD_SEA">("EXPRESS_AIR");
  const [weightLb, setWeightLb] = useState(20);
  const [pieces, setPieces] = useState(1);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<null | {
    listAmount: number;
    onlineAmount: number;
    quoteNumber?: string;
    shipmentCode?: string;
  }>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const live = quoteFreight({ service, weightLb, pieces, destination });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        destination,
        service,
        weightLb,
        pieces,
        description,
        createShipment: persist,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save quote");
      setResult(live);
      return;
    }
    setResult(data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-6 lg:col-span-3">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Origin">
            <select className={inputClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option value="FLL">Fort Lauderdale (FLL)</option>
              <option value="MIA">Miami (MIA)</option>
            </select>
          </Field>
          <Field label="Destination">
            <select
              className={inputClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {DESTINATIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service">
            <select
              className={inputClass}
              value={service}
              onChange={(e) => setService(e.target.value as "EXPRESS_AIR" | "STANDARD_SEA")}
            >
              <option value="EXPRESS_AIR">Express Air — {SERVICE_WINDOW.EXPRESS_AIR}</option>
              <option value="STANDARD_SEA">Standard Sea — {SERVICE_WINDOW.STANDARD_SEA}</option>
            </select>
          </Field>
          <Field label="Weight (lb)">
            <input
              className={inputClass}
              type="number"
              min={1}
              step={0.1}
              value={weightLb}
              onChange={(e) => setWeightLb(Number(e.target.value))}
            />
          </Field>
          <Field label="Pieces">
            <input
              className={inputClass}
              type="number"
              min={1}
              value={pieces}
              onChange={(e) => setPieces(Number(e.target.value))}
            />
          </Field>
          <Field label="Contents (no patient data)">
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clinic supplies, household goods…"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : persist ? "Save quote & open shipment" : "Get quote"}
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </Card>
      <Card className="p-6 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Estimate</p>
        <p className="mt-2 font-display text-3xl text-navy-900">{money(live.listAmount)}</p>
        <p className="mt-1 text-sm text-navy-800/60">
          Pay online: {money(live.onlineAmount)} ({Math.round(ONLINE_PAY_DISCOUNT * 100)}% off)
        </p>
        <p className="mt-4 text-xs leading-5 text-navy-800/50">
          Window is {SERVICE_WINDOW[service]}. Public clock starts only after release. Sales
          representatives cannot promise delivery dates — Del owns date commitments.
        </p>
        {result && (
          <div className="mt-4 rounded-xl bg-teal-50 p-3 text-sm">
            <p className="font-semibold">Quote under review</p>
            {result.quoteNumber && <p>Quote {result.quoteNumber}</p>}
            {result.shipmentCode && (
              <p>
                Shipment{" "}
                <a className="font-semibold text-teal-800 underline" href={`/track/${result.shipmentCode}`}>
                  {result.shipmentCode}
                </a>
              </p>
            )}
            <p>List {money(result.listAmount)} · Online {money(result.onlineAmount)}</p>
          </div>
        )}
        <Notice>
          MedStead is not a licensed customs broker. Duties, permits, and formal entry remain with
          the importer of record.
        </Notice>
      </Card>
    </div>
  );
}
