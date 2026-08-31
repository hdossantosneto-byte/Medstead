"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/brand";
import { Badge, Card } from "@/components/ui";

const ACCOUNTS = [
  {
    email: "public@medstead.demo",
    role: "Public",
    note: "Freight portal visitor",
  },
  {
    email: "customer@medstead.demo",
    role: "Customer",
    note: "Warehouse suite + rewards points",
  },
  {
    email: "clinic.admin@medstead.demo",
    role: "Clinic admin",
    note: "Approved USA clinic — Harbor Wellness",
  },
  {
    email: "doctor@medstead.demo",
    role: "Doctor",
    note: "Approved international clinic — Bethel Medical",
  },
  {
    email: "pharmacy@medstead.demo",
    role: "Pharmacy",
    note: "Inactive until admin approves 360 Wellness",
  },
  {
    email: "admin@medstead.demo",
    role: "MedStead admin",
    note: "CRM, approvals, invoices, status override",
  },
  {
    email: "ops@medstead.demo",
    role: "Ops",
    note: "Six-gate release. No finance totals.",
  },
  {
    email: "finance@medstead.demo",
    role: "Finance",
    note: "Invoices and payments. Cannot ship.",
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function enter(email: string) {
    setBusy(email);
    setError("");
    const res = await signIn("credentials", {
      email,
      password: "demo1234",
      redirect: false,
    });
    setBusy(null);
    if (res?.error) {
      setError("Demo login failed. Run npm run db:setup first.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Wordmark />
      <h1 className="mt-8 font-display text-3xl text-navy-900">Demo workspace</h1>
      <p className="mt-2 text-sm leading-6 text-navy-800/70">
        One-click login as each MedStead role. Password for every account is{" "}
        <strong>demo1234</strong>. Brand is MedStead only.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-3">
        {ACCOUNTS.map((a) => (
          <Card key={a.email} className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-navy-900">{a.role}</p>
                <Badge tone="teal">{a.email}</Badge>
              </div>
              <p className="mt-1 text-sm text-navy-800/60">{a.note}</p>
            </div>
            <button
              type="button"
              disabled={busy === a.email}
              onClick={() => enter(a.email)}
              className="shrink-0 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === a.email ? "Entering…" : "Enter"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
