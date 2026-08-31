import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { CartClient } from "@/components/cart-client";
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
          lede="Add from the clinic book, then place the order. Freight Shop & Ship is a separate path."
        />
        <CartClient canOrder={canOrder} />
      </div>
      <Footer />
    </div>
  );
}
