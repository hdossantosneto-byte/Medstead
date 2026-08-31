"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAircraft, assignAircraft } from "@/lib/actions";
import { AIRCRAFT_STATUS_LABEL, corridorLine, fleetLine } from "@/lib/fleet";
import { Button, Field, inputClass } from "@/components/ui";

export type FleetOption = {
  id: string;
  name: string;
  type: string | null;
  tailNumber: string | null;
  homeBase: string;
  status: string;
  corridors: string;
};

export function AddAircraftForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [tailNumber, setTailNumber] = useState("");

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await addAircraft({ name, type, tailNumber });
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        setName("");
        setType("");
        setTailNumber("");
        router.refresh();
      }}
    >
      <Field label="Callsign / name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Operating name"
        />
      </Field>
      <Field label="Type (optional)">
        <input
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type only if Hairson names it"
        />
      </Field>
      <Field label="Tail (optional)">
        <input
          className={inputClass}
          value={tailNumber}
          onChange={(e) => setTailNumber(e.target.value)}
          placeholder="Leave blank until a real tail is on file"
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={busy} className="min-h-tap w-full sm:w-auto">
          {busy ? "Adding…" : "Add to current fleet"}
        </Button>
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function AssignAircraftForm({
  flightId,
  aircraft,
  currentId,
}: {
  flightId: string;
  aircraft: FleetOption[];
  currentId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = aircraft.filter((a) => a.status === "CURRENT");
  const [picked, setPicked] = useState(currentId ?? current[0]?.id ?? "");

  if (current.length === 0) {
    return (
      <p className="text-sm text-navy-800/60">
        Current fleet has no named tails. Dispatch still flies — Del assigns when a tail is on file.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!picked) return;
        setBusy(true);
        setError("");
        const res = await assignAircraft(flightId, picked);
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
      }}
    >
      <label className="block flex-1 text-sm">
        <span className="mb-1.5 block font-medium text-navy-800">Assign current-fleet aircraft</span>
        <select className={inputClass} value={picked} onChange={(e) => setPicked(e.target.value)}>
          {current.map((a) => (
            <option key={a.id} value={a.id}>
              {fleetLine(a)} · {corridorLine(a.corridors)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={busy || !picked} className="min-h-tap">
        {busy ? "Saving…" : "Assign aircraft"}
      </Button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function FleetList({ aircraft }: { aircraft: FleetOption[] }) {
  if (aircraft.length === 0) {
    return (
      <p className="mt-3 text-sm text-navy-800/70">
        No named tails on file. The operating fleet is current. Empty is honest — do not invent an
        N-number.
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-2 text-sm text-navy-800">
      {aircraft.map((a) => (
        <li key={a.id} className="flex flex-wrap justify-between gap-2">
          <span>
            {fleetLine(a)} · {a.homeBase}
          </span>
          <span className="text-navy-800/60">
            {AIRCRAFT_STATUS_LABEL[a.status] ?? a.status} · {corridorLine(a.corridors)}
          </span>
        </li>
      ))}
    </ul>
  );
}
