import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function InventoryPage() {
  await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const items = await prisma.inventoryItem.findMany({
    include: { product: true },
    orderBy: { location: "asc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Ops" title="Inventory" lede="Fort Lauderdale WareSpace C15 on-hand counts." />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-800/50">
              <th className="px-4 py-3">SKU</th>
              <th>Product</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-navy-900/8">
                <td className="px-4 py-2 text-xs">{i.product.sku}</td>
                <td>{i.product.name}</td>
                <td>{i.onHand}</td>
                <td>{i.reserved}</td>
                <td>{i.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
