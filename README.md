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
| Ops (Chris) | ops@medstead.demo | Warehouse pick / pack; no finance totals |
| Del | del@medstead.demo | Delivery dates + Dispatch flight |
| Finance | finance@medstead.demo | Invoices/payments; cannot ship |

## Brand

Header, login, footer, and ops use Hairson’s official MedStead Transport lockup (`public/medstead-logo.png`): globe with the Americas, cargo ship (green containers), semi-truck with a green medical cross, navy jet, navy/green motion arcs, MEDSTEAD (green cross in the D), TRANSPORT, FASTER ACCESS. BETTER CARE. Phone header uses a crop of that PNG (`medstead-compact.png`). Favicon and PWA icons are square crops of the same artwork. Navy `#002147` / `#0B2545` and forest green `#2E7D32`. No invented sublines.

## Do this next

Each signed-in home (`/app`) is a **Do this next** queue: work waiting on that role, one card, one button. Completing a step writes an activity line on the record and creates the next role’s item. Empty state: “You're clear. Nothing is waiting on you.”

Clinic 11-status and logistics 11-status stay in sync. Submitting a clinic order creates a linked shipment (public clock off). Next-action buttons move **both** machines: review → approve → invoice → pay → prepare → gates → origin hold → manifest → Del date → shipped / **Dispatch flight** → in transit → delivered. Do not WhatsApp — use the queue. Contact email is for exceptions only.

## Orders & Packages

Public `/orders` (also `/orders-and-packages`) combines Track a package and + New order. Header and footer SERVICES both link **Orders & Packages**.

Ops on a phone (`/app/ops`): sticky bottom nav Home | Next | Orders | Packages | More. Huge **Orders** and **Packages** tiles, six-gate count, warehouse FLL-C15. Packages = one tap per shipment. Finance numbers stay hidden.

## Flight dispatch (Del)

`/app/flights` is live. Corridors: FLL–NAS and FLL–FPO (live), FLL–MSY (not live yet). Flight-day: T-48 → T-24 freeze → T-6 go/no-go → dispatch. **Doctors do not block dispatch.** Finance cannot fly.

Demo path:

1. `doctor@medstead.demo` — shop / see orders (CO-1008 is already released).
2. `finance@medstead.demo` — mark paid when an invoice is waiting.
3. `del@medstead.demo` — tap **Dispatch flight** on the Nassau package.
4. Doctor refresh shows In Transit. No call to Del.

Seeded examples:

- **Admin (Clint):** 48h follow-up (Rolle), activate 360 Wellness, start review of CO-1001.
- **Finance:** generate invoice for approved CO-1005; mark paid on CO-1002.
- **Del (ops):** Dispatch flight on doctor-originated CO-1008 (FLL–NAS). Date promises are Del-only.
- **Chris (ops):** prepare shipment for paid CO-1006; clear packaging/quality on hold freight.
- **Pharmacy:** pending approval until Clint activates 360 Wellness.
- **Doctor:** pay invoice CO-1002; after Del dispatches, track In Transit without calling.

Finance cannot ship. Ops cannot see invoice totals. Sales/admin cannot set delivery dates.

## What to try

1. Public: `/orders` (Orders & Packages), `/freight` quote, `/track/MS-20260820-FLL-NAS-0001`.
2. `/demo` as Del, doctor, finance, admin — each home is a next-action queue.
3. Approved clinic: `/app/clinic/catalog` — search, categories, cart, place an order.
4. Customer: rewards (100 welcome + 1 pt / $1) and WareSpace C15, 700 NW 57th Ct, Fort Lauderdale, FL 33309.
5. Del: `/app/ops` on a phone-width window, then **Dispatch flight**.

Printable docs (signed-in): Commercial Invoice, Packing List, Air Waybill, Customs Declaration, Import/Export Manifest under `/docs/{kind}/{orderId}`.

## Catalog rules

- Non-RX SKUs are **DEMO** clinic supplies (syringes, swabs, devices) with USA breaks 100 / 250 / 500 / 1000 / 5000 / 10000 and international 20–50 / 51–99 / 100–149 / 150–200 / 201–250 / 250–500.
- International IV / supplies are seeded only from `docs/LEGAL_INTL_RX_ROWS.txt` (vitamins, aminos, NAD+, B12, glutathione, lipo blends, syringes/swabs). Sourced international prices.
- USA IV rows are **DEMO** labeled (no matching sourced USA book except as noted in the spec).
- Not seeded: testosterone, ivermectin, oxytocin, ketamine, hormone/estrogen compounds, clomiphene, tesofensine, fenbendazole, metformin, GLP-1 / peptides (Semaglutide, Tirzepatide, Retatrutide, Lilly, incretin).

## Contact

Orders@medsteadgroup.com
