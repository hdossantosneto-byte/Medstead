export type StoredCartLine = {
  productId: string;
  qty: number;
  name: string;
  sku: string;
  unitPrice: number;
};

export const CART_KEY = "medstead-clinic-cart";
export const CART_EVENT = "medstead-cart";

export function readCart(): StoredCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as StoredCartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: StoredCartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function cartCount(lines: StoredCartLine[]) {
  return lines.reduce((s, l) => s + l.qty, 0);
}
