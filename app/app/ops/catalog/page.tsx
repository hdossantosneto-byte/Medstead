import { Badge, Card, PageHeader } from "@/components/ui";
import { CATEGORY_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function OpsCatalogPage() {
  await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const products = await prisma.product.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Medication operations"
        title="Catalog"
        lede="SKU master without finance totals. DEMO and sourced labels only — unit prices stay with finance and clinic books."
      />
      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold text-navy-900">{p.name}</p>
              <p className="text-xs text-navy-800/50">
                {p.sku} · {[p.strength, p.form].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{CATEGORY_LABEL[p.category]}</Badge>
              <Badge tone="teal">{p.inventory?.onHand ?? 0} on hand</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
