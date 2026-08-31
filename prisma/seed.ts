import {
  ClinicOrderStatus,
  CrmStage,
  FreightService,
  GateName,
  GateState,
  PrismaClient,
  Role,
  ShipmentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadLegalIntlRows } from "./legal-catalog";
import { CLINIC_DRIVES_SHIPMENT, publicClockOn } from "../lib/handoff";
import { CURRENT_FLEET_ASSIGN, PAYING_ENTITY, PAY_METHOD_ZELLE } from "../lib/constants";

const prisma = new PrismaClient();
const PASSWORD = "demo1234";

const USA_BREAKS = [
  { minQty: 100, maxQty: 249 },
  { minQty: 250, maxQty: 499 },
  { minQty: 500, maxQty: 999 },
  { minQty: 1000, maxQty: 4999 },
  { minQty: 5000, maxQty: 9999 },
  { minQty: 10000, maxQty: 999999 },
];

const INTL_BREAKS = [
  { minQty: 20, maxQty: 50 },
  { minQty: 51, maxQty: 99 },
  { minQty: 100, maxQty: 149 },
  { minQty: 150, maxQty: 200 },
  { minQty: 201, maxQty: 250 },
  { minQty: 250, maxQty: 500 },
];

const DEMO_NONRX = [
  { sku: "MS-DEMO-SYR-INS", name: "Insulin syringes, sterile 10-pack", form: "10-pack", base: 2.4 },
  { sku: "MS-DEMO-SYR-IM", name: "Intramuscular syringes with needle", form: "each", base: 0.85 },
  { sku: "MS-DEMO-SWAB", name: "Alcohol prep swabs", form: "each", base: 0.12 },
  { sku: "MS-DEMO-GLOVE", name: "Nitrile exam gloves (pair)", form: "pair", base: 0.28 },
  { sku: "MS-DEMO-TOURN", name: "Single-use tourniquet", form: "each", base: 0.45 },
  { sku: "MS-DEMO-SHARP", name: "Sharps container, 1 quart", form: "each", base: 4.2 },
  { sku: "MS-DEMO-IVSET", name: "IV administration set", form: "each", base: 3.1 },
  { sku: "MS-DEMO-CATH", name: "Peripheral IV catheter", form: "each", base: 1.9 },
  { sku: "MS-DEMO-GAUZE", name: "Sterile gauze sponge 4x4", form: "each", base: 0.18 },
  { sku: "MS-DEMO-TAPE", name: "Medical tape, 1 inch roll", form: "roll", base: 1.15 },
  { sku: "MS-DEMO-WIPES", name: "Surface disinfectant wipes, canister", form: "canister", base: 6.5 },
  { sku: "MS-DEMO-MASK", name: "Procedure masks, box of 50", form: "box", base: 8.4 },
];

const GATES: GateName[] = [
  "CUSTOMER_CONSIGNEE",
  "PRODUCT_SOURCE",
  "COMMERCIAL_FINANCE",
  "EXPORT_IMPORT",
  "PACKAGING_QUALITY",
  "CARRIER_CAPACITY",
];

function skuify(name: string, strength: string, form: string, i: number) {
  const base = `${name}-${strength}-${form}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `MS-INTL-${base}-${String(i + 1).padStart(3, "0")}`;
}

function demoUsaIvPrice(intl: number) {
  return Math.round(intl * 0.92 * 100) / 100;
}

async function main() {
  await prisma.scheduledPay.deleteMany();
  await prisma.payee.deleteMany();
  await prisma.expenseReport.deleteMany();
  await prisma.releaseGate.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.manifest.deleteMany();
  await prisma.clinicOrderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.freightQuote.deleteMany();
  await prisma.clinicOrder.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.priceTier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.crmAccount.deleteMany();
  await prisma.salesActivity.deleteMany();
  await prisma.salesFollowUp.deleteMany();
  await prisma.salesEvent.deleteMany();
  await prisma.salesAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.shipmentSequence.deleteMany();
  await prisma.part135Readiness.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const legal = loadLegalIntlRows();

  for (const [i, row] of legal.entries()) {
    const product = await prisma.product.create({
      data: {
        sku: skuify(row.name, row.strength, row.form, i),
        name: row.name,
        strength: row.strength || null,
        form: row.form || null,
        category: row.kind === "SUPPLIES" ? "SUPPLIES" : "IV",
        description:
          row.kind === "SUPPLIES"
            ? "Sourced international clinic supply price from the Full CAT RX remainder."
            : "Legal international IV vitamin / amino / NAD+ / B12 / glutathione / lipo blend. Sourced international price.",
        prices: {
          create: [
            {
              market: "INTL",
              minQty: 1,
              maxQty: 999999,
              unitPrice: row.intlPrice,
              label: "SOURCED",
            },
            {
              market: "USA",
              minQty: 1,
              maxQty: 999999,
              unitPrice: demoUsaIvPrice(row.intlPrice),
              label: "DEMO",
            },
          ],
        },
        inventory: {
          create: {
            onHand: 80 + ((i * 7) % 140),
            reserved: i % 5,
            location: "FLL-C15",
          },
        },
      },
    });
    void product;
  }

  for (const item of DEMO_NONRX) {
    await prisma.product.create({
      data: {
        sku: item.sku,
        name: item.name,
        form: item.form,
        category: "NON_RX",
        description:
          "DEMO clinic supply. Volume-break STRUCTURE only. These are not official MedStead wholesale prices.",
        prices: {
          create: [
            ...USA_BREAKS.map((b, idx) => ({
              market: "USA" as const,
              minQty: b.minQty,
              maxQty: b.maxQty,
              unitPrice: Math.round(item.base * (1 - idx * 0.08) * 100) / 100,
              label: "DEMO" as const,
            })),
            ...INTL_BREAKS.map((b, idx) => ({
              market: "INTL" as const,
              minQty: b.minQty,
              maxQty: b.maxQty,
              unitPrice: Math.round(item.base * 1.25 * (1 - idx * 0.07) * 100) / 100,
              label: "DEMO" as const,
            })),
          ],
        },
        inventory: {
          create: { onHand: 400 + item.base * 10, reserved: 12, location: "FLL-C15" },
        },
      },
    });
  }

  const harbor = await prisma.clinic.create({
    data: {
      name: "Harbor Wellness",
      country: "United States",
      city: "Fort Lauderdale",
      market: "USA",
      type: "Clinic",
      approved: true,
      address: "812 SE 3rd Ave, Fort Lauderdale, FL 33301",
      contactEmail: "clinic.admin@medstead.demo",
      licenseNote: "USA physician clinic — demo",
    },
  });

  const bethel = await prisma.clinic.create({
    data: {
      name: "Bethel Medical",
      country: "Bahamas",
      city: "Nassau",
      market: "INTL",
      type: "Doctor",
      approved: true,
      address: "Shirley Street, Nassau, Bahamas",
      contactEmail: "doctor@medstead.demo",
      licenseNote: "International clinic — demo (Dr. Bethel market)",
    },
  });

  const wellness360 = await prisma.clinic.create({
    data: {
      name: "360 Wellness",
      country: "Barbados",
      city: "Bridgetown",
      market: "INTL",
      type: "Pharmacy",
      approved: false,
      address: "Hastings, Christ Church, Barbados",
      contactEmail: "pharmacy@medstead.demo",
      licenseNote: "Pending MedStead admin approval",
      activityLine: "Waiting on Clint to approve · pharmacy cannot order yet.",
    },
  });

  const rolle = await prisma.clinic.create({
    data: {
      name: "Rolle Family Practice",
      country: "Bahamas",
      city: "Nassau",
      market: "INTL",
      type: "Doctor",
      approved: false,
      address: "Carmichael Road, Nassau, Bahamas",
      contactEmail: "rolle@example.invalid",
      licenseNote: "Awaiting eligibility review",
      activityLine: "Forum/Consult · 48h follow-up is waiting on Clint.",
    },
  });

  const users: Array<{
    email: string;
    name: string;
    role: Role;
    active: boolean;
    clinicId?: string;
    rewardsPoints?: number;
    warehouseCode?: string;
    phone?: string;
  }> = [
    {
      email: "public@medstead.demo",
      name: "Ava Public",
      role: "PUBLIC",
      active: true,
    },
    {
      email: "customer@medstead.demo",
      name: "Marcus Reed",
      role: "CUSTOMER",
      active: true,
      rewardsPoints: 100 + 186,
      warehouseCode: "MS-C15-1042",
      phone: "+1 954 555 0142",
    },
    {
      email: "clinic.admin@medstead.demo",
      name: "Elena Vargas",
      role: "CLINIC_ADMIN",
      active: true,
      clinicId: harbor.id,
    },
    {
      email: "doctor@medstead.demo",
      name: "Dr. James Bethel",
      role: "DOCTOR",
      active: true,
      clinicId: bethel.id,
    },
    {
      email: "pharmacy@medstead.demo",
      name: "Priya Shah, RPh",
      role: "PHARMACY",
      active: false,
      clinicId: wellness360.id,
    },
    {
      email: "admin@medstead.demo",
      name: "Jordan Hale",
      role: "MEDSTEAD_ADMIN",
      active: true,
    },
    {
      email: "ops@medstead.demo",
      name: "Chris Okonkwo",
      role: "OPS",
      active: true,
    },
    {
      email: "del@medstead.demo",
      name: "Del",
      role: "OPS",
      active: true,
    },
    {
      email: "pilot@medstead.demo",
      name: "Riley Chen",
      role: "PILOT",
      active: true,
    },
    {
      email: "sales@medstead.demo",
      name: "Camila Ortiz",
      role: "SALES",
      active: true,
    },
    {
      email: "finance@medstead.demo",
      name: "Sofia Alvarez",
      role: "FINANCE",
      active: true,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const row = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: hash,
        name: u.name,
        role: u.role,
        active: u.active,
        clinicId: u.clinicId,
        rewardsPoints: u.rewardsPoints ?? (u.role === "CUSTOMER" ? 100 : 0),
        warehouseCode: u.warehouseCode,
        phone: u.phone,
      },
    });
    createdUsers[u.email] = row.id;
  }

  const crmRows: Array<{
    name: string;
    kind: string;
    market: string;
    country: string;
    stage: CrmStage;
    clinicId?: string;
    ownerNote: string;
    holdReason?: string;
    activityLine?: string;
    followUpAt?: Date;
  }> = [
    {
      name: "Harbor Wellness",
      kind: "clinic",
      market: "USA",
      country: "United States",
      stage: "REPEAT",
      clinicId: harbor.id,
      ownerNote: "USA physician acquisition — Fort Lauderdale. No patient data.",
    },
    {
      name: "Bethel Medical",
      kind: "clinic",
      market: "INTL",
      country: "Bahamas",
      stage: "STRATEGIC",
      clinicId: bethel.id,
      ownerNote: "Live Bahamas clinic corridor. Sales CRM only — no patient charts.",
    },
    {
      name: "360 Wellness",
      kind: "clinic",
      market: "INTL",
      country: "Barbados",
      stage: "ELIGIBILITY_REVIEW",
      clinicId: wellness360.id,
      ownerNote: "Barbados partner. Clinic account pending admin approval.",
      activityLine: "Eligibility review · waiting on Clint to activate.",
    },
    {
      name: "Rolle Family Practice",
      kind: "clinic",
      market: "INTL",
      country: "Bahamas",
      stage: "FORUM_CONSULT",
      clinicId: rolle.id,
      ownerNote: "Invited to monthly provider forum. 48h follow-up due.",
      activityLine: "Forum/Consult · 48h follow-up waiting on Clint. No patient data.",
      followUpAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      name: "Carolina Lopes Partner Desk",
      kind: "prospect",
      market: "INTL",
      country: "Brazil",
      stage: "DISCOVERY",
      ownerNote: "Brazil partner conversation. Business contact only.",
    },
    {
      name: "Gulf Coast physician group",
      kind: "prospect",
      market: "USA",
      country: "United States",
      stage: "TARGETED",
      ownerNote: "New Orleans / Gulf Coast hub sequence.",
    },
    {
      name: "Freeport infusion suite",
      kind: "prospect",
      market: "INTL",
      country: "Bahamas",
      stage: "CONTACTED",
      ownerNote: "FPO corridor. Hold/lost not applicable.",
    },
    {
      name: "Kingston outpatient",
      kind: "prospect",
      market: "INTL",
      country: "Jamaica",
      stage: "QUALIFIED",
      ownerNote: "Jamaica is next after Gulf Coast stand-up.",
    },
    {
      name: "Paused NOLA consult",
      kind: "prospect",
      market: "USA",
      country: "United States",
      stage: "HOLD",
      holdReason: "Waiting on facility license packet",
      ownerNote: "Do not promise delivery dates. Del owns date commitments.",
    },
  ];

  for (const c of crmRows) {
    await prisma.crmAccount.create({ data: c });
  }

  const ivIntl = await prisma.product.findMany({
    where: { category: "IV", prices: { some: { market: "INTL", label: "SOURCED" } } },
    include: { prices: true },
  });
  const nonRx = await prisma.product.findMany({
    where: { category: "NON_RX" },
    include: { prices: true },
  });

  const pick = (list: typeof ivIntl, i: number) => list[i % list.length];
  let shipSeq = 0;

  async function makeOrder(opts: {
    number: string;
    clinicId: string;
    userId: string;
    status: ClinicOrderStatus;
    items: Array<{ product: (typeof ivIntl)[number]; qty: number; market: "USA" | "INTL" }>;
    withInvoice?: boolean;
    paid?: boolean;
    withManifest?: boolean;
    activityLine?: string;
    shipmentStatus?: ShipmentStatus;
    promisedDate?: Date;
    gatesPending?: boolean;
  }) {
    const lines = opts.items.map((it) => {
      const tier =
        it.product.prices.find(
          (p) => p.market === it.market && it.qty >= p.minQty && it.qty <= p.maxQty,
        ) ?? it.product.prices.find((p) => p.market === it.market);
      return {
        productId: it.product.id,
        qty: it.qty,
        unitPrice: tier?.unitPrice ?? 0,
        priceLabel: tier?.label ?? "DEMO",
      };
    });
    const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

    const order = await prisma.clinicOrder.create({
      data: {
        orderNumber: opts.number,
        clinicId: opts.clinicId,
        userId: opts.userId,
        status: opts.status,
        notes: "Prices include delivery within 7 days to the clinic.",
        activityLine: opts.activityLine,
        promisedDate: opts.promisedDate,
        items: { create: lines },
        events: {
          create: {
            toStatus: opts.status,
            note: opts.activityLine || "Seeded demo order",
            actorId: createdUsers["admin@medstead.demo"],
          },
        },
      },
    });

    if (opts.withInvoice) {
      await prisma.invoice.create({
        data: {
          number: `INV-${opts.number.replace("CO-", "")}`,
          orderId: order.id,
          amount: total,
          paidAmount: opts.paid ? total : 0,
          status: opts.paid ? "paid" : "open",
          dueAt: new Date(Date.now() + 14 * 86400000),
          payments: opts.paid
            ? {
                create: {
                  amount: total,
                  method: "ACH (demo)",
                  online: true,
                  userId: createdUsers["finance@medstead.demo"],
                  note: "Seeded payment — no bank account numbers stored",
                },
              }
            : undefined,
        },
      });
    }

    if (opts.withManifest) {
      await prisma.manifest.create({
        data: {
          number: `MAN-${opts.number.replace("CO-", "")}`,
          orderId: order.id,
          origin: "FLL",
          destination: opts.clinicId === harbor.id ? "FLL" : "NAS",
        },
      });
    }

    const clinic = opts.clinicId === harbor.id ? harbor : opts.clinicId === bethel.id ? bethel : wellness360;
    const dest = clinic.market === "USA" ? "FLL" : "NAS";
    const shipStatus = opts.shipmentStatus ?? CLINIC_DRIVES_SHIPMENT[opts.status];
    const paid = Boolean(opts.paid);
    shipSeq += 1;
    await prisma.shipment.create({
      data: {
        shipmentCode: `MS-20260828-FLL-${dest}-${String(shipSeq).padStart(4, "0")}`,
        status: shipStatus,
        service: "EXPRESS_AIR",
        origin: "FLL",
        destination: dest,
        weightLb: 20,
        pieces: lines.length,
        clinicOrderId: order.id,
        consignee: clinic.name,
        publicClock: publicClockOn(shipStatus),
        promisedDate: opts.promisedDate,
        activityLine: opts.activityLine ?? "Linked at submit · public clock off until release.",
        gates: {
          create: GATES.map((name) => {
            const pendingOps =
              Boolean(opts.gatesPending) &&
              (name === "PACKAGING_QUALITY" || name === "CARRIER_CAPACITY");
            return {
              name,
              state: (pendingOps ? "PENDING" : name === "COMMERCIAL_FINANCE" && !paid ? "PENDING" : "GREEN") as GateState,
              signedById: createdUsers["ops@medstead.demo"],
            };
          }),
        },
      },
    });

    return { order, total };
  }

  const usaIv = pick(ivIntl, 0);
  const usaIv2 = pick(ivIntl, 3);
  const intlIv = pick(ivIntl, 5);
  const intlIv2 = pick(ivIntl, 8);
  const usaDevice = nonRx[0];
  const intlDevice = nonRx[2];

  await makeOrder({
    number: "CO-1001",
    clinicId: harbor.id,
    userId: createdUsers["clinic.admin@medstead.demo"],
    status: "SUBMITTED",
    activityLine: "Clinic submitted order · waiting on admin review.",
    items: [
      { product: usaIv, qty: 4, market: "USA" },
      { product: usaDevice, qty: 100, market: "USA" },
    ],
  });

  await makeOrder({
    number: "CO-1002",
    clinicId: bethel.id,
    userId: createdUsers["doctor@medstead.demo"],
    status: "PAYMENT_PENDING",
    activityLine: "Finance sent invoice · waiting on clinic payment.",
    items: [
      { product: intlIv, qty: 6, market: "INTL" },
      { product: intlDevice, qty: 40, market: "INTL" },
    ],
    withInvoice: true,
  });

  await makeOrder({
    number: "CO-1005",
    clinicId: harbor.id,
    userId: createdUsers["clinic.admin@medstead.demo"],
    status: "APPROVED",
    activityLine: "Admin approved order · waiting on finance to generate invoice.",
    items: [
      { product: usaIv2, qty: 3, market: "USA" },
      { product: usaDevice, qty: 100, market: "USA" },
    ],
  });

  await makeOrder({
    number: "CO-1006",
    clinicId: bethel.id,
    userId: createdUsers["doctor@medstead.demo"],
    status: "PAYMENT_RECEIVED",
    activityLine: "Finance marked paid · waiting on ops to prepare shipment and run gates.",
    items: [
      { product: intlIv, qty: 4, market: "INTL" },
    ],
    withInvoice: true,
    paid: true,
  });

  await makeOrder({
    number: "CO-1003",
    clinicId: bethel.id,
    userId: createdUsers["doctor@medstead.demo"],
    status: "PREPARING_SHIPMENT",
    shipmentStatus: "ORIGIN_RECEIVED_HOLD",
    gatesPending: true,
    items: [
      { product: intlIv2, qty: 2, market: "INTL" },
      { product: pick(ivIntl, 12), qty: 3, market: "INTL" },
    ],
    withInvoice: true,
    paid: true,
    activityLine: "Origin received-hold · waiting on ops packaging / quality gate.",
  });

  await makeOrder({
    number: "CO-1007",
    clinicId: harbor.id,
    userId: createdUsers["clinic.admin@medstead.demo"],
    status: "SHIPPED",
    promisedDate: new Date("2026-09-04"),
    items: [
      { product: usaIv, qty: 2, market: "USA" },
    ],
    withInvoice: true,
    paid: true,
    withManifest: true,
    activityLine: "Ops marked shipped · logistics is In Transit. Confirm in transit next.",
  });

  await makeOrder({
    number: "CO-1004",
    clinicId: harbor.id,
    userId: createdUsers["clinic.admin@medstead.demo"],
    status: "DELIVERED",
    items: [
      { product: usaIv2, qty: 2, market: "USA" },
      { product: nonRx[3], qty: 250, market: "USA" },
    ],
    withInvoice: true,
    paid: true,
    withManifest: true,
    activityLine: "Delivered · record closed.",
  });

  await makeOrder({
    number: "CO-1008",
    clinicId: bethel.id,
    userId: createdUsers["doctor@medstead.demo"],
    status: "MANIFEST_GENERATED",
    promisedDate: new Date("2026-09-05"),
    items: [{ product: intlIv, qty: 2, market: "INTL" }],
    withInvoice: true,
    paid: true,
    withManifest: true,
    activityLine: "Del confirmed the date · Dispatch flight. Doctor does not block cargo.",
  });

  const customerId = createdUsers["customer@medstead.demo"];

  const q1 = await prisma.freightQuote.create({
    data: {
      quoteNumber: "FQ-2401",
      userId: customerId,
      origin: "FLL",
      destination: "NAS",
      service: "EXPRESS_AIR",
      weightLb: 22,
      pieces: 2,
      listAmount: 228.65,
      onlineAmount: 205.79,
      description: "Clinic supply carton — no customs-broker claim",
      status: "APPROVED",
    },
  });

  await prisma.freightQuote.create({
    data: {
      quoteNumber: "FQ-2402",
      userId: customerId,
      origin: "FLL",
      destination: "BGI",
      service: "STANDARD_SEA",
      weightLb: 80,
      pieces: 4,
      listAmount: 241.2,
      onlineAmount: 217.08,
      description: "Standard sea demo quote",
      status: "UNDER_REVIEW",
    },
  });

  async function seedShipment(opts: {
    code: string;
    status: ShipmentStatus;
    service: FreightService;
    origin: string;
    dest: string;
    gatesGreen?: boolean;
    clinicOrderId?: string;
    quoteId?: string;
    publicClock?: boolean;
  }) {
    const shipment = await prisma.shipment.create({
      data: {
        shipmentCode: opts.code,
        status: opts.status,
        service: opts.service,
        origin: opts.origin,
        destination: opts.dest,
        weightLb: 22,
        pieces: 2,
        customerId,
        quoteId: opts.quoteId,
        clinicOrderId: opts.clinicOrderId,
        consignee: opts.clinicOrderId ? "Bethel Medical" : "Marcus Reed",
        description: "Demo freight / clinic movement",
        publicClock: opts.publicClock ?? opts.status !== "SUBMITTED",
        activityLine:
          opts.status === "ORIGIN_RECEIVED_HOLD"
            ? "Origin received-hold · waiting on ops packaging / quality gate."
            : opts.status === "IN_TRANSIT"
              ? "In transit · public clock is on."
              : "Quoted · waiting on later ops steps.",
        events: {
          create: {
            toStatus: opts.status,
            note: "Seeded shipment",
            actorId: createdUsers["ops@medstead.demo"],
          },
        },
        gates: {
          create: GATES.map((name) => {
            const pendingOps =
              !opts.gatesGreen &&
              (name === "PACKAGING_QUALITY" || name === "CARRIER_CAPACITY");
            const state = (
              opts.gatesGreen ? "GREEN" : pendingOps ? "PENDING" : "GREEN"
            ) as GateState;
            return {
              name,
              state,
              signedById:
                name === "COMMERCIAL_FINANCE"
                  ? createdUsers["finance@medstead.demo"]
                  : createdUsers["ops@medstead.demo"],
              note:
                name === "COMMERCIAL_FINANCE"
                  ? "Finance signs payment / credit."
                  : undefined,
            };
          }),
        },
      },
    });
    return shipment;
  }

  await seedShipment({
    code: "MS-20260820-FLL-NAS-0001",
    status: "IN_TRANSIT",
    service: "EXPRESS_AIR",
    origin: "FLL",
    dest: "NAS",
    gatesGreen: true,
    quoteId: q1.id,
    publicClock: true,
  });

  await seedShipment({
    code: "MS-20260825-FLL-BGI-0003",
    status: "QUOTED",
    service: "STANDARD_SEA",
    origin: "FLL",
    dest: "BGI",
    gatesGreen: false,
  });

  await prisma.shipmentSequence.create({ data: { id: "global", lastN: 3 } });

  const pilotId = createdUsers["pilot@medstead.demo"];
  const adminId = createdUsers["admin@medstead.demo"];
  const doctorId = createdUsers["doctor@medstead.demo"];
  const customerUserId = createdUsers["customer@medstead.demo"];

  await prisma.part135Readiness.create({
    data: {
      id: "mtg-airlines",
      operatorName: "MTG Airlines",
      live: false,
      certificateNote:
        "NOT LIVE / FUTURE 135. MTG Airlines is not a certificated Part 135 operator in this app. No certificate number is on file.",
      aircraftNote: "",
      crewNote: "",
      dutyRestNote: "",
      opsSpecsNote: "",
      maintenanceNote: "",
      onDemandCharter: false,
      cargoOps: false,
    },
  });

  // Bolt ops Aircraft page is the source of truth. Exactly these three. Home base stays FLL.
  await prisma.aircraft.createMany({
    data: [
      {
        tailNumber: "N127TX",
        type: "Beechcraft King Air 100",
        name: "Beechcraft King Air 100",
        homeBase: "FLL",
        status: "CURRENT",
        corridors: "FLL_NAS,FLL_FPO",
      },
      {
        tailNumber: "N275RC",
        type: "Cessna 402",
        name: "Cessna 402",
        homeBase: "FLL",
        status: "MX",
        corridors: "FLL_NAS,FLL_FPO",
      },
      {
        tailNumber: "N3710W",
        type: "Piper PA-32",
        name: "Piper PA-32",
        homeBase: "FLL",
        status: "CURRENT",
        corridors: "FLL_NAS,FLL_FPO",
      },
    ],
  });

  await prisma.flight.create({
    data: {
      flightCode: "MTG-A-TRAV-001",
      corridor: "FLL_NAS",
      tripType: "COMPANY_TRAVEL",
      tripStatus: "SCHEDULED",
      live: true,
      phase: "T6_GO_NO_GO",
      goNoGo: "GO",
      origin: "FLL",
      destination: "NAS",
      requestedById: adminId,
      passengerNote: "Hairson + one MedStead seat",
      purpose: "Company / business travel to the Nassau clinic corridor",
      assignedPilotId: pilotId,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: "Company travel scheduled · Del dispatch next. Finance cannot fly.",
    },
  });

  await prisma.flight.create({
    data: {
      flightCode: "MTG-A-PERS-002",
      corridor: "FLL_FPO",
      tripType: "PERSONAL_GOODS",
      tripStatus: "REQUESTED",
      live: true,
      phase: "T48_PREP",
      origin: "FLL",
      destination: "FPO",
      requestedById: customerUserId,
      passengerNote: "Household crate for Marcus Reed",
      purpose: "Personal goods on a company flight — not a clinic supply order",
      assignedPilotId: pilotId,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: "Personal goods request · waiting on Del to schedule. No WhatsApp.",
    },
  });

  await prisma.flight.create({
    data: {
      flightCode: "MTG-A-CHTR-003",
      corridor: "FLL_NAS",
      tripType: "DOCTOR_CHARTER",
      tripStatus: "REQUESTED",
      live: true,
      phase: "T48_PREP",
      origin: "FLL",
      destination: "NAS",
      requestedById: doctorId,
      passengerNote: "Dr. James Bethel — passenger charter",
      purpose: "Charter a flight to a doctor — not a clinic supply order",
      assignedPilotId: pilotId,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine:
        "Doctor charter requested · not a clinic supply order. Waiting on Del to schedule. No WhatsApp.",
    },
  });

  await prisma.flight.create({
    data: {
      flightCode: "MTG-A-RSC-004",
      corridor: "FLL_NAS",
      tripType: "RESCUE_ORGAN",
      tripStatus: "SCHEDULED",
      live: true,
      phase: "T6_GO_NO_GO",
      goNoGo: "GO",
      origin: "FLL",
      destination: "NAS",
      requestedById: adminId,
      passengerNote: "Rescue organ trip — no patient name on this card",
      purpose: "Dispatch of a rescue organ trip. Not an OPO or UNOS claim.",
      timeCritical: true,
      clockStartedAt: new Date(),
      custodyNote: "Chain of custody open · FLL C15 → NAS. In-app only.",
      temperatureNote: "Keep the cold-chain note on this card. In-app only.",
      assignedPilotId: pilotId,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine:
        "TIME-CRITICAL rescue organ trip · Phone intake · Nassau Transfer Desk · routed to Del. Do not re-type. No patient name. Not an OPO or UNOS claim.",
    },
  });

  const rescueFlight = await prisma.flight.findUnique({ where: { flightCode: "MTG-A-RSC-004" } });
  if (rescueFlight) {
    await prisma.callLog.create({
      data: {
        callerName: "Nassau Transfer Desk",
        callerPhone: "+1 242 555 0140",
        callerOrg: "Nassau Transfer Desk",
        callType: "ORGAN_RESCUE",
        origin: "FLL",
        destination: "NAS",
        notes: "Dispatch of a rescue organ trip. Clock on. No patient identifiers.",
        urgency: "ORGAN_CLOCK",
        source: "call_center",
        routedTo: "DEL",
        flightId: rescueFlight.id,
      },
    });
  }

  const phoneCargo = await prisma.flight.create({
    data: {
      flightCode: "FL-FLL-NAS-005",
      corridor: "FLL_NAS",
      tripType: "MEDICAL_CARGO",
      tripStatus: "SCHEDULED",
      live: true,
      phase: "T6_GO_NO_GO",
      goNoGo: "GO",
      origin: "FLL",
      destination: "NAS",
      requestedById: adminId,
      passengerNote: "Phone intake · Freeport Clinic Hub. No patient name.",
      purpose: "Medical cargo from the call center. Del dispatches. Doctor does not block cargo.",
      assignedPilotId: pilotId,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: "Phone intake · Freeport Clinic Hub · +1 242 555 0188 · routed to Del. Do not re-type.",
    },
  });
  await prisma.callLog.create({
    data: {
      callerName: "Freeport Clinic Hub",
      callerPhone: "+1 242 555 0188",
      callerOrg: "Freeport Clinic Hub",
      callType: "MEDICAL_CARGO",
      origin: "FLL",
      destination: "NAS",
      notes: "Carton waiting at FLL. No patient identifiers.",
      urgency: "URGENT",
      source: "call_center",
      routedTo: "DEL",
      flightId: phoneCargo.id,
    },
  });

  const salesId = createdUsers["sales@medstead.demo"];
  const charterFlight = await prisma.flight.findUnique({ where: { flightCode: "MTG-A-CHTR-003" } });

  const harborSales = await prisma.salesAccount.create({
    data: {
      name: "Harbor Wellness",
      kind: "CLINIC",
      stage: "ACTIVE",
      market: "USA",
      country: "United States",
      ownerId: salesId,
      clinicId: harbor.id,
      lastTouchAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 10 * 86400000),
      activityLine: "Active clinic. Orders land on this timeline. No revenue totals.",
    },
  });
  await prisma.salesFollowUp.create({
    data: {
      accountId: harborSales.id,
      dueAt: new Date(Date.now() + 10 * 86400000),
      kind: "follow_up",
      note: "Check repeat volume after the next shop.",
    },
  });
  await prisma.salesActivity.create({
    data: {
      accountId: harborSales.id,
      kind: "note",
      title: "Account opened",
      body: "Linked to live Harbor orders. Sales owns the conversation.",
    },
  });

  const bethelSales = await prisma.salesAccount.create({
    data: {
      name: "Bethel Medical",
      kind: "DOCTOR",
      stage: "ACTIVE",
      market: "INTL",
      country: "Bahamas",
      ownerId: salesId,
      clinicId: bethel.id,
      lastTouchAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 12 * 86400000),
      activityLine: "Doctor charter is on the air board. Sales sees dispatch here.",
    },
  });
  if (charterFlight) {
    await prisma.salesEvent.create({
      data: {
        accountId: bethelSales.id,
        ownerId: salesId,
        kind: "DOCTOR_CHARTER_DAY",
        title: "Bethel charter day",
        occursAt: new Date("2026-09-12T16:00:00.000Z"),
        status: "BOOKED",
        handedTo: "DEL",
        flightId: charterFlight.id,
        activityLine: "Linked to MTG-A-CHTR-003. Del owns schedule.",
      },
    });
    await prisma.salesActivity.create({
      data: {
        accountId: bethelSales.id,
        kind: "flight",
        title: charterFlight.flightCode,
        body: "Doctor charter requested. When Del dispatches, it stays on this feed.",
        href: "/app/flights",
      },
    });
  }

  const coral = await prisma.salesAccount.create({
    data: {
      name: "Coral Charter desk",
      kind: "CHARTER",
      stage: "TALKING",
      market: "INTL",
      country: "Bahamas",
      ownerId: salesId,
      nextFollowUpAt: new Date(Date.now() + 2 * 86400000),
      activityLine: "Talking · book dinner or a doctor charter day next.",
    },
  });
  await prisma.salesFollowUp.create({
    data: {
      accountId: coral.id,
      dueAt: new Date(Date.now() + 2 * 86400000),
      kind: "book_event",
      note: "Book the first event.",
    },
  });

  const warehouseSales = await prisma.salesAccount.create({
    data: {
      name: "Marcus Reed · C15 forwarder",
      kind: "WAREHOUSE",
      stage: "BOOKED",
      market: "USA",
      country: "United States",
      ownerId: salesId,
      customerId: customerUserId,
      lastTouchAt: new Date(),
      nextFollowUpAt: new Date("2026-09-08T16:00:00.000Z"),
      activityLine: "Warehouse tour booked · handed to Chris. No WhatsApp.",
    },
  });
  await prisma.salesEvent.create({
    data: {
      accountId: warehouseSales.id,
      ownerId: salesId,
      kind: "WAREHOUSE_TOUR",
      title: "C15 walk-through",
      occursAt: new Date("2026-09-08T16:00:00.000Z"),
      status: "BOOKED",
      handedTo: "OPS",
      activityLine: "Sales booked this visit. Chris marks it done.",
    },
  });

  const quietClinic = await prisma.salesAccount.create({
    data: {
      name: "360 Wellness",
      kind: "CLINIC",
      stage: "ACTIVE",
      market: "INTL",
      country: "Barbados",
      ownerId: salesId,
      clinicId: wellness360.id,
      nextFollowUpAt: new Date(Date.now() - 2 * 86400000),
      activityLine: "Gone quiet — no clinic order yet. Log the follow-up.",
    },
  });
  await prisma.salesFollowUp.create({
    data: {
      accountId: quietClinic.id,
      dueAt: new Date(Date.now() - 2 * 86400000),
      kind: "follow_up",
      note: "Pharmacy seat still pending admin. Stay on them in-app.",
    },
  });

  const rolleSales = await prisma.salesAccount.create({
    data: {
      name: "Rolle Family Practice",
      kind: "DOCTOR",
      stage: "PROSPECT",
      market: "INTL",
      country: "Bahamas",
      ownerId: salesId,
      clinicId: rolle.id,
      nextFollowUpAt: new Date(Date.now() + 4 * 86400000),
      activityLine: "Prospect · first conversation after Clint’s forum follow-up.",
    },
  });
  await prisma.salesFollowUp.create({
    data: {
      accountId: rolleSales.id,
      dueAt: new Date(Date.now() + 4 * 86400000),
      kind: "follow_up",
      note: "Open the first conversation. Admin eligibility is a different desk.",
    },
  });

  const gulf = await prisma.salesAccount.create({
    data: {
      name: "Gulf Coast physician group",
      kind: "CLINIC",
      stage: "EVENT_SET",
      market: "USA",
      country: "United States",
      ownerId: salesId,
      nextFollowUpAt: new Date("2026-09-18T16:00:00.000Z"),
      activityLine: "Conference set. MSY corridor is not live — do not promise a flight.",
    },
  });
  await prisma.salesEvent.create({
    data: {
      accountId: gulf.id,
      ownerId: salesId,
      kind: "CONFERENCE",
      title: "Gulf Coast provider dinner",
      occursAt: new Date("2026-09-18T16:00:00.000Z"),
      status: "BOOKED",
      activityLine: "Event set · sales owns the room. No flight promise.",
    },
  });

  const ivCount = await prisma.product.count({ where: { category: "IV" } });
  const supplyCount = await prisma.product.count({ where: { category: "SUPPLIES" } });
  const nonRxCount = await prisma.product.count({ where: { category: "NON_RX" } });

  const forbidden = [
    "semaglutide",
    "tirzepatide",
    "retatrutide",
    "lilly",
    "incretin",
    "glp-1",
    "peptide",
    "testosterone",
    "ivermectin",
    "oxytocin",
    "ketamine",
    "clomiphene",
    "tesofensine",
    "fenbendazole",
    "fenbenzadol",
    "metformin",
    "wayne gray",
    "meadstead",
  ];
  const allProducts = await prisma.product.findMany();
  const allUsers = await prisma.user.findMany();
  const haystack = [...allProducts, ...allUsers]
    .map((row) => JSON.stringify(row).toLowerCase())
    .join("\n");
  const hit = forbidden.find((term) => haystack.includes(term));
  if (hit) {
    throw new Error(`Seed included forbidden term: ${hit}`);
  }
  if (legal.length < 40) {
    throw new Error(`Expected 40+ legal IV/supply rows, parsed ${legal.length}`);
  }

  const fleet = await prisma.aircraft.findMany({ orderBy: { tailNumber: "asc" } });
  const expectedTails = ["N127TX", "N275RC", "N3710W"];
  const tails = fleet.map((a) => a.tailNumber);
  if (fleet.length !== 3 || expectedTails.some((t) => !tails.includes(t))) {
    throw new Error(`Current fleet must be exactly ${expectedTails.join(", ")}. Got ${tails.join(", ") || "none"}.`);
  }
  const n275 = fleet.find((a) => a.tailNumber === "N275RC");
  if (n275?.status !== "MX") {
    throw new Error("N275RC must be MX on the operating fleet.");
  }
  if (fleet.some((a) => /flying club|pompano|islander/i.test(`${a.name} ${a.type ?? ""}`))) {
    throw new Error("Do not seed Pompano Beach Flying Club or Islander tails.");
  }
  const airNotes = await prisma.flight.findMany({ select: { aircraftNote: true, flightCode: true } });
  const badNote = airNotes.find(
    (f) => /tbd|hairson fills|placeholder|future 135/i.test(f.aircraftNote ?? ""),
  );
  if (badNote) {
    throw new Error(`Flight ${badNote.flightCode} used a placeholder aircraft note.`);
  }

  const matias = await prisma.payee.create({
    data: { displayName: "Matias" },
  });
  const murph = await prisma.payee.create({
    data: {
      displayName: "Derrick Murphy (Murph)",
      roleLabel: "Director of Corporate Strategy / Communications",
    },
  });

  const matiasDates = [
    "2026-09-01",
    "2026-09-15",
    "2026-10-01",
    "2026-10-15",
    "2026-11-01",
    "2026-11-15",
    "2026-12-01",
    "2026-12-15",
  ];
  for (const day of matiasDates) {
    await prisma.scheduledPay.create({
      data: {
        payeeId: matias.id,
        payingEntity: PAYING_ENTITY,
        amount: 1500,
        currency: "USD",
        dueAt: new Date(`${day}T12:00:00.000Z`),
        method: PAY_METHOD_ZELLE,
        status: "SCHEDULED",
        recurring: true,
        note: "Recurring 1st and 15th. Scheduled / not sent.",
      },
    });
  }
  await prisma.scheduledPay.create({
    data: {
      payeeId: murph.id,
      payingEntity: PAYING_ENTITY,
      amount: 3500,
      currency: "USD",
      dueAt: new Date("2026-09-05T12:00:00.000Z"),
      method: PAY_METHOD_ZELLE,
      status: "SCHEDULED",
      recurring: false,
      note: "Pay date to track. Scheduled / not sent.",
    },
  });

  const wayne = await prisma.payee.create({
    data: { displayName: "Wayne" },
  });
  await prisma.scheduledPay.create({
    data: {
      payeeId: wayne.id,
      payingEntity: PAYING_ENTITY,
      amount: 5890,
      currency: "USD",
      dueAt: new Date("2026-08-28T12:00:00.000Z"),
      method: PAY_METHOD_ZELLE,
      status: "SCHEDULED",
      recurring: false,
      invoiceNumber: "MS-2026-0828-W",
      note: "Due upon receipt. In-person close planned Sep 1–3 2026. Hairson emailed the PDF. Do not treat that as paid. Scheduled / not sent.",
    },
  });

  const userCount = await prisma.user.count();
  console.log(
    `Seeded ${ivCount} IV, ${supplyCount} supplies, ${nonRxCount} DEMO Non-RX, ${userCount} users, clinics + CRM + sales desk + orders + payroll dates + Wayne payable + current fleet N127TX/N275RC/N3710W + MTG Airlines trips.`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
