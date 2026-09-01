/**
 * Freight payment rail: invoice + pay later.
 * No card processor is wired. Do not invent Stripe keys.
 */

export type FreightInvoiceStatus = "none" | "issued" | "pay_later" | "paid";

export function issuePayLaterInvoice(shipmentCode: string, amountUsd: number) {
  return {
    invoiceStatus: "issued" as const,
    invoiceRef: `INV-${shipmentCode}`,
    invoiceUsd: amountUsd,
    note: "Invoice issued. Pay later — no card is charged in this app.",
  };
}
