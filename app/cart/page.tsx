import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { CartClient } from "@/components/cart-client";
import { FreightCartClient } from "@/components/freight-cart-client";
import { PageHeader } from "@/components/ui";
import { CLINIC_ROLES } from "@/lib/constants";
import { auth } from "@/lib/session";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canOrder = Boolean(role && CLINIC_ROLES.includes(role as (typeof CLINIC_ROLES)[number]));

  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
        <PageHeader
          eyebrow="Cart"
          title="Your cart"
          lede="Freight bookings live here for everyone. Clinic supply is a separate signed-in book — never on the public catalog."
        />
        <div className="grid gap-6">
          <FreightCartClient
            contact={{
              name: session?.user?.name ?? undefined,
              email: session?.user?.email ?? undefined,
            }}
          />
          {canOrder && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
                Clinic book (signed-in)
              </p>
              <CartClient canOrder={canOrder} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
