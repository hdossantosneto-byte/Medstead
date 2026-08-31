# MedStead production app spec

Brand: MedStead (never MeadStead). Tagline: FASTER ACCESS. BETTER CARE.
Public line: We provide medicinal goods and care, and expedite them to hard to reach destinations.
Mission: ensure every community has access to the health care it deserves.

## Legal
Do not catalog or market Semaglutide, Tirzepatide, GLP-1 brands, peptides, Lilly, or incretin. Seed generic clinic supplies / devices / IV / ordinary RX only.

## Geography and price books
Not Bahamas-only. Clinics in USA and internationally see DIFFERENT prices.
- USA domestic book: "Copy of MEDSTEAD Price - Customer Price.pdf" (email "Our Domestic Market", 2026-08-07)
- International RX: "Full CAT RX - Medstead International Product List.pdf"
- International Non-RX: "MEDSTEAD Price - International NON-RX.pdf"
Prices include delivery within 7 days to the clinic.
Hubs: Fort Lauderdale (active: Nassau, Freeport, Miami). Next: Gulf Coast / New Orleans, then Jamaica, wider Caribbean.
Live clinic markets in mail: Bahamas (Dr. Bethel, Dr. Rolle), USA physician acquisition (FLL / NOLA), Barbados (360 Wellness), Brazil partner (Carolina Lopes).

Warehouse: WareSpace - MedStead, 700 NW 57th Ct, Unit C15, Fort Lauderdale, FL 33309. Orders@medsteadgroup.com.

## Modules (one app)
1. Public freight portal: Express Air (3-5 days), Standard Sea (5-7 days), quotes, tracking, rewards 1pt/$1 (100 welcome), personal US warehouse address, customs.
2. My Clinic: Clinic / Doctor / Pharmacy accounts inactive until admin approval. Catalog RX / Non-RX / IV. Non-RX 6-tier volume pricing.
3. Admin CRM: customers, clinics, approval queue, invoices, manifests, status override.
4. Ops (Medication Operations): catalog, orders, inventory, shipping, compliance. Cannot see finance.
5. Finance: quotes, invoices, payments, outstanding balances, reports. Cannot run warehouse/flights.
6. Flight ops (later module): FLL-NAS, FLL-FPO, future MSY.

## 11 order statuses
1 Submitted, 2 Under Review, 3 Approved, 4 Invoice Generated, 5 Payment Pending, 6 Payment Received, 7 Preparing Shipment, 8 Manifest Generated, 9 Shipped, 10 In Transit, 11 Delivered.
Admin manual override. Also surface payment_pending + submitted on manifests.

## Docs generated
Commercial Invoice, Packing List, Air Waybill, Customs Declaration, Import/Export Manifest, Bahamas MOH-compliant docs.

## Demo users
public, customer, clinic_admin, doctor, pharmacy, medstead_admin, ops, finance.

## Do not include
Investor/deal material, bank account numbers, peptide shop, MeadStead typo, Wayne Gray as a user.

## From Blaine Dropbox ops/sales manuals (Aug 2026)
Do not put investor/deal terms in the public app.

CRM pipeline (admin): Targeted → Contacted → Discovery → Qualified → Forum/Consult → Eligibility review → Activated → First service → Repeat → Strategic. Hold/lost with reason. No patient data in sales CRM.

Shipment six-gate release (ops): 1 Customer/consignee 2 Product/source 3 Commercial/finance 4 Export/import 5 Packaging/quality 6 Carrier/capacity. All green before manifest.

Docs packet: PO, quote, commercial invoice, packing list, AWB/BOL, licenses, COA when applicable.

Commercial promise: coordinate pharmacy, telehealth, medical-supply and logistics for licensed healthcare businesses. Reps cannot promise delivery dates (Del only) or custom discounts without approval.

ENABLE cycle: Educate, Navigate, Activate, Build, Leverage, Expand. 30-day zone, monthly provider forum, 48h follow-up, 90-day retention test.

## Logistics shipment statuses (ops, linked to clinic order)
1 Submitted, 2 Compliance Review, 3 Quoted, 4 Approved/Paid, 5 Awaiting Supplier,
6 Origin Received - Hold, 7 Released/Manifested, 8 In Transit, 9 Customs Hold/Released,
10 Destination Received, 11 Delivered/Closed.
Shipment ID: MS-YYYYMMDD-ORIGIN-DEST-#### (never reuse).
Flight-day: T-48 product/permits/aircraft/weather → T-24 freeze manifest → T-6 go/no-go → tender → departure → arrival → customs → POD.
Public clock starts only after release. Do not advertise supplier lead time as transit time.
Center City catalog size: investor docs say 100+ entries; 630 SKUs is unverified.

USA Customer Price PDF extracted 2026-08-30: 6 volume tiers are Qty 100 / 250 / 500 / 1,000 / 5,000 / 10,000.
File contents are almost entirely research-peptide SKUs plus NAD+ 500mg/1000mg 10mL. Do not seed those peptide SKUs. Keep the 6 qty-break structure for Non-RX DEMO pricing. NAD+ may be included as IV only if counsel is ok; until then treat as demo/optional.

## Price books extracted 2026-08-30 (Gmail PDFs on disk)
USA Customer Price: 6 tiers Qty 100 / 250 / 500 / 1,000 / 5,000 / 10,000. Contents = research peptides + NAD+ 500/1000. Do not seed peptide SKUs.
International Non-RX: DIFFERENT 6 tiers Qty 20-50 / 51-99 / 100-149 / 150-200 / 201-250 / 250-500. Same peptide SKU set. Do not seed.
International Full CAT RX: ~250 rows, Product/Strength/Form + single international price. Includes GLP-1 (exclude) plus IV vitamins/aminos/NAD/B12/glutathione/lipo blends and supplies (syringes, swabs). Seed only the IV/supplies remainder. USA book has no matching IV rows except NAD+; use sourced NAD+ USA tiers and sourced intl IV prices; other USA IV prices stay DEMO.
Email terms: all prices include delivery within seven days to the clinic. Intl Non-RX starts at 20 units.
Invoice #1124 Dr. Bethel total $8,533.60 USD (line items were peptide SKUs; do not show in app). File itself failed to download.
Legal row extract: /workspace/medstead/LEGAL_INTL_RX_ROWS.txt
