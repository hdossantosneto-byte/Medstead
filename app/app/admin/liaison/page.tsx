import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CUSTODY_LABEL, SHIPMENT_LABEL } from "@/lib/constants";
import { when } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const DOC_KINDS = [
  { kind: "commercial-invoice", label: "Commercial invoice" },
  { kind: "packing-list", label: "Packing list" },
  { kind: "air-waybill", label: "Air waybill" },
  { kind: "customs-declaration", label: "Customs declaration" },
  { kind: "manifest", label: "Import / export manifest" },
] as const;

export default async function AdminLiaisonPage() {
  await requireRole(["MEDSTEAD_ADMIN"]);
  const [orders, shipments, clinics] = await Promise.all([
    prisma.clinicOrder.findMany({
      include: { clinic: true, invoice: true, manifest: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.shipment.findMany({
      include: { events: { orderBy: { createdAt: "asc" } }, clinicOrder: { include: { clinic: true } } },
      orderBy: { updatedAt: "desc" },
      take: 16,
    }),
    prisma.clinic.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Hairson / Clint"
        title="Docs & doctor liaison"
        lede="Import/export packet, chain of custody, clinic contacts. No patient data. Del owns flights."
      />

      <h2 className="font-display text-xl text-navy-900">Doctor liaison</h2>
      <div className="mt-3 space-y-2">
        {clinics.map((c) => (
          <Card key={c.id} className="p-4">
            <p className="font-semibold text-navy-900">{c.name}</p>
            <p className="text-sm text-navy-800/60">
              {c.type} · {c.city}, {c.country} · {c.contactEmail}
            </p>
            {c.activityLine && <p className="mt-1 text-sm text-navy-800/70">{c.activityLine}</p>}
            <Badge>{c.approved ? "Approved" : "Inactive"}</Badge>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl text-navy-900">Import / export docs</h2>
      <div className="mt-3 space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-4">
            <p className="font-semibold text-navy-900">
              {o.orderNumber} · {o.clinic.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {DOC_KINDS.map((d) => (
                <Link
                  key={d.kind}
                  href={`/docs/${d.kind}/${o.id}`}
                  className="font-semibold text-forest-800"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl text-navy-900">Chain of custody</h2>
      <div className="mt-3 space-y-3">
        {shipments.map((s) => (
          <Card key={s.id} className="p-4">
            <p className="font-semibold text-navy-900">{s.shipmentCode}</p>
            <p className="text-sm text-navy-800/60">
              {s.clinicOrder?.clinic.name ?? s.consignee} · {SHIPMENT_LABEL[s.status]}
            </p>
            <ol className="mt-3 space-y-1 text-sm">
              {s.events.length === 0 && <li className="text-navy-800/50">No handoffs yet.</li>}
              {s.events.map((e) => (
                <li key={e.id}>
                  <span className="font-semibold">{CUSTODY_LABEL[e.toStatus] ?? e.toStatus}</span>
                  <span className="text-navy-800/50"> · {when(e.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
