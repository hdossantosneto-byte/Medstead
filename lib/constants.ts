import type {
  ClinicOrderStatus,
  CrmStage,
  FreightService,
  GateName,
  PriceMarket,
  ProductCategory,
  Role,
  ShipmentStatus,
} from "@prisma/client";

export const BRAND = "MedStead";
export const BRAND_TRANSPORT = "MedStead Transport";
export const TAGLINE = "FASTER ACCESS. BETTER CARE.";
export const PUBLIC_LINE =
  "We specialize in moving medicine and supplies to communities other carriers struggle to reach.";
export const MISSION =
  "Our mission is to ensure every community has access to the health care it deserves.";
export const PLATFORM_LINE = "One relationship. One coordinated platform.";
export const CONTACT_ORDERS = "Orders@medsteadgroup.com";

/** Live freight app. Marketing CTAs link here; do not redirect this site away. */
export const APP_ORIGIN = "https://go.medsteadtransport.com";
export const APP_GET_STARTED = APP_ORIGIN;
export const APP_QUOTE = APP_ORIGIN;
export const APP_TRACK = APP_ORIGIN;

export const MARKETING_EYEBROW = "Medical transport for hard-to-reach destinations";
export const MARKETING_H1 = "Faster access. Better care.";

/** Finance books only. Do not print on the public site. */
export const PAYING_ENTITY = "MEDSTEAD LLC";
export const PAY_METHOD_ZELLE = "Zelle · Chase ••9696 · MEDSTEAD LLC";
export const ADP_BANNER = "ADP setup — not live. Pay is Zelle until ADP is live.";

export const WAREHOUSE = {
  name: "WareSpace – MedStead",
  unit: "C15",
  street: "700 NW 57th Ct, Unit C15",
  city: "Fort Lauderdale",
  state: "FL",
  zip: "33309",
  line: "WareSpace – MedStead, 700 NW 57th Ct, Unit C15, Fort Lauderdale, FL 33309",
};

export const HUBS = {
  active: [
    { code: "FLL", name: "Fort Lauderdale", note: "Primary warehouse & ops hub" },
    { code: "MIA", name: "Miami", note: "Served from Fort Lauderdale" },
    { code: "NAS", name: "Nassau", note: "Active clinic corridor" },
    { code: "FPO", name: "Freeport", note: "Active clinic corridor" },
  ],
  next: [
    { code: "MSY", name: "Gulf Coast / New Orleans", note: "Next hub" },
    { code: "KIN", name: "Jamaica", note: "Then Jamaica" },
    { code: "CAR", name: "Wider Caribbean", note: "Expansion" },
  ],
};

export const DEMO_PASSWORD = "demo1234";

export const ROLE_LABEL: Record<Role, string> = {
  PUBLIC: "Public",
  CUSTOMER: "Customer",
  CLINIC_ADMIN: "Clinic admin",
  DOCTOR: "Doctor",
  PHARMACY: "Pharmacy",
  MEDSTEAD_ADMIN: "MedStead admin",
  OPS: "Medication operations",
  FINANCE: "Finance",
  PILOT: "Pilot",
  SALES: "Sales",
};

export const CLINIC_ROLES: Role[] = ["CLINIC_ADMIN", "DOCTOR", "PHARMACY"];

export const CLINIC_ORDER_STATUSES: ClinicOrderStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "INVOICE_GENERATED",
  "PAYMENT_PENDING",
  "PAYMENT_RECEIVED",
  "PREPARING_SHIPMENT",
  "MANIFEST_GENERATED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
];

export const CLINIC_ORDER_LABEL: Record<ClinicOrderStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  INVOICE_GENERATED: "Invoice Generated",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_RECEIVED: "Payment Received",
  PREPARING_SHIPMENT: "Preparing Shipment",
  MANIFEST_GENERATED: "Manifest Generated",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
};

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "SUBMITTED",
  "COMPLIANCE_REVIEW",
  "QUOTED",
  "APPROVED_PAID",
  "AWAITING_SUPPLIER",
  "ORIGIN_RECEIVED_HOLD",
  "RELEASED_MANIFESTED",
  "IN_TRANSIT",
  "CUSTOMS_HOLD_RELEASED",
  "DESTINATION_RECEIVED",
  "DELIVERED_CLOSED",
];

export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  SUBMITTED: "Submitted",
  COMPLIANCE_REVIEW: "Compliance Review",
  QUOTED: "Quoted",
  APPROVED_PAID: "Approved/Paid",
  AWAITING_SUPPLIER: "Awaiting Supplier",
  ORIGIN_RECEIVED_HOLD: "Origin Received-Hold",
  RELEASED_MANIFESTED: "Released/Manifested",
  IN_TRANSIT: "In Transit",
  CUSTOMS_HOLD_RELEASED: "Customs Hold/Released",
  DESTINATION_RECEIVED: "Destination Received",
  DELIVERED_CLOSED: "Delivered/Closed",
};

export const CRM_STAGES: CrmStage[] = [
  "TARGETED",
  "CONTACTED",
  "DISCOVERY",
  "QUALIFIED",
  "FORUM_CONSULT",
  "ELIGIBILITY_REVIEW",
  "ACTIVATED",
  "FIRST_SERVICE",
  "REPEAT",
  "STRATEGIC",
  "HOLD",
  "LOST",
];

export const CRM_LABEL: Record<CrmStage, string> = {
  TARGETED: "Targeted",
  CONTACTED: "Contacted",
  DISCOVERY: "Discovery",
  QUALIFIED: "Qualified",
  FORUM_CONSULT: "Forum/Consult",
  ELIGIBILITY_REVIEW: "Eligibility review",
  ACTIVATED: "Activated",
  FIRST_SERVICE: "First service",
  REPEAT: "Repeat",
  STRATEGIC: "Strategic",
  HOLD: "Hold",
  LOST: "Lost",
};

export const GATE_ORDER: GateName[] = [
  "CUSTOMER_CONSIGNEE",
  "PRODUCT_SOURCE",
  "COMMERCIAL_FINANCE",
  "EXPORT_IMPORT",
  "PACKAGING_QUALITY",
  "CARRIER_CAPACITY",
];

export const GATE_LABEL: Record<GateName, string> = {
  CUSTOMER_CONSIGNEE: "Customer / consignee",
  PRODUCT_SOURCE: "Product / source",
  COMMERCIAL_FINANCE: "Commercial / finance",
  EXPORT_IMPORT: "Export / import",
  PACKAGING_QUALITY: "Packaging / quality",
  CARRIER_CAPACITY: "Carrier / capacity",
};

export const SERVICE_LABEL: Record<FreightService, string> = {
  EXPRESS_AIR: "Express Air",
  STANDARD_SEA: "Standard Sea",
};

export const CORRIDOR_LABEL: Record<string, string> = {
  FLL_NAS: "FLL → Nassau",
  FLL_FPO: "FLL → Freeport",
  FLL_MSY: "FLL → New Orleans",
};

export const CORRIDOR_LIVE: Record<string, boolean> = {
  FLL_NAS: true,
  FLL_FPO: true,
  FLL_MSY: false,
};

export const FLIGHT_PHASE_LABEL: Record<string, string> = {
  T48_PREP: "T-48 prep",
  T24_FREEZE: "T-24 freeze manifest",
  T6_GO_NO_GO: "T-6 go / no-go",
  TENDER: "Tender",
  DEPARTED: "Departed",
  ARRIVED: "Arrived",
  CUSTOMS: "Customs",
  POD: "Proof of delivery",
};

export const SERVICE_WINDOW: Record<FreightService, string> = {
  EXPRESS_AIR: "3–5 days after release",
  STANDARD_SEA: "5–7 days after release",
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  RX: "RX",
  NON_RX: "Non-RX",
  IV: "IV",
  SUPPLIES: "Supplies",
};

export const MARKET_LABEL: Record<PriceMarket, string> = {
  USA: "USA domestic",
  INTL: "International",
};

export const USA_NONRX_BREAKS = [
  { minQty: 100, maxQty: 249 },
  { minQty: 250, maxQty: 499 },
  { minQty: 500, maxQty: 999 },
  { minQty: 1000, maxQty: 4999 },
  { minQty: 5000, maxQty: 9999 },
  { minQty: 10000, maxQty: 999999 },
] as const;

export const INTL_NONRX_BREAKS = [
  { minQty: 20, maxQty: 50 },
  { minQty: 51, maxQty: 99 },
  { minQty: 100, maxQty: 149 },
  { minQty: 150, maxQty: 200 },
  { minQty: 201, maxQty: 250 },
  { minQty: 250, maxQty: 500 },
] as const;

export const ONLINE_PAY_DISCOUNT = 0.1;
export const WELCOME_POINTS = 100;
export const POINTS_PER_DOLLAR = 1;

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  UNDER_REVIEW: "Quote under review",
  APPROVED: "Approved",
};

export const AIR_ARM = "MTG Airlines";
export const PART135_BANNER =
  "NOT LIVE / FUTURE 135. MTG Airlines is not a certificated Part 135 operator in this app. No certificate number is on file. Hairson fills aircraft, crew, duty/rest, ops specs, and maintenance later.";

export const TRIP_TYPE_LABEL: Record<string, string> = {
  MEDICAL_CARGO: "Medical cargo",
  COMPANY_TRAVEL: "Company travel",
  PERSONAL_GOODS: "Personal goods",
  DOCTOR_CHARTER: "Doctor charter",
  RESCUE_ORGAN: "Rescue / organ trip",
};

export const OS_ARMS = [
  {
    href: "/app/flights",
    title: "MTG Airlines",
    body: "Dispatch airline. Cargo, travel, charter, rescue organ trips. Del owns the board.",
  },
  {
    href: "/app/orders",
    title: "3PL for meds",
    body: "Clinic shop, WareSpace C15, Orders & Packages, six-gate release.",
  },
  {
    href: "/app/finance",
    title: "Accounting",
    body: "Invoices, paid/credit, Zelle payees. Finance owns the books.",
  },
  {
    href: "/app/admin",
    title: "Company management",
    body: "CRM, roles, clinic approvals, next-action queues. One login.",
  },
] as const;

export const SALES_STAGE_LABEL: Record<string, string> = {
  PROSPECT: "Prospect",
  TALKING: "Talking",
  EVENT_SET: "Event set",
  BOOKED: "Booked",
  ACTIVE: "Active",
};

export const SALES_KIND_LABEL: Record<string, string> = {
  CLINIC: "Clinic",
  DOCTOR: "Doctor",
  WAREHOUSE: "3PL / warehouse",
  CHARTER: "Charter / travel",
};

export const SALES_EVENT_LABEL: Record<string, string> = {
  DINNER: "Dinner",
  SITE_VISIT: "Site visit",
  WAREHOUSE_TOUR: "Warehouse tour",
  CONFERENCE: "Conference",
  DOCTOR_CHARTER_DAY: "Doctor charter day",
};

export const AIR_TRIP_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  SCHEDULED: "Scheduled",
  DISPATCHED: "Dispatched",
  COMPLETE: "Complete",
  HOLD: "Hold",
};

export const AIRCRAFT_ROUTING = [
  { kind: "Medical cargo", route: "FLL–NAS / FLL–FPO · Del dispatch" },
  { kind: "Company travel", route: "MTG Airlines air arm · Del dispatch" },
  { kind: "Personal goods", route: "On a company or chartered flight" },
  { kind: "Doctor charter", route: "Passenger charter · not a clinic supply order" },
  { kind: "Rescue / organ trip", route: "Time-critical dispatch · not an OPO / UNOS claim" },
] as const;

export const CUSTODY_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  COMPLIANCE_REVIEW: "Compliance review",
  QUOTED: "Quoted",
  APPROVED_PAID: "Approved / paid",
  AWAITING_SUPPLIER: "Awaiting supplier",
  ORIGIN_RECEIVED_HOLD: "Received C15",
  RELEASED_MANIFESTED: "Manifested",
  IN_TRANSIT: "Tendered / in transit",
  CUSTOMS_HOLD_RELEASED: "Customs",
  DESTINATION_RECEIVED: "Arrived",
  DELIVERED_CLOSED: "POD",
  TENDER: "Tendered",
  DEPARTED: "Departed",
  ARRIVED: "Arrived",
  CUSTOMS: "Customs",
  POD: "POD",
};

export const DESTINATIONS = [
  { code: "NAS", name: "Nassau, Bahamas" },
  { code: "FPO", name: "Freeport, Bahamas" },
  { code: "MIA", name: "Miami, USA" },
  { code: "FLL", name: "Fort Lauderdale, USA" },
  { code: "BGI", name: "Bridgetown, Barbados" },
  { code: "KIN", name: "Kingston, Jamaica" },
  { code: "GRU", name: "São Paulo, Brazil" },
  { code: "MSY", name: "New Orleans, USA" },
];

export const FORBIDDEN_SKU_TERMS = [
  "semaglutide",
  "tirzepatide",
  "retatrutide",
  "lilly",
  "incretin",
  "glp-1",
  "glp1",
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
  "estrogen",
  "estriol",
  "estradiol",
  "bi-est",
  "biest",
  "progesterone",
  "dhea",
  "hormone",
];
