"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitExpense } from "@/lib/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";

export function ExpenseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredAt, setIncurredAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await submitExpense({
      title,
      amount: Number(amount),
      incurredAt,
      note,
    });
    setBusy(false);
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    setTitle("");
    setAmount("");
    setIncurredAt("");
    setNote("");
    router.refresh();
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-xl text-navy-900">Submit an expense</h2>
      <p className="mt-1 text-sm text-navy-800/60">Books only. This does not send money or show a bank balance.</p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="What">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Amount (USD)">
          <input
            className={inputClass}
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Date">
          <input
            className={inputClass}
            type="date"
            value={incurredAt}
            onChange={(e) => setIncurredAt(e.target.value)}
            required
          />
        </Field>
        <Field label="Note (optional)">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} className="min-h-tap">
            {busy ? "Saving…" : "Submit"}
          </Button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </Card>
  );
}
