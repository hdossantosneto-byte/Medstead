import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CLINIC_ROLES, ROLE_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";
import { money } from "@/lib/format";

export default async function AppHome() {
  const user = await requireUser();
  const clinicOk = clinicApproved(user);

  const [orderCount, openInvoices, shipments, pendingClinics] = await Promise.all([
    prisma.clinicOrder.count(),
    prisma.invoice.findMany({ where: { status: { not: "paid" } } }),
    prisma.shipment.count(),
    prisma.clinic.count({ where: { approved: false } }),
  ]);

  const outstanding = openInvoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);

  return (
    <div>
      <PageHeader
        eyebrow={ROLE_LABEL[user.role]}
        title={`Hello, ${user.name.split(" ")[0]}`}
        lede="One MedStead workspace. Role-based modules for freight, My Clinic, admin CRM, medication operations, and finance."
      />

      {CLINIC_ROLES.includes(user.role) && !clinicOk && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-navy-900">Account pending approval</p>
          <p className="mt-1 text-sm text-navy-800/70">
            Clinic, doctor, and pharmacy accounts stay inactive until a MedStead admin approves the
            clinic. You cannot browse the catalog yet.
          </p>
          <Link href="/app/clinic/pending" className="mt-3 inline-block text-sm font-semibold text-teal-800">
            View status →
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(user.role === "PUBLIC" || user.role === "CUSTOMER") && (
          <>
            <Stat href="/freight" label="New freight quote" value="Air / Sea" />
            <Stat href="/app/customer" label="Rewards points" value={String(user.rewardsPoints)} />
            <Stat href="/warehouse" label="Warehouse suite" value={user.warehouseCode ?? "Assign"} />
          </>
        )}
        {CLINIC_ROLES.includes(user.role) && clinicOk && (
          <>
            <Stat href="/app/clinic/catalog" label="Price book" value={user.clinic?.market ?? ""} />
            <Stat href="/app/clinic/orders" label="Clinic" value={user.clinic?.name ?? ""} />
            <Stat href="/app/clinic/catalog" label="Catalog" value="RX · Non-RX · IV" />
          </>
        )}
        {user.role === "MEDSTEAD_ADMIN" && (
          <>
            <Stat href="/app/admin/approvals" label="Pending clinics" value={String(pendingClinics)} />
            <Stat href="/app/admin/orders" label="Clinic orders" value={String(orderCount)} />
            <Stat href="/app/admin/crm" label="CRM pipeline" value="ENABLE cycle" />
          </>
        )}
        {user.role === "OPS" && (
          <>
            <Stat href="/app/ops/shipping" label="Shipments" value={String(shipments)} />
            <Stat href="/app/ops/compliance" label="Six-gate release" value="All green first" />
            <Stat href="/app/ops/inventory" label="Warehouse" value="FLL-C15" />
          </>
        )}
        {user.role === "FINANCE" && (
          <>
            <Stat href="/app/finance/invoices" label="Outstanding" value={money(outstanding)} />
            <Stat href="/app/finance/payments" label="Open invoices" value={String(openInvoices.length)} />
            <Stat href="/app/finance/reports" label="Reports" value="Collections" />
          </>
        )}
      </div>

      <Card className="mt-6 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Operating note
        </p>
        <p className="mt-2 text-sm leading-6 text-navy-800/70">
          Sales representatives cannot promise delivery dates — Del owns date commitments. Finance
          signs payment and credit. Ops cannot see finance totals. Finance cannot run warehouse or
          flights. No patient data belongs in the sales CRM.
        </p>
        {user.role === "OPS" && (
          <p className="mt-3">
            <Badge tone="amber">Finance numbers hidden</Badge>
          </p>
        )}
        {user.role === "FINANCE" && (
          <p className="mt-3">
            <Badge tone="amber">Shipping actions disabled</Badge>
          </p>
        )}
      </Card>
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition hover:border-teal-300">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{label}</p>
        <p className="mt-2 font-display text-2xl text-navy-900">{value}</p>
      </Card>
    </Link>
  );
}
