import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CopyAddress } from "@/components/copy-address";
import { INVOICE_STATUS_LABEL, SERVICE_LABEL, WAREHOUSE } from "@/lib/constants";
import { publicStepForShipment } from "@/lib/public-track";
import { PUBLIC_TRACK_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: {
          shipments: { include: { quote: true }, orderBy: { createdAt: "desc" }, take: 12 },
        },
      })
    : null;

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
        <PageHeader
          eyebrow="Account"
          title={user ? `Hello, ${user.name.split(" ")[0]}` : "Your MedStead account"}
          lede="Bookings, warehouse address, and tracking. Clinic shop stays behind a licensed login."
        />

        {!user ? (
          <Card className="p-6">
            <p className="text-sm leading-6 text-navy-800/70">
              Sign in to see packages and your personal WareSpace C15 address. Guests can still book
              and track with an MS- ID.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button href="/login" className="min-h-tap w-full sm:w-auto">
                Sign in
              </Button>
              <Button href="/signup" variant="ghost" className="min-h-tap w-full sm:w-auto">
                Sign up free
              </Button>
              <Button href="/freight" variant="secondary" className="min-h-tap w-full sm:w-auto">
                Book without account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                Your US warehouse
              </p>
              <p className="mt-2 font-display text-2xl text-navy-900">
                {user.name} c/o {WAREHOUSE.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-navy-800/70">
                {WAREHOUSE.street}
                <br />
                {WAREHOUSE.city}, {WAREHOUSE.state} {WAREHOUSE.zip}
              </p>
              {user.warehouseCode && (
                <p className="mt-2 text-sm font-semibold text-navy-900">Suite {user.warehouseCode}</p>
              )}
              <p className="mt-3 text-sm text-navy-800/60">{user.rewardsPoints} reward points</p>
              <div className="mt-4">
                <CopyAddress name={`${user.name} c/o ${WAREHOUSE.name}`} suite={user.warehouseCode} />
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">Your packages</p>
              {user.shipments.length === 0 ? (
                <p className="mt-3 text-sm text-navy-800/60">No packages yet. Book a shipment.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {user.shipments.map((s) => {
                    const step = publicStepForShipment(s.status, s.invoiceStatus);
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/track/${s.shipmentCode}`}
                          className="flex min-h-tap flex-col gap-1 rounded-2xl border border-navy-900/10 px-4 py-3 hover:border-forest-400"
                        >
                          <span className="font-semibold text-navy-900">{s.shipmentCode}</span>
                          <span className="text-sm text-navy-800/60">
                            {s.origin} → {s.destination} · {SERVICE_LABEL[s.service]}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="teal">{PUBLIC_TRACK_LABEL[step]}</Badge>
                            <Badge>{INVOICE_STATUS_LABEL[s.invoiceStatus] ?? "No invoice yet"}</Badge>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/freight">Book another</Button>
                <Button href="/app" variant="ghost">
                  Workspace
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
