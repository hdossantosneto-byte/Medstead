"use client";

import { useState } from "react";
import { requestClinicInvite } from "@/lib/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function ClinicInviteForm({
  token,
  presetName,
}: {
  token: string;
  presetName?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clinicName, setClinicName] = useState(presetName ?? "");
  const [country, setCountry] = useState("USA");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await requestClinicInvite({
      token,
      name,
      email,
      clinicName,
      country,
      city,
    });
    setBusy(false);
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm leading-6 text-navy-800/70">
        Seat is inactive until a MedStead admin approves. Demo password if seeded later is demo1234.
        Do not WhatsApp Clint.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Field label="Your name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Work email">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field label="Clinic / pharmacy">
        <input
          className={inputClass}
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          required
        />
      </Field>
      <Field label="Country">
        <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
      </Field>
      <Field label="City">
        <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="min-h-tap">
        {busy ? "Saving…" : "Request access"}
      </Button>
    </form>
  );
}
