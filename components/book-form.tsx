"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOOKABLE_SERVICES,
  DESTINATIONS,
  ORIGINS,
  PICKUP_POINTS,
  WAREHOUSE,
} from "@/lib/constants";
import { estimateFreight, money } from "@/lib/money";
import { Button, Field, Input, Select, Textarea } from "./ui";

type FormState = {
  service: string;
  originMode: "WAREHOUSE" | "OTHER";
  originCode: string;
  originCity: string;
  originRegion: string;
  originCountry: string;
  originAddress: string;
  destCode: string;
  destCity: string;
  destRegion: string;
  destCountry: string;
  destAddress: string;
  pickupPoint: string;
  cargoDescription: string;
  weightLb: number;
  pieces: number;
  lengthIn: string;
  widthIn: string;
  heightIn: string;
  readyDate: string;
  timingNote: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);

export function BookForm({
  defaults,
}: {
  defaults?: { name?: string; email?: string; phone?: string | null };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    service: "EXPRESS_AIR",
    originMode: "WAREHOUSE",
    originCode: "FLL",
    originCity: "Fort Lauderdale",
    originRegion: "FL",
    originCountry: "United States",
    originAddress: WAREHOUSE.street,
    destCode: "NAS",
    destCity: "Nassau",
    destRegion: "",
    destCountry: "Bahamas",
    destAddress: "",
    pickupPoint: "NASSAU",
    cargoDescription: "",
    weightLb: 20,
    pieces: 1,
    lengthIn: "",
    widthIn: "",
    heightIn: "",
    readyDate: today,
    timingNote: "",
    contactName: defaults?.name ?? "",
    contactEmail: defaults?.email ?? "",
    contactPhone: defaults?.phone ?? "",
    notes: "",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const estimate = useMemo(
    () =>
      estimateFreight({
        service: form.service,
        weightLb: Number(form.weightLb) || 1,
        pieces: Number(form.pieces) || 1,
        destCode: form.destCode,
      }),
    [form.service, form.weightLb, form.pieces, form.destCode],
  );

  function applyOrigin(code: string) {
    const hit = ORIGINS.find((o) => o.code === code);
    setForm((f) => ({
      ...f,
      originCode: code,
      originCity: hit?.city || f.originCity,
      originRegion: hit?.region || "",
      originCountry: hit?.country || f.originCountry,
    }));
  }

  function applyDest(code: string) {
    const hit = DESTINATIONS.find((d) => d.code === code);
    setForm((f) => ({
      ...f,
      destCode: code,
      destCity: hit?.city || f.destCity,
      destRegion: hit?.region || "",
      destCountry: hit?.country || f.destCountry,
      pickupPoint: code === "NAS" ? "NASSAU" : code === "FPO" ? "FREEPORT" : f.pickupPoint,
    }));
  }

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        weightLb: Number(form.weightLb),
        pieces: Number(form.pieces),
        lengthIn: form.lengthIn ? Number(form.lengthIn) : undefined,
        widthIn: form.widthIn ? Number(form.widthIn) : undefined,
        heightIn: form.heightIn ? Number(form.heightIn) : undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create booking");
      return;
    }
    router.push(`/book/confirm/${encodeURIComponent(data.bookingCode)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <ol className="mb-6 flex gap-2 text-xs font-semibold uppercase tracking-wide">
          {["Route & service", "Cargo & timing", "Contact"].map((label, i) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 ${
                step === i + 1 ? "bg-navy-950 text-white" : "bg-slate-100 text-navy-800/60"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 1 && (
          <div className="grid gap-4">
            <Field label="Service">
              <div className="grid gap-2">
                {BOOKABLE_SERVICES.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                      form.service === s.id ? "border-brand-green bg-forest-50" : "border-navy-900/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={form.service === s.id}
                      onChange={() => set("service", s.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-navy-950">{s.title}</span>
                      <span className="block text-sm text-navy-800/65">
                        {s.window} — {s.detail}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="How will cargo reach us?">
              <Select
                value={form.originMode}
                onChange={(e) => set("originMode", e.target.value as "WAREHOUSE" | "OTHER")}
              >
                <option value="WAREHOUSE">I will ship to the Fort Lauderdale warehouse</option>
                <option value="OTHER">Other origin / pickup from my address</option>
              </Select>
            </Field>

            {form.originMode === "OTHER" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Origin">
                  <Select value={form.originCode} onChange={(e) => applyOrigin(e.target.value)}>
                    {ORIGINS.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Origin city">
                  <Input value={form.originCity} onChange={(e) => set("originCity", e.target.value)} />
                </Field>
                <Field label="Origin region / state">
                  <Input value={form.originRegion} onChange={(e) => set("originRegion", e.target.value)} />
                </Field>
                <Field label="Origin country">
                  <Input value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Origin address">
                    <Input
                      value={form.originAddress}
                      onChange={(e) => set("originAddress", e.target.value)}
                      placeholder="Street address"
                    />
                  </Field>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Destination">
                <Select value={form.destCode} onChange={(e) => applyDest(e.target.value)}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Pickup or delivery">
                <Select value={form.pickupPoint} onChange={(e) => set("pickupPoint", e.target.value)}>
                  {PICKUP_POINTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Destination city">
                <Input value={form.destCity} onChange={(e) => set("destCity", e.target.value)} />
              </Field>
              <Field label="Destination country">
                <Input value={form.destCountry} onChange={(e) => set("destCountry", e.target.value)} />
              </Field>
              {form.pickupPoint === "ADDRESS" && (
                <div className="sm:col-span-2">
                  <Field label="Delivery address">
                    <Input
                      value={form.destAddress}
                      onChange={(e) => set("destAddress", e.target.value)}
                      placeholder="Street address at destination"
                    />
                  </Field>
                </div>
              )}
            </div>

            <Button type="button" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <Field
              label="Cargo description"
              hint="No patient data. This storefront does not accept GLP-1, peptides, or a drug catalog."
            >
              <Textarea
                value={form.cargoDescription}
                onChange={(e) => set("cargoDescription", e.target.value)}
                placeholder="Clinic supplies, household goods, medical devices…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Weight (lb)">
                <Input
                  type="number"
                  min={1}
                  step={0.1}
                  value={form.weightLb}
                  onChange={(e) => set("weightLb", Number(e.target.value))}
                />
              </Field>
              <Field label="Pieces">
                <Input
                  type="number"
                  min={1}
                  value={form.pieces}
                  onChange={(e) => set("pieces", Number(e.target.value))}
                />
              </Field>
              <Field label="Length (in, optional)">
                <Input value={form.lengthIn} onChange={(e) => set("lengthIn", e.target.value)} />
              </Field>
              <Field label="Width (in, optional)">
                <Input value={form.widthIn} onChange={(e) => set("widthIn", e.target.value)} />
              </Field>
              <Field label="Height (in, optional)">
                <Input value={form.heightIn} onChange={(e) => set("heightIn", e.target.value)} />
              </Field>
              <Field label="Cargo ready date">
                <Input type="date" value={form.readyDate} onChange={(e) => set("readyDate", e.target.value)} />
              </Field>
            </div>
            <Field label="Timing notes (optional)">
              <Input
                value={form.timingNote}
                onChange={(e) => set("timingNote", e.target.value)}
                placeholder="Need it before a clinic date? Tell ops — dates are not promised until confirmed."
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4">
            <Field label="Your name">
              <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </Field>
            </div>
            <Field label="Notes for ops (optional)">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" onClick={submit} disabled={busy}>
                {busy ? "Submitting…" : "Request booking"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-2xl border border-navy-900/8 bg-slate-50 p-6 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Estimate</p>
        <p className="mt-2 text-3xl font-semibold text-navy-950">{money(estimate)}</p>
        <p className="mt-2 text-sm leading-6 text-navy-800/65">
          This is an estimate for planning, not a charge. V1 is request + confirmation + invoice /
          pay later. No card is collected here.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-navy-800/70">
          <li>
            {form.originMode === "WAREHOUSE" ? "FLL warehouse" : form.originCity} → {form.destCity}
          </li>
          <li>
            {BOOKABLE_SERVICES.find((s) => s.id === form.service)?.title} · {form.weightLb} lb ·{" "}
            {form.pieces} pcs
          </li>
          <li>Ready {form.readyDate}</li>
        </ul>
      </aside>
    </div>
  );
}
