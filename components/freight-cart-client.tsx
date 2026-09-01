"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CARGO_REJECT_MESSAGE } from "@/lib/constants";
import { forbiddenCargoMatch } from "@/lib/cargo";
import {
  FREIGHT_CART_EVENT,
  readFreightCart,
  writeFreightCart,
  type FreightCartLine,
} from "@/lib/freight-cart";
import { quoteFreight } from "@/lib/pricing";
import { money } from "@/lib/format";
import { Button, Card, Empty, Field, inputClass } from "@/components/ui";

export function FreightCartClient({
  contact,
}: {
  contact?: { name?: string; email?: string };
}) {
  const router = useRouter();
  const [lines, setLines] = useState<FreightCartLine[]>([]);
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function sync() {
      setLines(readFreightCart());
    }
    sync();
    window.addEventListener(FREIGHT_CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FREIGHT_CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function remove(id: string) {
    const next = lines.filter((l) => l.id !== id);
    setLines(next);
    writeFreightCart(next);
  }

  async function checkout() {
    if (!lines.length) return;
    if (name.trim().length < 2 || !email.includes("@") || phone.trim().length < 7) {
      setError("Name, email, and phone are required. No card is charged.");
      return;
    }
    const blocked = lines.find((l) => forbiddenCargoMatch(l.description));
    if (blocked) {
      setError(CARGO_REJECT_MESSAGE);
      return;
    }
    setBusy(true);
    setError("");
    let lastCode = "";
    for (const line of lines) {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: line.origin,
          destination: line.destination,
          service: line.service,
          weightLb: line.weightLb,
          pieces: line.pieces,
          description: line.description,
          createShipment: true,
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
          pickupPoint: line.destination === "FPO" ? "FREEPORT" : "NASSAU",
          originMode: "WAREHOUSE",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setBusy(false);
        setError(data.error || "Could not book a cart line");
        return;
      }
      if (data.shipmentCode) lastCode = data.shipmentCode;
    }
    writeFreightCart([]);
    setBusy(false);
    router.push(lastCode ? `/freight/confirm/${lastCode}` : "/orders");
  }

  if (lines.length === 0) {
    return (
      <Empty
        title="Freight cart is empty"
        body="Book Express Air or Standard Sea. This cart is logistics only — not a clinic shop."
      >
        <Button href="/freight" className="mt-4 min-h-tap">
          Book a shipment
        </Button>
      </Empty>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Freight cart</p>
      <ul className="mt-4 space-y-3">
        {lines.map((l) => {
          const est = quoteFreight(l);
          return (
            <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl border border-navy-900/10 px-3 py-3">
              <div>
                <p className="font-semibold text-navy-900">
                  {l.origin} → {l.destination}
                </p>
                <p className="text-xs text-navy-800/50">
                  {l.service === "EXPRESS_AIR" ? "Express Air" : "Standard Sea"} · {l.weightLb} lb · {l.pieces} pcs
                </p>
                <p className="mt-1 text-sm text-navy-800/70">{l.description}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(est.listAmount)}</p>
                <button type="button" className="text-xs text-navy-800/50" onClick={() => remove(l.id)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 grid gap-3">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <Button type="button" className="mt-4 min-h-tap w-full" disabled={busy} onClick={() => void checkout()}>
        {busy ? "Booking…" : "Book cart — no card charged"}
      </Button>
    </Card>
  );
}
