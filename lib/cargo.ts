import { FORBIDDEN_CARGO_TERMS } from "./constants";

export function forbiddenCargoMatch(text: string) {
  const hay = text.toLowerCase();
  return FORBIDDEN_CARGO_TERMS.find((term) => hay.includes(term)) ?? null;
}
