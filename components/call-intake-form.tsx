"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ingestCall } from "@/lib/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function CallIntakeForm() {
  const router = useRouter();
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [callerOrg, setCallerOrg] = useState("");
  const [callType, setCallType] = useState("medical_cargo");
  const [destination, setDestination] = useState("NAS");
  const [urgency, setUrgency] = useState("urgent");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setOk("");
        const res = await ingestCall({
          callerName,
          callerPhone,
          callerOrg,
          callType,
          destination,
          notes,
          urgency,
          source: "phone",
        });
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        setCallerName("");
        setCallerPhone("");
        setCallerOrg("");
        setNotes("");
        setOk(res && "flightCode" in res && res.flightCode ? `On Del’s board · ${res.flightCode}` : "On Del’s board.");
        router.refresh();
      }}
    >
      <Field label="Caller (facility — not a patient)">
        <input className={inputClass} value={callerName} onChange={(e) => setCallerName(e.target.value)} required />
      </Field>
      <Field label="Callback phone">
        <input className={inputClass} value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} required />
      </Field>
      <Field label="Organization">
        <input className={inputClass} value={callerOrg} onChange={(e) => setCallerOrg(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Call type">
          <select className={inputClass} value={callType} onChange={(e) => setCallType(e.target.value)}>
            <option value="organ_rescue">Rescue / organ</option>
            <option value="medical_cargo">Medical cargo</option>
            <option value="doctor_charter">Doctor charter</option>
            <option value="other_urgent_medical">Other urgent medical</option>
          </select>
        </Field>
        <Field label="Urgency">
          <select className={inputClass} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="organ_clock">Organ clock</option>
          </select>
        </Field>
      </div>
      <Field label="Destination">
        <select className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)}>
          <option value="NAS">Nassau — live</option>
          <option value="FPO">Freeport — live</option>
          <option value="MSY">New Orleans — not live</option>
        </select>
      </Field>
      <Field label="Notes (no patient name, DOB, or MRN)">
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" disabled={busy} className="min-h-tap w-full">
        {busy ? "Routing…" : "Route to Del"}
      </Button>
      {ok && <p className="text-sm text-forest-800">{ok}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
