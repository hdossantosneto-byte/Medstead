"use client";

import { useState } from "react";
import { CONTACT_ORDERS } from "@/lib/constants";
import { Button, Field, inputClass } from "@/components/ui";

export function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = packageId.trim().toUpperCase();
    if (code && !code.startsWith("MS-")) {
      setError("Package ID must use the MS- prefix. Never MTG-.");
      return;
    }
    setError("");
    const subject = encodeURIComponent(code ? `Support ${code}` : "MedStead support");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nPackage: ${code || "—"}\n\n${message}`,
    );
    window.location.href = `mailto:${CONTACT_ORDERS}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm leading-6 text-navy-800/70">
        Opens mail to <strong>{CONTACT_ORDERS}</strong>. In-app next actions stay on Do this next —
        do not WhatsApp.
      </p>
    );
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
      <Field label="Phone">
        <input
          className={inputClass}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Including country code"
        />
      </Field>
      <Field label="Package ID (optional)">
        <input
          className={inputClass}
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          placeholder="MS-YYYYMMDD-ORIGIN-DEST-####"
        />
      </Field>
      <Field label="Message">
        <textarea
          className={`${inputClass} min-h-28`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="min-h-tap">
        Email {CONTACT_ORDERS}
      </Button>
    </form>
  );
}
