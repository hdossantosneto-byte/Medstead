import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { TrackForm } from "@/components/track-form";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CLINIC_ORDER_LABEL, CLINIC_ROLES, SERVICE_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { money, when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export const metadata = { title: "Orders & Packages" };

export default async function OrdersAndPackagesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const clinicId = session?.user?.clinicId;

  const [shipments, clinicOrders] = await Promise.all([
    userId
      ? prisma.shipment.findMany({
          where: {
            OR: [{ customerId: userId }, { clinicOrder: { userId } }],
          },
          include: { clinicOrder: true, quote: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
    userId && clinicId && role && CLINIC_ROLES.includes(role as (typeof CLINIC_ROLES)[number])
      ? prisma.clinicOrder.findMany({
          where: { clinicId },
          include: { items: true, shipment: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PageHeader
          eyebrow="Your orders"
          title="Orders & Packages"
          lede="Search a package ID, see your shipments, or start a freight order."
        />

        <div className="grid gap-4">
          <Card className="bg-navy-900 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-300">
              Track package
            </p>
            <h2 className="mt-2 font-display text-3xl">Enter a package ID</h2>
            <p className="mt-2 text-sm text-white/70">
              Format MS-YYYYMMDD-ORIGIN-DEST-####. Public clock starts after release.
            </p>
            <div className="mt-5 rounded-2xl bg-white p-4 text-navy-900">
              <TrackForm compact />
              <p className="mt-3 text-xs text-navy-800/50">Demo: MS-20260820-FLL-NAS-0001</p>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
              New freight order
            </p>
            <h2 className="mt-2 font-display text-3xl text-navy-900">Ship now</h2>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">
              Express Air 3–5 days or Standard Sea 5–7 days after release. Paste a US retailer
              link on Shop & Ship — we receive at WareSpace C15 and forward. Clinic supply lives
              in the signed-in shop.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button href="/freight" className="min-h-tap w-full sm:w-auto">
                + New order
              </Button>
              <Button href="/shop-and-ship" variant="secondary" className="min-h-tap w-full sm:w-auto">
                Shop & Ship
              </Button>
              <Button href="/login" variant="ghost" className="min-h-tap w-full sm:w-auto">
                Clinic catalog
              </Button>
            </div>
          </Card>

          {session?.user && clinicOrders.length > 0 && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
                Your clinic orders
              </p>
              <ul className="mt-4 space-y-3">
                {clinicOrders.map((o) => {
                  const total = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
                  return (
                    <li key={o.id}>
                      <div className="rounded-2xl border border-navy-900/10 px-4 py-3">
                        <p className="font-semibold text-navy-900">{o.orderNumber}</p>
                        <p className="text-sm text-navy-800/60">
                          {when(o.createdAt)} · {money(total)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge>{CLINIC_ORDER_LABEL[o.status]}</Badge>
                          {o.shipment && <Badge tone="teal">{SHIPMENT_LABEL[o.shipment.status]}</Badge>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link href={`/app/clinic/orders/${o.id}`} className="text-sm font-semibold text-forest-800">
                            View order
                          </Link>
                          {o.shipment && (
                            <Link
                              href={`/track/${o.shipment.shipmentCode}`}
                              className="text-sm font-semibold text-forest-800"
                            >
                              Track package
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {session?.user && (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
                Your packages
              </p>
              {shipments.length === 0 ? (
                <p className="mt-3 text-sm text-navy-800/60">No packages yet. Start an order.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {shipments.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/track/${s.shipmentCode}`}
                        className="flex min-h-tap flex-col gap-1 rounded-2xl border border-navy-900/10 px-4 py-3 hover:border-forest-400"
                      >
                        <span className="font-semibold text-navy-900">{s.shipmentCode}</span>
                        <span className="text-sm text-navy-800/60">
                          {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]}
                        </span>
                        <Badge tone="teal">{SHIPMENT_LABEL[s.status]}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Button href="/app" variant="ghost" className="mt-4">
                Open workspace
              </Button>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
