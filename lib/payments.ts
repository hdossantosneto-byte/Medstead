/**
 * Payment rail for v1: invoice + pay later.
 *
 * A card processor (Stripe, etc.) is intentionally not wired.
 * Do not invent API keys. When a live rail is ready:
 *   1. Add STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY to the host env (never commit them).
 *   2. Implement `createCheckout` below and set paymentProvider to "stripe".
 *   3. Keep invoice_pay_later as the default so ops can still close bookings offline.
 */

export type PaymentProvider = "invoice_pay_later";

export type InvoiceRecord = {
  provider: PaymentProvider;
  status: "issued" | "pay_later" | "paid";
  reference: string;
  amountUsd: number;
  checkoutUrl: null;
  note: string;
};

export function issuePayLaterInvoice(bookingCode: string, amountUsd: number): InvoiceRecord {
  return {
    provider: "invoice_pay_later",
    status: "issued",
    reference: `INV-${bookingCode}`,
    amountUsd,
    checkoutUrl: null,
    note: "Invoice issued. Pay later — no card is charged in this app.",
  };
}

export function markPayLater(invoice: InvoiceRecord): InvoiceRecord {
  return { ...invoice, status: "pay_later" };
}

export function markPaid(invoice: InvoiceRecord): InvoiceRecord {
  return { ...invoice, status: "paid" };
}
