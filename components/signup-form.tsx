"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createFreightAccount } from "@/lib/actions";
import { homePathForRole } from "@/lib/home";
import { Button, Field, inputClass } from "@/components/ui";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const created = await createFreightAccount({ name, email, password });
    if (created && "error" in created && created.error) {
      setBusy(false);
      setError(created.error);
      return;
    }
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Account created. Sign in from the login page.");
      return;
    }
    const session = await getSession();
    router.push(homePathForRole(session?.user?.role));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field label="Password">
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="min-h-tap">
        {busy ? "Creating…" : "Create freight account"}
      </Button>
    </form>
  );
}
