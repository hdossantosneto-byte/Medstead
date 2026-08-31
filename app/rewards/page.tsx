import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { Card, PageHeader } from "@/components/ui";
import { POINTS_PER_DOLLAR, WELCOME_POINTS } from "@/lib/constants";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Loyalty"
          title="MedStead rewards"
          lede={`${WELCOME_POINTS} welcome points when you become a freight customer, then ${POINTS_PER_DOLLAR} point per $1. Pay online and take 10% off quoted freight.`}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Your points
            </p>
            <p className="mt-2 font-display text-4xl text-navy-900">
              {user ? user.rewardsPoints : "—"}
            </p>
            <p className="mt-2 text-sm text-navy-800/60">
              {user ? user.email : "Sign in as a customer to see your balance."}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-xl text-navy-900">Earn</h2>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">
              Welcome bonus plus points on freight quotes you convert. Points are operational
              loyalty only — not a security or investment.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-xl text-navy-900">Save</h2>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">
              10% off when paying a freight quote online. Clinic invoices follow finance terms;
              online discount applies to the public freight portal.
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
