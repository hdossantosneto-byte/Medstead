"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Empty, inputClass } from "@/components/ui";
import { CATEGORY_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { placeClinicOrder } from "@/lib/actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  strength: string | null;
  form: string | null;
  category: "RX" | "NON_RX" | "IV" | "SUPPLIES";
  description: string | null;
  prices: Array<{ minQty: number; maxQty: number; unitPrice: number; label: "SOURCED" | "DEMO" }>;
};

const TABS = [
  { id: "RX", label: "RX" },
  { id: "NON_RX", label: "Non-RX" },
  { id: "IV", label: "IV" },
] as const;

function matchesTab(category: Product["category"], tab: string) {
  if (tab === "IV") return category === "IV";
  if (tab === "NON_RX") return category === "NON_RX";
  return category === "IV" || category === "SUPPLIES";
}

function tierFor(p: Product, qty: number) {
  return (
    p.prices.find((t) => qty >= t.minQty && qty <= t.maxQty) ??
    p.prices[0] ??
    null
  );
}

export function CatalogClient({
  products,
  market,
  tab,
}: {
  products: Product[];
  market: "USA" | "INTL";
  tab: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(tab);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => products.filter((p) => matchesTab(p.category, active)),
    [products, active],
  );

  function add(p: Product) {
    const q = qty[p.id] || (p.category === "NON_RX" ? (market === "INTL" ? 20 : 100) : 1);
    setCart((c) => {
      const existing = c.find((x) => x.product.id === p.id);
      if (existing) return c.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + q } : x));
      return [...c, { product: p, qty: q }];
    });
  }

  async function submit() {
    setBusy(true);
    setError("");
    const res = await placeClinicOrder({
      items: cart.map((c) => ({ productId: c.product.id, qty: c.qty })),
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/app/clinic/orders/${res.id}`);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                active === t.id ? "bg-navy-900 text-white" : "bg-white text-navy-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <Empty title="No SKUs in this tab" />
        ) : (
          <div className="space-y-3">
            {rows.map((p) => {
              const q = qty[p.id] || (p.category === "NON_RX" ? (market === "INTL" ? 20 : 100) : 1);
              const tier = tierFor(p, q);
              return (
                <Card key={p.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-navy-900">{p.name}</p>
                        {tier?.label === "DEMO" ? <Badge tone="demo">DEMO price</Badge> : <Badge tone="green">Sourced intl</Badge>}
                        <Badge>{CATEGORY_LABEL[p.category]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-navy-800/50">{p.sku}</p>
                      <p className="mt-1 text-sm text-navy-800/70">
                        {[p.strength, p.form].filter(Boolean).join(" · ")}
                      </p>
                      {p.prices.length > 1 && (
                        <p className="mt-2 text-xs text-navy-800/50">
                          Breaks:{" "}
                          {p.prices
                            .map((t) => `${t.minQty}${t.maxQty < 999999 ? `–${t.maxQty}` : "+"} ${money(t.unitPrice)}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div>
                        <p className="text-xs text-navy-800/50">Qty</p>
                        <input
                          className={`${inputClass} w-24`}
                          type="number"
                          min={1}
                          value={q}
                          onChange={(e) => setQty((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="min-w-[90px] text-right">
                        <p className="text-xs text-navy-800/50">Unit</p>
                        <p className="font-semibold">{tier ? money(tier.unitPrice) : "—"}</p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => add(p)}>
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Card className="h-fit p-5">
        <h2 className="font-display text-xl text-navy-900">Order</h2>
        {cart.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/50">Add SKUs from the {market} book.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map((c) => {
              const tier = tierFor(c.product, c.qty);
              return (
                <li key={c.product.id} className="flex justify-between gap-2">
                  <span>
                    {c.product.name} × {c.qty}
                    {tier?.label === "DEMO" ? " · DEMO" : ""}
                  </span>
                  <span>{tier ? money(tier.unitPrice * c.qty) : ""}</span>
                </li>
              );
            })}
          </ul>
        )}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <Button className="mt-4 w-full" disabled={!cart.length || busy} onClick={submit}>
          {busy ? "Submitting…" : "Place order"}
        </Button>
      </Card>
    </div>
  );
}
