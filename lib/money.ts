export function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function estimateFreight(input: {
  service: string;
  weightLb: number;
  pieces: number;
  destCode: string;
}) {
  const weight = Math.max(input.weightLb || 1, 1);
  const pieces = Math.max(input.pieces || 1, 1);
  const remote = ["NAS", "FPO", "BGI", "KIN", "GRU", "OTH"].includes(input.destCode);
  const destFactor = remote ? 1.15 : 1;

  let list: number;
  if (input.service === "EXPRESS_AIR") {
    list = (95 + weight * 4.75 + pieces * 12) * destFactor;
  } else if (input.service === "MEDICAL_REMOTE") {
    list = (140 + weight * 5.25 + pieces * 16) * destFactor;
  } else {
    list = (48 + weight * 1.85 + pieces * 8) * destFactor;
  }

  return Math.round(list * 100) / 100;
}
