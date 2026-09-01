import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { OpsDeskCard, OpsDeskLogin, OpsDeskLogout } from "@/components/ops-desk";
import { Card, PageHeader } from "@/components/ui";
import { isOpsDesk } from "@/lib/ops-desk";
import { publicStepForShipment } from "@/lib/public-track";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Freight ops desk" };

export default async function FreightOpsDeskPage() {
  const open = isOpsDesk();
  const shipments = open
    ? await prisma.shipment.findMany({
        where: { clinicOrderId: null },
        include: { quote: true },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
    : [];

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
        <PageHeader
          eyebrow="Phone ops"
          title="Freight desk"
          lede="PIN desk for public freight bookings — issue invoice, pay later, move the track page. Airline dispatch stays on the signed-in board."
        />
        {!open ? (
          <Card className="p-6">
            <p className="mb-4 text-sm text-navy-800/70">
              Local PIN is <code className="rounded bg-sand px-1">local-ops</code> unless OPS_PIN is set.
              This is not the warehouse / airline workspace.
            </p>
            <OpsDeskLogin />
            <p className="mt-6 text-sm text-navy-800/60">
              Del and Chris use{" "}
              <Link href="/login" className="font-semibold text-forest-800">
                staff login
              </Link>{" "}
              for{" "}
              <Link href="/app/flights" className="font-semibold text-forest-800">
                dispatch
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-navy-800/60">{shipments.length} freight bookings</p>
              <OpsDeskLogout />
            </div>
            {shipments.map((s) => (
              <OpsDeskCard
                key={s.id}
                row={{
                  shipmentCode: s.shipmentCode,
                  consignee: s.consignee,
                  contactEmail: s.contactEmail,
                  destination: s.destination,
                  service: s.service,
                  publicStep: publicStepForShipment(s.status, s.invoiceStatus),
                  listAmount: s.quote?.listAmount ?? null,
                  invoiceUsd: s.invoiceUsd,
                  invoiceStatus: s.invoiceStatus,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
