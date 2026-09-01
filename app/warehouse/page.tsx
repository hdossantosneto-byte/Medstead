import { CopyAddress } from "@/components/copy-address";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Card, PageHeader } from "@/components/ui";
import { WAREHOUSE } from "@/lib/constants";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "US warehouse address" };

export default async function WarehousePage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10 pb-28">
        <PageHeader
          eyebrow="Fort Lauderdale hub"
          title="Personal US warehouse address"
          lede="Inbound parcels are received at WareSpace and forwarded on Express Air or Standard Sea. This is a receiving suite — not a customs brokerage office."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Ship to
            </p>
            <p className="mt-3 text-lg font-semibold text-navy-900">
              {user?.name ?? "Your name"}
            </p>
            <p className="text-navy-800">{WAREHOUSE.name}</p>
            <p className="mt-1 text-navy-800">{WAREHOUSE.street}</p>
            <p className="text-navy-800">
              {WAREHOUSE.city}, {WAREHOUSE.state} {WAREHOUSE.zip}
            </p>
            {user?.warehouseCode ? (
              <p className="mt-4 text-sm text-teal-800">
                Your personal suite code is <strong>{user.warehouseCode}</strong>.
              </p>
            ) : (
              <p className="mt-4 text-sm text-navy-800/60">
                Sign in as a customer to see your assigned suite code (demo: MS-C15-1042).
              </p>
            )}
            <CopyAddress name={user?.name} suite={user?.warehouseCode} />
          </Card>
          <Card className="p-8">
            <h2 className="font-display text-xl text-navy-900">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-navy-800/70">
              <li>Use this address plus your suite code on US inbound labels.</li>
              <li>Ops receives at origin and holds until six-gate release.</li>
              <li>Public transit clock starts after Released/Manifested.</li>
              <li>You are the importer of record. MedStead is not a licensed customs broker.</li>
            </ol>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
