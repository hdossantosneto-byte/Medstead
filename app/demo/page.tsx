"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/brand";
import { Badge, Card } from "@/components/ui";
import { homePathForRole } from "@/lib/home";

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
    role: "Ops (Chris)",
    note: "Warehouse pick / pack. Not flight dispatch.",
  },
  {
    email: "del@medstead.demo",
    role: "Del · MTG Airlines",
    note: "Dispatch airline. Cargo, travel, charter, rescue. Doctors do not block cargo.",
  },
  {
    email: "pilot@medstead.demo",
    role: "Pilot",
    note: "In-app trip brief. Acknowledge — no WhatsApp.",
  },
  {
    email: "finance@medstead.demo",
    role: "Finance",
    note: "Accounting. Invoices and Zelle payees. Cannot fly.",
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
    const session = await getSession();
    router.push(homePathForRole(session?.user?.role));
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
      <Card className="mt-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
          Prove Del dispatch
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-navy-800/80">
          <li>Enter as doctor — Shop the book or open Your orders. CO-1008 (Bethel) has Track package.</li>
          <li>Enter as finance — mark paid only if an invoice is waiting.</li>
          <li>Enter as Del — tap <strong>Dispatch flight</strong> on the FLL–NAS package, or Notify pilots on the rescue trip. The doctor does not block cargo.</li>
          <li>Enter as pilot — acknowledge the in-app brief. No WhatsApp.</li>
          <li>Enter as doctor again — CO-1008 is In Transit. No call to Del.</li>
        </ol>
      </Card>
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
              className="min-h-tap shrink-0 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === a.email ? "Entering…" : "Enter"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
