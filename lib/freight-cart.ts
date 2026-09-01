export type FreightCartLine = {
  id: string;
  origin: string;
  destination: string;
  service: "EXPRESS_AIR" | "STANDARD_SEA";
  weightLb: number;
  pieces: number;
  description: string;
};

export const FREIGHT_CART_KEY = "medstead-freight-cart";
export const FREIGHT_CART_EVENT = "medstead-freight-cart";

export function readFreightCart(): FreightCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FREIGHT_CART_KEY);
    return raw ? (JSON.parse(raw) as FreightCartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeFreightCart(lines: FreightCartLine[]) {
  localStorage.setItem(FREIGHT_CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(FREIGHT_CART_EVENT));
}

export function freightCartCount(lines: FreightCartLine[]) {
  return lines.reduce((s, l) => s + l.pieces, 0);
}

export function addFreightCartLine(line: Omit<FreightCartLine, "id">) {
  const next = [...readFreightCart(), { ...line, id: crypto.randomUUID() }];
  writeFreightCart(next);
  return next;
}
