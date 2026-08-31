"use client";

import { useState } from "react";
import { CONTACT_ORDERS } from "@/lib/constants";
import { Field, inputClass } from "@/components/ui";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Freight");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`MedStead — ${topic}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`);
    window.location.href = `mailto:${CONTACT_ORDERS}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm leading-6 text-navy-800/70">
        Your mail app should open to <strong>{CONTACT_ORDERS}</strong>. If it does not, email that
        address directly.
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
      <Field label="Topic">
        <select className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option>Freight</option>
          <option>Clinics</option>
          <option>Tracking</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="Message">
        <textarea
          className={`${inputClass} min-h-28`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </Field>
      <button
        type="submit"
        className="inline-flex min-h-tap items-center justify-center rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-700"
      >
        Email {CONTACT_ORDERS}
      </button>
    </form>
  );
}
