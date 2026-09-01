import { FORBIDDEN_CARGO_TERMS, FORBIDDEN_SKU_TERMS } from "./constants";

export function forbiddenCargoMatch(text: string) {
  const hay = text.toLowerCase();
  return FORBIDDEN_CARGO_TERMS.find((term) => hay.includes(term)) ?? null;
}

export function forbiddenSkuMatch(text: string) {
  const hay = text.toLowerCase();
  return FORBIDDEN_SKU_TERMS.find((term) => hay.includes(term)) ?? null;
}

export function cargoFieldsHit(...fields: Array<string | undefined | null>) {
  return forbiddenCargoMatch(fields.filter(Boolean).join(" "));
}
