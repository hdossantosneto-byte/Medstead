import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { QuoteForm } from "@/components/quote-form";
import { PageHeader } from "@/components/ui";
import { auth } from "@/lib/session";

export const metadata = { title: "Freight quotes" };

export default async function FreightPage() {
  const session = await auth();
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="Public freight portal"
          title="Quote Express Air or Standard Sea"
          lede="Express Air 3–5 days and Standard Sea 5–7 days after release. 10% off when paying online. We do not treat supplier lead time as transit time."
        />
        <QuoteForm persist={Boolean(session?.user)} />
      </div>
      <Footer />
    </div>
  );
}
