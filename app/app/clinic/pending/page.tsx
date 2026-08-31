import { Card, PageHeader } from "@/components/ui";
import { CONTACT_ORDERS } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export default async function PendingClinicPage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader
        eyebrow="My Clinic"
        title="Waiting on MedStead approval"
        lede="Clinic, doctor, and pharmacy seats stay inactive until a MedStead admin approves the organization."
      />
      <Card className="p-6">
        <p className="text-sm leading-6 text-navy-800/70">
          {user.clinic ? (
            <>
              <strong>{user.clinic.name}</strong> ({user.clinic.city}, {user.clinic.country}) is{" "}
              {user.clinic.approved ? "approved" : "not yet approved"}. Your user flag is{" "}
              {user.active ? "active" : "inactive"}.
            </>
          ) : (
            "No clinic is linked to this account."
          )}
        </p>
        <p className="mt-4 text-sm text-navy-800/60">Questions: {CONTACT_ORDERS}</p>
      </Card>
    </div>
  );
}
