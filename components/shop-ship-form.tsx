"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARGO_REJECT_MESSAGE, DESTINATIONS, SERVICE_WINDOW, WAREHOUSE } from "@/lib/constants";
import { forbiddenCargoMatch } from "@/lib/cargo";
import { createFreightQuote } from "@/lib/actions";
import { money } from "@/lib/format";
import { Button, Card, Field, inputClass, Notice } from "@/components/ui";

export function ShopShipForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [retailerUrl, setRetailerUrl] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("NAS");
  const [service, setService] = useState<"EXPRESS_AIR" | "STANDARD_SEA">("EXPRESS_AIR");
  const [weightLb, setWeightLb] = useState(10);
  const [pieces, setPieces] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | {
    quoteNumber?: string;
    shipmentCode?: string;
    listAmount: number;
    onlineAmount: number;
    status?: string;
  }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) {
      setError("Sign in to send this to WareSpace C15.");
      return;
    }
    if (!description.trim() && !retailerUrl.trim()) {
      setError("Paste a US retailer link or describe the package.");
      return;
    }
    if (forbiddenCargoMatch(`${description} ${retailerUrl}`)) {
      setError(CARGO_REJECT_MESSAGE);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await createFreightQuote({
        origin: "FLL",
        destination,
        service,
        weightLb,
        pieces,
        description: description.trim() || "Shop & Ship inbound",
        retailerUrl: retailerUrl.trim() || undefined,
        createShipment: true,
      });
      if ("error" in res && res.error) {
        setError(String(res.error));
        setBusy(false);
        return;
      }
      setResult(res);
      if (res.shipmentCode) {
        router.push(`/freight/confirm/${res.shipmentCode}`);
        return;
      }
    } catch {
      setError("Could not start Shop & Ship. Sign in and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-6 lg:col-span-3">
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="US retailer link">
            <input
              className={inputClass}
              type="url"
              value={retailerUrl}
              onChange={(e) => setRetailerUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Or describe the package">
            <textarea
              className={`${inputClass} min-h-24`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Household goods, clinic supplies… no patient data, no illegal pharmacy links."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Forward to">
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
          </div>
          <Button type="submit" disabled={busy} className="min-h-tap">
            {busy ? "Sending…" : signedIn ? "Send to C15" : "Sign in to ship"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </Card>
      <Card className="p-6 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Receive at</p>
        <p className="mt-2 font-display text-2xl text-navy-900">WareSpace C15</p>
        <p className="mt-2 text-sm leading-6 text-navy-800/70">{WAREHOUSE.line}</p>
        <p className="mt-4 text-sm leading-6 text-navy-800/70">
          We receive the inbound parcel, then forward Express Air or Standard Sea. Quote stays
          under review until finance or admin approves.
        </p>
        {result && (
          <div className="mt-4 rounded-xl bg-teal-50 p-3 text-sm">
            <p className="font-semibold">Quote under review{result.quoteNumber ? ` · ${result.quoteNumber}` : ""}</p>
            {result.shipmentCode && (
              <p>
                Package{" "}
                <a className="font-semibold text-teal-800 underline" href={`/track/${result.shipmentCode}`}>
                  {result.shipmentCode}
                </a>
              </p>
            )}
            <p>
              List {money(result.listAmount)} · Online {money(result.onlineAmount)}
            </p>
          </div>
        )}
        <Notice>
          Do not paste illegal pharmacy links. Peptide and GLP-1 SKUs are not accepted. MedStead
          is not a licensed customs broker.
        </Notice>
      </Card>
    </div>
  );
}
