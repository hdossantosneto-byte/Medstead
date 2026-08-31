import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { ShopShipForm } from "@/components/shop-ship-form";
import { PageHeader } from "@/components/ui";
import { WAREHOUSE } from "@/lib/constants";
import { auth } from "@/lib/session";

export const metadata = { title: "Shop & Ship" };

export default async function ShopAndShipPage() {
  const session = await auth();
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Shop & Ship"
          title="Send a US parcel to WareSpace C15"
          lede={`Paste a retailer link or describe the package. We receive at ${WAREHOUSE.line} and forward. Not a consumer pharmacy shop.`}
        />
        <ShopShipForm signedIn={Boolean(session?.user)} />
      </div>
      <Footer />
    </div>
  );
}
