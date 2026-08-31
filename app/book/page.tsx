import { BookForm } from "@/components/book-form";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Book a shipment" };

export default async function BookPage() {
  const user = await currentUser();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Ship now</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-950">Book a shipment</h1>
      <p className="mt-4 max-w-2xl text-navy-800/70">
        From/to, cargo, and timing. You get a confirmation and tracking ID. Ops sends an invoice
        you can pay later — no card is charged on this site.
      </p>
      <div className="mt-10">
        <BookForm
          defaults={
            user
              ? { name: user.name, email: user.email, phone: user.phone }
              : undefined
          }
        />
      </div>
    </div>
  );
}
