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
  { id: "ALL", label: "All" },
  { id: "IV", label: "IV" },
  { id: "SUPPLIES", label: "Supplies" },
  { id: "NON_RX", label: "Non-RX DEMO" },
] as const;

const TILE: Record<Product["category"], string> = {
  IV: "from-forest-600 to-forest-800",
  SUPPLIES: "from-navy-800 to-navy-950",
  NON_RX: "from-teal-500 to-teal-700",
  RX: "from-navy-700 to-navy-900",
};

function matchesTab(category: Product["category"], tab: string) {
  if (tab === "ALL") return true;
  if (tab === "IV") return category === "IV";
  if (tab === "SUPPLIES") return category === "SUPPLIES";
  if (tab === "NON_RX") return category === "NON_RX";
  return true;
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
  const [active, setActive] = useState(tab === "RX" ? "IV" : tab);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openCart, setOpenCart] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!matchesTab(p.category, active)) return false;
      if (!q) return true;
      return `${p.name} ${p.sku} ${p.strength ?? ""} ${p.form ?? ""}`.toLowerCase().includes(q);
    });
  }, [products, active, query]);

  const items = cart ?? [];
  const cartTotal = items.reduce((s, c) => {
    const t = tierFor(c.product, c.qty);
    return s + (t ? t.unitPrice * c.qty : 0);
  }, 0);

  function add(p: Product) {
    const q = qty[p.id] || (p.category === "NON_RX" ? (market === "INTL" ? 20 : 100) : 1);
    setCart((c) => {
      const cur = c ?? [];
      const existing = cur.find((x) => x.product.id === p.id);
      if (existing) return cur.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + q } : x));
      return [...cur, { product: p, qty: q }];
    });
    setOpenCart(true);
  }

  function remove(id: string) {
    setCart((cur) => (cur ?? []).filter((x) => x.product.id !== id));
  }

  async function submit() {
    if (!items.length) return;
    setBusy(true);
    setError("");
    const res = await placeClinicOrder({
      items: items.map((c) => ({ productId: c.product.id, qty: c.qty })),
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/app/clinic/orders/${res.id}`);
  }

  const cartLines = (
    <>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-navy-800/50">Add products from the {market} book.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((c) => (
            <li key={c.product.id} className="flex justify-between gap-2">
              <span>
                {c.product.name} × {c.qty}
              </span>
              <span className="flex items-center gap-2">
                {money((tierFor(c.product, c.qty)?.unitPrice ?? 0) * c.qty)}
                <button
                  type="button"
                  className="text-xs text-navy-800/50 hover:text-red-700"
                  onClick={() => remove(c.product.id)}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && <p className="mt-3 font-semibold">Total {money(cartTotal)}</p>}
    </>
  );

  return (
    <div className="mt-6 pb-32 lg:pb-0">
      <input
        className={`${inputClass} min-h-14 text-lg`}
        placeholder="Search the clinic book…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`min-h-tap shrink-0 rounded-full px-4 text-sm font-semibold ${
              active === t.id ? "bg-navy-900 text-white" : "bg-white text-navy-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <Empty title="No products match" body="Try another category or search." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((p) => {
                const q = qty[p.id] || (p.category === "NON_RX" ? (market === "INTL" ? 20 : 100) : 1);
                const tier = tierFor(p, q);
                return (
                  <Card key={p.id} className="flex min-h-[280px] flex-col overflow-hidden p-0">
                    <div className={`h-16 bg-gradient-to-br ${TILE[p.category]}`} />
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {tier?.label === "DEMO" ? (
                          <Badge tone="demo">DEMO</Badge>
                        ) : (
                          <Badge tone="green">Sourced</Badge>
                        )}
                        <Badge>{CATEGORY_LABEL[p.category]}</Badge>
                      </div>
                      <p className="mt-2 text-lg font-semibold leading-snug text-navy-900">{p.name}</p>
                      <p className="text-xs text-navy-800/50">{p.sku}</p>
                      <p className="mt-1 text-sm text-navy-800/70">
                        {[p.strength, p.form].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-3 font-display text-3xl text-navy-900">
                        {tier ? money(tier.unitPrice) : "—"}
                      </p>
                      <div className="mt-auto flex items-end gap-2 pt-3">
                        <input
                          className={`${inputClass} min-h-tap w-24`}
                          type="number"
                          min={1}
                          value={q}
                          onChange={(e) => setQty((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                        />
                        <Button type="button" variant="secondary" className="min-h-tap flex-1" onClick={() => add(p)}>
                          Add to cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="hidden h-fit p-5 lg:block">
          <h2 className="font-display text-xl text-navy-900">Cart</h2>
          {cartLines}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-4 w-full min-h-12" disabled={!items.length || busy} onClick={submit}>
            {busy ? "Submitting…" : "Place order"}
          </Button>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-900/10 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
        {openCart && items.length > 0 && <div className="mb-3 max-h-40 overflow-y-auto">{cartLines}</div>}
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button type="button" className="flex-1 text-left" onClick={() => setOpenCart((v) => !v)}>
            <p className="text-xs text-navy-800/50">{items.length} in cart</p>
            <p className="font-semibold text-navy-900">{money(cartTotal)}</p>
          </button>
          <Button className="min-h-12 flex-1" disabled={!items.length || busy} onClick={submit}>
            {busy ? "Submitting…" : "Place order"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
