import { redirect } from "next/navigation";
import { Badge, Notice, PageHeader } from "@/components/ui";
import { MARKET_LABEL } from "@/lib/constants";
import { forbiddenSkuMatch } from "@/lib/cargo";
import { prisma } from "@/lib/prisma";
import { clinicApproved, requireUser } from "@/lib/session";
import { CatalogClient } from "@/components/catalog-client";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const user = await requireUser();
  if (!clinicApproved(user) || !user.clinic) redirect("/app/clinic/pending");

  const products = await prisma.product.findMany({
    include: { prices: { where: { market: user.clinic.market }, orderBy: { minQty: "asc" } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        eyebrow="Shop"
        title={`${user.clinic.name}`}
        lede={`Search, add to cart, place order. ${MARKET_LABEL[user.clinic.market]} book. Prices include delivery within 7 days.`}
      />
      <Notice>
        DEMO prices are labeled on purpose — they are not official wholesale. Sourced international
        IV / supply rows come from the legal Full CAT RX remainder. Peptide and GLP-1 SKUs are not
        cataloged.
      </Notice>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="teal">{MARKET_LABEL[user.clinic.market]}</Badge>
        <Badge>{user.clinic.country}</Badge>
      </div>
      <CatalogClient
        market={user.clinic.market}
        tab={searchParams.tab ?? "IV"}
        products={products
          .filter((p) => !forbiddenSkuMatch(`${p.name} ${p.sku} ${p.description ?? ""}`))
          .map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          strength: p.strength,
          form: p.form,
          category: p.category,
          description: p.description,
          prices: p.prices.map((t) => ({
            minQty: t.minQty,
            maxQty: t.maxQty,
            unitPrice: t.unitPrice,
            label: t.label,
          })),
        }))}
      />
    </div>
  );
}
