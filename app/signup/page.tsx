import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicNav } from "@/components/public-nav";
import { SignupForm } from "@/components/signup-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
        <PageHeader
          eyebrow="Create account"
          title="Sign up"
          lede="One login. Freight customers get a WareSpace C15 suite. Clinics stay inactive until Clint approves."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
              Freight / Shop & Ship
            </p>
            <h2 className="mt-2 font-display text-2xl text-navy-900">Customer</h2>
            <p className="mt-2 text-sm text-navy-800/70">
              Quote, track, and send parcels to C15. 100 welcome points.
            </p>
            <div className="mt-5">
              <SignupForm />
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
              Licensed clinic
            </p>
            <h2 className="mt-2 font-display text-2xl text-navy-900">My Clinic</h2>
            <p className="mt-2 text-sm leading-6 text-navy-800/70">
              Doctors, pharmacies, and clinics order the legal book after admin approval. No
              peptide shop.
            </p>
            <p className="mt-6">
              <Link href="/clinic-signup/demo" className="font-semibold text-forest-800">
                Request clinic access
              </Link>
            </p>
            <p className="mt-4 text-sm">
              <Link href="/login" className="font-semibold text-navy-800">
                Already have a seat? Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
