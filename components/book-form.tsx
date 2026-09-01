"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CARGO_REJECT_MESSAGE,
  DESTINATIONS,
  ONLINE_PAY_DISCOUNT,
  PICKUP_LABEL,
  PICKUP_POINTS,
  SERVICE_WINDOW,
  WAREHOUSE,
} from "@/lib/constants";
import { addFreightCartLine } from "@/lib/freight-cart";
import { quoteFreight } from "@/lib/pricing";
import { money } from "@/lib/format";
import { forbiddenCargoMatch } from "@/lib/cargo";
import { Button, Card, Field, inputClass, Notice } from "@/components/ui";

const today = new Date().toISOString().slice(0, 10);

type BookState = {
  origin: string;
  destination: string;
  service: "EXPRESS_AIR" | "STANDARD_SEA";
  originMode: "WAREHOUSE" | "OTHER";
  pickupPoint: string;
  destAddress: string;
  description: string;
  weightLb: number;
  pieces: number;
  readyDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export function BookForm({
  defaults,
}: {
  defaults?: { name?: string; email?: string; phone?: string | null };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cartNote, setCartNote] = useState("");
  const [form, setForm] = useState<BookState>({
    origin: "FLL",
    destination: "NAS",
    service: "EXPRESS_AIR",
    originMode: "WAREHOUSE",
    pickupPoint: "NASSAU",
    destAddress: "",
    description: "",
    weightLb: 20,
    pieces: 1,
    readyDate: today,
    contactName: defaults?.name ?? "",
    contactEmail: defaults?.email ?? "",
    contactPhone: defaults?.phone ?? "",
  });

  const live = useMemo(
    () => quoteFreight({ service: form.service, weightLb: form.weightLb, pieces: form.pieces, destination: form.destination }),
    [form.service, form.weightLb, form.pieces, form.destination],
  );

  function set<K extends keyof BookState>(key: K, value: BookState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep() {
    if (step === 1) return true;
    if (step === 2) {
      if (form.description.trim().length < 4) {
        setError("Describe the cargo in a few words. No patient data.");
        return false;
      }
      if (forbiddenCargoMatch(form.description)) {
        setError(CARGO_REJECT_MESSAGE);
        return false;
      }
      if (form.pickupPoint === "ADDRESS" && !form.destAddress.trim()) {
        setError("Add a delivery address, or choose a pickup point.");
        return false;
      }
      return true;
    }
    if (form.contactName.trim().length < 2 || !form.contactEmail.includes("@") || form.contactPhone.trim().length < 7) {
      setError("Name, email, and phone are required so ops can invoice you later.");
      return false;
    }
    return true;
  }

  async function book() {
    if (!validateStep()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: form.origin,
        destination: form.destination,
        service: form.service,
        weightLb: form.weightLb,
        pieces: form.pieces,
        description: form.description,
        createShipment: true,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        pickupPoint: form.pickupPoint,
        destAddress: form.destAddress,
        readyDate: form.readyDate,
        originMode: form.originMode,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok || data.error) {
      setError(data.error || "Could not book this shipment");
      return;
    }
    if (data.shipmentCode) {
      router.push(`/freight/confirm/${data.shipmentCode}`);
      return;
    }
    setError("Booked, but no tracking ID was issued. Contact Orders@medsteadgroup.com.");
  }

  function addToCart() {
    if (!validateStep()) return;
    addFreightCartLine({
      origin: form.origin,
      destination: form.destination,
      service: form.service,
      weightLb: form.weightLb,
      pieces: form.pieces,
      description: form.description,
    });
    setCartNote("Added to cart. Book from Cart when you are ready — no card is charged.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-5 sm:p-6 lg:col-span-3">
        <ol className="mb-5 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em]">
          {["Route", "Cargo", "Contact"].map((label, i) => (
            <li
              key={label}
              className={i + 1 <= step ? "rounded-full bg-navy-900 py-2 text-white" : "rounded-full bg-navy-900/8 py-2 text-navy-800/50"}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              if (validateStep()) {
                setError("");
                setStep(step + 1);
              }
              return;
            }
            void book();
          }}
          className="grid gap-4"
        >
          {step === 1 && (
            <>
              <Field label="Origin">
                <select className={inputClass} value={form.origin} onChange={(e) => set("origin", e.target.value)}>
                  <option value="FLL">Fort Lauderdale warehouse (FLL)</option>
                  <option value="MIA">Miami (MIA)</option>
                </select>
              </Field>
              <Field label="Ship from">
                <select
                  className={inputClass}
                  value={form.originMode}
                  onChange={(e) => set("originMode", e.target.value as BookState["originMode"])}
                >
                  <option value="WAREHOUSE">Use WareSpace C15 as origin</option>
                  <option value="OTHER">Other US origin — we receive at C15</option>
                </select>
              </Field>
              <Field label="Destination">
                <select className={inputClass} value={form.destination} onChange={(e) => set("destination", e.target.value)}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pickup / delivery">
                <select className={inputClass} value={form.pickupPoint} onChange={(e) => set("pickupPoint", e.target.value)}>
                  {PICKUP_POINTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              {form.pickupPoint === "ADDRESS" && (
                <Field label="Delivery address">
                  <input
                    className={inputClass}
                    value={form.destAddress}
                    onChange={(e) => set("destAddress", e.target.value)}
                    placeholder="Street, city, island"
                  />
                </Field>
              )}
              <Field label="Service">
                <select
                  className={inputClass}
                  value={form.service}
                  onChange={(e) => set("service", e.target.value as BookState["service"])}
                >
                  <option value="EXPRESS_AIR">Express Air — {SERVICE_WINDOW.EXPRESS_AIR}</option>
                  <option value="STANDARD_SEA">Standard Sea — {SERVICE_WINDOW.STANDARD_SEA}</option>
                </select>
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Cargo (no patient data, no clinic-shop SKUs)">
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Household goods, clinic supplies, documents…"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Weight (lb)">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    step={0.1}
                    value={form.weightLb}
                    onChange={(e) => set("weightLb", Number(e.target.value))}
                  />
                </Field>
                <Field label="Pieces">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={form.pieces}
                    onChange={(e) => set("pieces", Number(e.target.value))}
                  />
                </Field>
              </div>
              <Field label="Ready date">
                <input
                  className={inputClass}
                  type="date"
                  value={form.readyDate}
                  onChange={(e) => set("readyDate", e.target.value)}
                />
              </Field>
            </>
          )}
          {step === 3 && (
            <>
              <Field label="Your name">
                <input className={inputClass} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </Field>
            </>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {step > 1 && (
              <Button type="button" variant="ghost" className="min-h-tap w-full sm:w-auto" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button type="submit" disabled={busy} className="min-h-tap w-full sm:w-auto">
              {busy ? "Booking…" : step < 3 ? "Continue" : "Book shipment"}
            </Button>
            {step === 3 && (
              <Button type="button" variant="secondary" className="min-h-tap w-full sm:w-auto" onClick={addToCart}>
                Add to cart
              </Button>
            )}
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {cartNote && <p className="mt-3 text-sm text-forest-800">{cartNote}</p>}
      </Card>
      <Card className="p-5 sm:p-6 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Estimate</p>
        <p className="mt-2 font-display text-3xl text-navy-900">{money(live.listAmount)}</p>
        <p className="mt-1 text-sm text-navy-800/60">
          Pay later is first-class. Online later: {money(live.onlineAmount)} ({Math.round(ONLINE_PAY_DISCOUNT * 100)}% off)
        </p>
        <p className="mt-3 text-sm text-navy-800/70">
          {form.origin} → {form.destination} · {PICKUP_LABEL[form.pickupPoint] ?? form.pickupPoint}
        </p>
        <p className="mt-1 text-xs leading-5 text-navy-800/50">
          Window is {SERVICE_WINDOW[form.service]}. Public clock starts only after release. No card is charged on book.
        </p>
        {form.originMode === "WAREHOUSE" && (
          <p className="mt-3 text-xs leading-5 text-navy-800/60">Ship inbound to {WAREHOUSE.line}.</p>
        )}
        <Notice>
          MedStead is not a licensed customs broker. Duties, permits, and formal entry remain with the importer of
          record. Peptide / GLP-1 / TRT cargo is rejected.
        </Notice>
      </Card>
    </div>
  );
}
