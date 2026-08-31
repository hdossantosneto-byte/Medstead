import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { CONTACT_ORDERS, WAREHOUSE } from "@/lib/constants";
import { money, whenDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const KINDS = [
  "commercial-invoice",
  "packing-list",
  "air-waybill",
  "customs-declaration",
  "manifest",
] as const;

const TITLES: Record<(typeof KINDS)[number], string> = {
  "commercial-invoice": "Commercial Invoice",
  "packing-list": "Packing List",
  "air-waybill": "Air Waybill",
  "customs-declaration": "Customs Declaration",
  manifest: "Import / Export Manifest",
};

export const dynamic = "force-dynamic";

export default async function DocPage({
  params,
}: {
  params: { kind: string; id: string };
}) {
  if (!KINDS.includes(params.kind as (typeof KINDS)[number])) notFound();
  await requireUser();
  const order = await prisma.clinicOrder.findUnique({
    where: { id: params.id },
    include: {
      clinic: true,
      items: { include: { product: true } },
      invoice: true,
      manifest: true,
      shipment: true,
    },
  });
  if (!order) notFound();
  const kind = params.kind as (typeof KINDS)[number];
  const total = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const dest = order.manifest?.destination ?? (order.clinic.market === "USA" ? "FLL" : "NAS");

  return (
    <div className="print-sheet mx-auto min-h-screen max-w-3xl bg-white px-8 py-10 text-navy-900">
      <div className="no-print mb-6 flex justify-between">
        <a href="/app" className="text-sm font-semibold text-teal-800">
          ← Back
        </a>
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b border-navy-900 pb-4">
        <div>
          <p className="font-display text-3xl">MedStead</p>
          <p className="text-xs uppercase tracking-[0.16em] text-teal-700">Faster access. Better care.</p>
        </div>
        <div className="text-right text-xs leading-5">
          <p>{WAREHOUSE.line}</p>
          <p>{CONTACT_ORDERS}</p>
        </div>
      </header>
      <h1 className="mt-6 font-display text-2xl">{TITLES[kind]}</h1>
      <p className="mt-1 text-sm text-navy-800/60">
        {order.orderNumber}
        {order.invoice ? ` · ${order.invoice.number}` : ""}
        {order.manifest ? ` · ${order.manifest.number}` : ""}
        {order.shipment ? ` · ${order.shipment.shipmentCode}` : ""}
      </p>

      <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/50">Shipper</p>
          <p>MedStead — WareSpace Unit C15</p>
          <p>{WAREHOUSE.street}</p>
          <p>
            {WAREHOUSE.city}, {WAREHOUSE.state} {WAREHOUSE.zip}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/50">Consignee</p>
          <p>{order.clinic.name}</p>
          <p>{order.clinic.address}</p>
          <p>
            {order.clinic.city}, {order.clinic.country}
          </p>
        </div>
      </section>

      {(kind === "commercial-invoice" || kind === "packing-list" || kind === "manifest") && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-navy-800/50">
              <th className="py-2">Description</th>
              <th>Qty</th>
              {kind === "commercial-invoice" && <th>Unit</th>}
              {kind === "commercial-invoice" && <th>Amount</th>}
              <th>Book</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-navy-900/10">
                <td className="py-2">
                  {i.product.name}
                  <div className="text-xs text-navy-800/50">
                    {i.product.sku} {[i.product.strength, i.product.form].filter(Boolean).join(" ")}
                  </div>
                </td>
                <td>{i.qty}</td>
                {kind === "commercial-invoice" && <td>{money(i.unitPrice)}</td>}
                {kind === "commercial-invoice" && <td>{money(i.unitPrice * i.qty)}</td>}
                <td>{i.priceLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {kind === "commercial-invoice" && (
        <p className="mt-4 text-right text-lg font-semibold">
          Invoice total {money(order.invoice?.amount ?? total)} USD
        </p>
      )}

      {kind === "air-waybill" && (
        <div className="mt-6 space-y-2 text-sm">
          <p>AWB (house): MS-AWB-{order.orderNumber.replace("CO-", "")}</p>
          <p>
            Airport of departure: FLL · Airport of destination: {dest}
          </p>
          <p>Pieces / weight: {order.items.reduce((s, i) => s + i.qty, 0)} line units (clinic carton)</p>
          <p>Handling: Keep upright. Coordinate with licensed importer of record.</p>
        </div>
      )}

      {kind === "customs-declaration" && (
        <div className="mt-6 space-y-3 text-sm leading-6">
          <p>
            This packet supports export from the United States and import at destination for licensed
            healthcare businesses. It is prepared as an operational declaration worksheet.
          </p>
          <p>
            Importer of record: {order.clinic.name}, {order.clinic.country}. Goods: clinic IV
            vitamins / aminos / supplies as listed on the commercial invoice. No peptide or GLP-1
            articles.
          </p>
          {order.clinic.country.toLowerCase().includes("bahamas") && (
            <p>
              Bahamas destination: attach any Ministry of Health permits the consignee provides.
              MedStead does not file as a licensed customs broker.
            </p>
          )}
        </div>
      )}

      {kind === "manifest" && (
        <div className="mt-6 text-sm">
          <p>
            Route FLL → {dest}. Clinic order status: {order.status}. Surface payment-pending and
            submitted work on the admin manifests board.
          </p>
        </div>
      )}

      <footer className="mt-10 border-t border-navy-900/20 pt-4 text-xs leading-5 text-navy-800/60">
        <p>Issued {whenDate(new Date())}. Prices include delivery within 7 days to the clinic when this is a clinic order.</p>
        <p>
          MedStead is not a licensed customs broker. Representatives cannot promise delivery dates —
          Del owns date commitments. Finance signs payment / credit.
        </p>
      </footer>
    </div>
  );
}
