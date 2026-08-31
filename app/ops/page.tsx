import { OpsBookingCard, OpsLogin, OpsLogout } from "@/components/ops-desk";
import { isOps } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ops desk" };

export default async function OpsPage() {
  if (!isOps()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Internal</p>
        <h1 className="mt-3 text-3xl font-semibold text-navy-950">Ops desk</h1>
        <p className="mt-3 text-sm text-navy-800/70">
          Update tracking and issue invoice / pay-later. This is not a customer page.
        </p>
        <div className="mt-6">
          <OpsLogin />
        </div>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Internal</p>
          <h1 className="mt-3 text-3xl font-semibold text-navy-950">Ops desk</h1>
          <p className="mt-2 text-sm text-navy-800/70">
            Simulated tracking is OK in v1. Invoice / pay later — no card rail is live.
          </p>
        </div>
        <OpsLogout />
      </div>
      <div className="mt-8 grid gap-4">
        {bookings.map((b) => (
          <OpsBookingCard
            key={b.id}
            booking={{
              bookingCode: b.bookingCode,
              contactName: b.contactName,
              contactEmail: b.contactEmail,
              destLabel: b.destLabel,
              service: b.service,
              status: b.status,
              estimateUsd: b.estimateUsd,
              invoiceUsd: b.invoiceUsd,
              invoiceStatus: b.invoiceStatus,
              invoiceRef: b.invoiceRef,
            }}
          />
        ))}
      </div>
    </div>
  );
}
