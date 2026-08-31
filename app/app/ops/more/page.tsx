import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { isDel } from "@/lib/org";
import { requireRole } from "@/lib/session";

export default async function OpsMorePage() {
  const user = await requireRole(["OPS"]);
  const del = isDel(user);
  const links = del
    ? [
        { href: "/app/flights", title: "MTG Airlines", body: "Cargo, travel, charter, rescue. Mexico / MSY not live." },
        { href: "/app/flights/135", title: "Part 135 readiness", body: "NOT LIVE / FUTURE 135. No certificate number." },
        { href: "/app/travel", title: "Company travel", body: "Open a company or rescue trip. Del still dispatches." },
        { href: "/app/orders", title: "Orders & Packages", body: "Pick / pack and trackable packages." },
        { href: "/app/ops/compliance", title: "Six-gate release", body: "All green before dispatch." },
        { href: "/app/ops/inventory", title: "Inventory", body: "WareSpace C15 on-hand counts." },
      ]
    : [
        { href: "/app/orders", title: "Orders & Packages", body: "Pick / pack and trackable packages." },
        { href: "/app/ops/packages", title: "Packages", body: "Receive at C15 and track." },
        { href: "/app/ops/compliance", title: "Six-gate release", body: "All green before Del flies." },
        { href: "/app/ops/inventory", title: "Inventory", body: "WareSpace C15 on-hand counts." },
        { href: "/app/ops/catalog", title: "Catalog", body: "SKU master. No finance totals." },
      ];

  return (
    <div>
      <PageHeader
        eyebrow="More"
        title={del ? "MTG Airlines + warehouse" : "Warehouse tools"}
        lede={del ? "Dispatch airline first. Warehouse is Chris. Finance cannot fly." : "Del owns dispatch. You own the floor."}
      />
      <div className="grid gap-3">
        {links.map((l) => (
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
