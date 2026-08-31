import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

const LINKS = [
  { href: "/app/flights", title: "Dispatch flight", body: "FLL–NAS, FLL–FPO. MSY not live yet." },
  { href: "/app/ops/inventory", title: "Inventory", body: "WareSpace C15 on-hand counts." },
  { href: "/app/ops/compliance", title: "Six-gate release", body: "All green before manifest." },
  { href: "/app/ops/catalog", title: "Catalog", body: "SKU master. No finance totals." },
];

export default function OpsMorePage() {
  return (
    <div>
      <PageHeader eyebrow="More" title="Warehouse tools" lede="Inventory, gates, catalog, and flight dispatch." />
      <div className="grid gap-3">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="min-h-tap p-5">
              <p className="font-display text-2xl text-navy-900">{l.title}</p>
              <p className="mt-1 text-sm text-navy-800/60">{l.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
