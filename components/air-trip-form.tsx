"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestAirTrip } from "@/lib/actions";
import { TRIP_TYPE_LABEL } from "@/lib/constants";
import { Button, Field, inputClass } from "@/components/ui";

type AirTripKind = "COMPANY_TRAVEL" | "PERSONAL_GOODS" | "DOCTOR_CHARTER" | "RESCUE_ORGAN";

const DEST = [
  { code: "NAS", name: "Nassau — live" },
  { code: "FPO", name: "Freeport — live" },
  { code: "MSY", name: "New Orleans — not live" },
];

export function AirTripForm({
  tripTypes,
  title,
  lede,
  rescueFields,
}: {
  tripTypes: AirTripKind[];
  title: string;
  lede?: string;
  rescueFields?: boolean;
}) {
  const router = useRouter();
  const [tripType, setTripType] = useState<AirTripKind>(tripTypes[0]);
  const [origin, setOrigin] = useState("FLL");
  const [destination, setDestination] = useState("NAS");
  const [purpose, setPurpose] = useState("");
  const [passengerNote, setPassengerNote] = useState("");
  const [custodyNote, setCustodyNote] = useState("");
  const [temperatureNote, setTemperatureNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const rescue = tripType === "RESCUE_ORGAN";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk(false);
    const res = await requestAirTrip({
      tripType,
      origin,
      destination,
      purpose,
      passengerNote,
      custodyNote: rescue ? custodyNote : undefined,
      temperatureNote: rescue ? temperatureNote : undefined,
    });
    setBusy(false);
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    setPurpose("");
    setPassengerNote("");
    setCustodyNote("");
    setTemperatureNote("");
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div>
        <p className="font-display text-2xl text-navy-900">{title}</p>
        {lede && <p className="mt-1 text-sm text-navy-800/60">{lede}</p>}
      </div>
      {tripTypes.length > 1 && (
        <Field label="Trip type">
          <select
            className={inputClass}
            value={tripType}
            onChange={(e) => setTripType(e.target.value as AirTripKind)}
          >
            {tripTypes.map((t) => (
              <option key={t} value={t}>
                {TRIP_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Origin">
          <select className={inputClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="FLL">Fort Lauderdale (FLL)</option>
            <option value="NAS">Nassau (NAS)</option>
            <option value="FPO">Freeport (FPO)</option>
          </select>
        </Field>
        <Field label="Destination">
          <select
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {DEST.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Purpose">
        <input
          className={inputClass}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
          placeholder={rescue ? "Dispatch of a rescue organ trip" : "Why this trip"}
        />
      </Field>
      <Field label={rescue ? "Who is on the trip (no patient name)" : "Who / what is on the trip"}>
        <input
          className={inputClass}
          value={passengerNote}
          onChange={(e) => setPassengerNote(e.target.value)}
          required
        />
      </Field>
      {(rescueFields || rescue) && (
        <>
          <Field label="Chain of custody">
            <textarea
              className={inputClass}
              rows={2}
              value={custodyNote}
              onChange={(e) => setCustodyNote(e.target.value)}
              placeholder="Origin → destination. In-app only."
            />
          </Field>
          <Field label="Temperature note">
            <input
              className={inputClass}
              value={temperatureNote}
              onChange={(e) => setTemperatureNote(e.target.value)}
              placeholder="Cold-chain note. In-app only."
            />
          </Field>
        </>
      )}
      <Button type="submit" disabled={busy} className="min-h-tap w-full sm:w-auto">
        {busy ? "Sending…" : rescue ? "Open TIME-CRITICAL trip" : "Request trip"}
      </Button>
      {ok && (
        <p className="text-sm text-forest-800">
          In the queue. Del owns the next step. No WhatsApp.
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
