import type { FreightService, PriceMarket, PriceTier } from "@prisma/client";
import { ONLINE_PAY_DISCOUNT } from "./constants";

export function unitPriceForQty(tiers: PriceTier[], market: PriceMarket, qty: number) {
  const match = tiers
    .filter((t) => t.market === market && qty >= t.minQty && qty <= t.maxQty)
    .sort((a, b) => b.minQty - a.minQty)[0];
  return match ?? null;
}

export function quoteFreight(input: {
  service: FreightService;
  weightLb: number;
  pieces?: number;
  destination: string;
}) {
  const weight = Math.max(input.weightLb, 1);
  const pieces = Math.max(input.pieces ?? 1, 1);
  const destFactor = ["NAS", "FPO", "BGI", "KIN", "GRU"].includes(input.destination)
    ? 1.15
    : 1;

  const list =
    input.service === "EXPRESS_AIR"
      ? (95 + weight * 4.75 + pieces * 12) * destFactor
      : (48 + weight * 1.85 + pieces * 8) * destFactor;

  const rounded = Math.round(list * 100) / 100;
  const online = Math.round(rounded * (1 - ONLINE_PAY_DISCOUNT) * 100) / 100;
  return { listAmount: rounded, onlineAmount: online };
}
