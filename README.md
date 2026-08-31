# MedStead

**FASTER ACCESS. BETTER CARE.**

We provide medicinal goods and care, and expedite them to hard to reach destinations.

MedStead (never MeadStead) is a single web app for public freight, My Clinic B2B supply, admin CRM, medication operations, and finance. USA and international clinics see different price books. Fort Lauderdale is the active hub (Nassau, Freeport, Miami). Next: Gulf Coast / New Orleans, then Jamaica and the wider Caribbean.

MedStead is **not** a licensed customs broker.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Prisma + SQLite (`prisma/dev.db`)
- NextAuth credentials (JWT)

## Run locally

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build:

```bash
npm run build
npm start
```

One-step database setup: `npm run db:setup`.

## Demo logins

Visit `/demo` and click a role. Password for **every** seeded user is `demo1234`.

| Role | Email | Notes |
| --- | --- | --- |
| Public | public@medstead.demo | Freight portal visitor |
| Customer | customer@medstead.demo | Warehouse suite + rewards |
| Clinic admin | clinic.admin@medstead.demo | Approved **USA** clinic (Harbor Wellness) |
| Doctor | doctor@medstead.demo | Approved **international** clinic (Bethel Medical) |
| Pharmacy | pharmacy@medstead.demo | Inactive until admin approves 360 Wellness |
| MedStead admin | admin@medstead.demo | CRM, approvals, invoices, status override |
| Ops | ops@medstead.demo | Six-gate release; no finance totals |
| Finance | finance@medstead.demo | Invoices/payments; cannot ship |

## What to try

1. Public: `/freight` quote (Express Air 3–5 days, Standard Sea 5–7 days) and `/track/MS-20260820-FLL-NAS-0001`.
2. Customer: rewards (100 welcome + 1 pt / $1) and WareSpace C15, 700 NW 57th Ct, Fort Lauderdale, FL 33309.
3. Approved clinic: `/app/clinic/catalog` — USA vs international books, place an order through the 11 clinic statuses.
4. Admin: approve 360 Wellness, move CRM stages, override order status, generate invoice/manifest.
5. Ops: `/app/ops/compliance` six gates. Catalog and orders hide money.
6. Finance: invoices and payments. No warehouse/flight actions.
7. Flight ops: `/app/flights` is labeled coming later.

Printable docs (signed-in): Commercial Invoice, Packing List, Air Waybill, Customs Declaration, Import/Export Manifest under `/docs/{kind}/{orderId}`.

## Catalog rules

- Non-RX SKUs are **DEMO** clinic supplies (syringes, swabs, devices) with USA breaks 100 / 250 / 500 / 1000 / 5000 / 10000 and international 20–50 / 51–99 / 100–149 / 150–200 / 201–250 / 250–500.
- International IV / supplies are seeded only from `docs/LEGAL_INTL_RX_ROWS.txt` (vitamins, aminos, NAD+, B12, glutathione, lipo blends, syringes/swabs). Sourced international prices.
- USA IV rows are **DEMO** labeled (no matching sourced USA book except as noted in the spec).
- Not seeded: testosterone, ivermectin, oxytocin, ketamine, hormone/estrogen compounds, clomiphene, tesofensine, fenbendazole, metformin, GLP-1 / peptides (Semaglutide, Tirzepatide, Retatrutide, Lilly, incretin).

## Contact

Orders@medsteadgroup.com
