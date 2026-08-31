"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { placeClinicOrder } from "@/lib/actions";
import { readCart, writeCart, type StoredCartLine } from "@/lib/clinic-cart";
import { money } from "@/lib/format";
import { Button, Card, Empty } from "@/components/ui";

export function CartClient({ canOrder }: { canOrder: boolean }) {
  const router = useRouter();
  const [lines, setLines] = useState<StoredCartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLines(readCart());
  }, []);

  const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  function remove(id: string) {
    const next = lines.filter((l) => l.productId !== id);
    setLines(next);
    writeCart(next);
  }

  async function submit() {
    if (!lines.length) return;
    if (!canOrder) {
      router.push("/login?email=clinic.admin@medstead.demo");
      return;
    }
    setBusy(true);
    setError("");
    const res = await placeClinicOrder({
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    writeCart([]);
    router.push(`/app/clinic/orders/${res.id}`);
  }

  if (lines.length === 0) {
    return (
      <Empty
        title="Your cart is empty"
        body="Open Shop, add products, then place the order here."
      >
        <Button href="/app/clinic/catalog" className="mt-4 min-h-tap">
          Shop
        </Button>
      </Empty>
    );
  }

  return (
    <Card className="p-5">
      <ul className="space-y-3">
        {lines.map((l) => (
          <li key={l.productId} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy-900">{l.name}</p>
              <p className="text-xs text-navy-800/50">
                {l.sku} · qty {l.qty}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{money(l.unitPrice * l.qty)}</p>
              <button type="button" className="text-xs text-navy-800/50" onClick={() => remove(l.productId)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-display text-2xl text-navy-900">Total {money(total)}</p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="min-h-tap" disabled={busy} onClick={submit}>
          {busy ? "Submitting…" : canOrder ? "Place order" : "Sign in to order"}
        </Button>
        <Button href="/app/clinic/catalog" variant="ghost" className="min-h-tap">
          Continue shopping
        </Button>
      </div>
    </Card>
  );
}
