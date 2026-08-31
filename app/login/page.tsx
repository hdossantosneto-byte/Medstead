"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Wordmark } from "@/components/brand";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { homePathForRole } from "@/lib/home";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Sign in failed. Check email and password.");
      return;
    }
    const session = await getSession();
    router.push(homePathForRole(session?.user?.role));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          required
        />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Wordmark />
      <Card className="mt-8 w-full max-w-md p-8">
        <h1 className="font-display text-2xl text-navy-900">Sign in</h1>
        <p className="mt-2 text-sm text-navy-800/60">
          Demo password for every seeded account is <strong>demo1234</strong>.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm">
          <a href="/signup" className="font-semibold text-forest-700 hover:underline">
            Sign up
          </a>
          <span className="mx-2 text-navy-800/40">·</span>
          <a href="/demo" className="font-semibold text-forest-700 hover:underline">
            One-click demo roles
          </a>
        </p>
      </Card>
    </div>
  );
}
