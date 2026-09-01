import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { BookForm } from "@/components/book-form";
import { PageHeader } from "@/components/ui";
import { auth } from "@/lib/session";

export const metadata = { title: "Book a shipment" };

export default async function FreightPage() {
  const session = await auth();
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:py-10">
        <PageHeader
          eyebrow="Ship Now"
          title="Book Express Air or Standard Sea"
          lede="Guests get a tracking ID immediately. No card is charged. Ops emails an invoice you can pay later. Express Air 3–5 days and Standard Sea 5–7 days after release."
        />
        <BookForm
          defaults={{
            name: session?.user?.name ?? undefined,
            email: session?.user?.email ?? undefined,
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
