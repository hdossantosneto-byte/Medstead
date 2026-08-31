"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSalesAccount } from "@/lib/actions";
import { SALES_KIND_LABEL } from "@/lib/constants";
import { Button, Field, inputClass } from "@/components/ui";

type Kind = "CLINIC" | "DOCTOR" | "WAREHOUSE" | "CHARTER";

export function SalesAccountForm({
  clinics,
  customers,
}: {
  clinics: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("CLINIC");
  const [country, setCountry] = useState("United States");
  const [market, setMarket] = useState("USA");
  const [clinicId, setClinicId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await createSalesAccount({
          name,
          kind,
          country,
          market,
          clinicId: clinicId || undefined,
          customerId: customerId || undefined,
        });
        setBusy(false);
        if (res && "error" in res && res.error) {
          setError(res.error);
          return;
        }
        setName("");
        router.refresh();
      }}
    >
      <Field label="Account name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Kind">
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          {Object.entries(SALES_KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country">
          <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} required />
        </Field>
        <Field label="Market">
          <select className={inputClass} value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="USA">USA</option>
            <option value="INTL">INTL</option>
          </select>
        </Field>
      </div>
      {(kind === "CLINIC" || kind === "DOCTOR") && clinics.length > 0 && (
        <Field label="Link clinic (optional)">
          <select className={inputClass} value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
            <option value="">None yet — admin eligibility is the other desk</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {kind === "WAREHOUSE" && customers.length > 0 && (
        <Field label="Link warehouse customer (optional)">
          <select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">None yet</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Button type="submit" disabled={busy} className="min-h-tap w-full">
        {busy ? "Opening…" : "Open account"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
