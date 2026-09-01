/**
 * One-shot Bolt Transport → freight storefront importer.
 *
 *   npx tsx scripts/import-bolt-transport.ts              # dry-run (default, no DB writes)
 *   npx tsx scripts/import-bolt-transport.ts --apply      # upsert User / Booking / TrackingEvent
 *
 * Reads CSVs from IMPORT_DIR (default ./import-data). See docs/BOLT_TRANSPORT_IMPORT.md.
 *
 * Password hashes: bcrypt of a discarded random token. These are placeholders so Prisma
 * can persist User rows — they are NOT Bolt password hashes. Imported customers cannot
 * sign in with their Bolt password; issue a new password (no self-serve reset in v1).
 *
 * Invoice / pay-later is never rewritten. Stripe keys are never invented.
 *
 * Status map (Bolt-ish labels → Booking.status):
 *   requested|submitted|pending|new|quoted|quote → REQUESTED
 *   confirmed|approved|accepted                 → CONFIRMED
 *   invoice|invoiced|invoice_issued             → INVOICE_ISSUED
 *   paid|payment_received                       → PAID
 *   received|warehouse|origin_received          → RECEIVED
 *   in_transit|shipped|departed|in transit      → IN_TRANSIT
 *   customs|customs_hold                        → CUSTOMS
 *   ready|ready_pickup|ready_for_pickup         → READY_PICKUP
 *   delivered|completed|closed                  → DELIVERED
 *   (unknown → REQUESTED, flagged)
 *
 * Service map (shipping_method → Booking.service):
 *   air|express|express_air|plane               → EXPRESS_AIR
 *   sea|ocean|standard_sea|boat                 → STANDARD_SEA
 *   medical|remote|medical_remote               → MEDICAL_REMOTE
 *   (unknown → EXPRESS_AIR, flagged)
 *
 * Booking codes: Bolt tracking_number is stored as-is on Booking.bookingCode
 * (String @unique). SEA-MTG / other Bolt trackers are not rewritten to MS-….
 */

import { randomBytes } from "crypto";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DESTINATIONS, FORBIDDEN_CARGO_TERMS, ORIGINS, WAREHOUSE } from "../lib/constants";

const FREIGHT_FILES = ["customers.csv", "shipments.csv", "quotes.csv"] as const;
const CANONICAL_CLINIC_FILES = ["clinic_accounts.csv", "clinic_orders.csv"] as const;
const EMPLOYEES_FILE = "employees.csv";

type SkipTally = { file: string; rows: number; present: boolean; kind: "clinic" | "employees" | "other" };

const ADMIN_ROLES = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "medstead_admin",
  "owner",
  "staff",
  "employee",
  "ops",
  "finance",
  "clinic_admin",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_MAP: Record<string, string> = {
  requested: "REQUESTED",
  submitted: "REQUESTED",
  pending: "REQUESTED",
  new: "REQUESTED",
  quoted: "REQUESTED",
  quote: "REQUESTED",
  draft: "REQUESTED",
  confirmed: "CONFIRMED",
  approved: "CONFIRMED",
  accepted: "CONFIRMED",
  invoice: "INVOICE_ISSUED",
  invoiced: "INVOICE_ISSUED",
  invoice_issued: "INVOICE_ISSUED",
  invoice_generated: "INVOICE_ISSUED",
  paid: "PAID",
  payment_received: "PAID",
  payment_pending: "INVOICE_ISSUED",
  received: "RECEIVED",
  warehouse: "RECEIVED",
  origin_received: "RECEIVED",
  preparing: "RECEIVED",
  in_transit: "IN_TRANSIT",
  intransit: "IN_TRANSIT",
  shipped: "IN_TRANSIT",
  departed: "IN_TRANSIT",
  manifested: "IN_TRANSIT",
  customs: "CUSTOMS",
  customs_hold: "CUSTOMS",
  customs_released: "CUSTOMS",
  ready: "READY_PICKUP",
  ready_pickup: "READY_PICKUP",
  ready_for_pickup: "READY_PICKUP",
  delivered: "DELIVERED",
  completed: "DELIVERED",
  closed: "DELIVERED",
};

const SERVICE_MAP: Record<string, string> = {
  air: "EXPRESS_AIR",
  express: "EXPRESS_AIR",
  express_air: "EXPRESS_AIR",
  plane: "EXPRESS_AIR",
  flight: "EXPRESS_AIR",
  sea: "STANDARD_SEA",
  ocean: "STANDARD_SEA",
  standard_sea: "STANDARD_SEA",
  boat: "STANDARD_SEA",
  vessel: "STANDARD_SEA",
  medical: "MEDICAL_REMOTE",
  remote: "MEDICAL_REMOTE",
  medical_remote: "MEDICAL_REMOTE",
};

type Row = Record<string, string>;
type Mode = "dry-run" | "apply";

type PlannedUser = {
  id?: string;
  boltId: string;
  email: string;
  name: string;
  phone: string | null;
};

type PlannedBooking = {
  bookingCode: string;
  userBoltId: string | null;
  userEmail: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  originMode: string;
  originLabel: string;
  originCode: string;
  originAddress: string | null;
  originCity: string;
  originRegion: string | null;
  originCountry: string;
  destLabel: string;
  destCode: string;
  destAddress: string | null;
  destCity: string;
  destRegion: string | null;
  destCountry: string;
  pickupPoint: string;
  service: string;
  cargoDescription: string;
  weightLb: number;
  pieces: number;
  readyDate: string;
  status: string;
  estimateUsd: number;
  notes: string;
  eventNote: string;
  source: "shipment" | "quote";
};

type Flag = { file: string; row: number; reason: string };

function loadDotEnv() {
  for (const name of [".env", ".env.local"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

function parseArgs(argv: string[]) {
  let apply = false;
  let dir = process.env.IMPORT_DIR || resolve(process.cwd(), "import-data");
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--apply") apply = true;
    else if (arg === "--dry-run") apply = false;
    else if (arg.startsWith("--dir=")) dir = resolve(arg.slice("--dir=".length));
    else if (arg === "--dir") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        console.error("--dir requires a path");
        process.exit(2);
      }
      dir = resolve(next);
      i += 1;
    } else {
      console.error(`Unknown flag: ${arg}`);
      process.exit(2);
    }
  }
  // Default dry-run. If both flags are passed, --dry-run wins (no writes).
  const mode: Mode = apply && !argv.includes("--dry-run") ? "apply" : "dry-run";
  return { mode, dir, help };
}

function usage() {
  console.log(`Bolt Transport CSV import (freight staging only)

Usage:
  npx tsx scripts/import-bolt-transport.ts [--dry-run] [--dir PATH]
  npx tsx scripts/import-bolt-transport.ts --apply [--dir PATH]

--dry-run   Default. Parse and report. Never writes to the database.
--apply     Upsert User, Booking, and TrackingEvent only.
--dir PATH  Override IMPORT_DIR (default ./import-data).

Reads customers.csv, shipments.csv, quotes.csv when present.
Skips clinic_accounts.csv, clinic_orders.csv, employees.csv (logged).
`);
}

function normalizeHeader(h: string) {
  return h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((cells) => {
    const obj: Row = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      obj[h] = (cells[idx] ?? "").trim();
    });
    return obj;
  });
}

function pick(row: Row, aliases: string[]): string {
  for (const key of aliases) {
    const v = row[key];
    if (v) return v;
  }
  return "";
}

function normKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isUuid(value: string) {
  return UUID_RE.test(value.trim());
}

function looksAdmin(row: Row) {
  const role = normKey(pick(row, ["role", "user_role", "account_type", "type"]));
  if (role && ADMIN_ROLES.has(role)) return true;
  if (role.includes("admin") || role.includes("staff")) return true;
  const email = pick(row, ["email", "email_address"]).toLowerCase();
  if (email.startsWith("admin@") || email.includes("+admin@")) return true;
  return false;
}

function forbiddenCargo(text: string) {
  const hay = text.toLowerCase();
  return FORBIDDEN_CARGO_TERMS.find((term) => hay.includes(term)) ?? null;
}

function mapStatus(raw: string): { status: string; unmapped: boolean } {
  const key = normKey(raw);
  if (!key) return { status: "REQUESTED", unmapped: false };
  if (STATUS_MAP[key]) return { status: STATUS_MAP[key], unmapped: false };
  return { status: "REQUESTED", unmapped: true };
}

function mapService(raw: string): { service: string; unmapped: boolean } {
  const key = normKey(raw);
  if (!key) return { service: "EXPRESS_AIR", unmapped: false };
  if (SERVICE_MAP[key]) return { service: SERVICE_MAP[key], unmapped: false };
  if (key.includes("sea") || key.includes("ocean")) return { service: "STANDARD_SEA", unmapped: false };
  if (key.includes("medical") || key.includes("remote")) return { service: "MEDICAL_REMOTE", unmapped: false };
  if (key.includes("air") || key.includes("express") || key.includes("plane")) {
    return { service: "EXPRESS_AIR", unmapped: false };
  }
  return { service: "EXPRESS_AIR", unmapped: true };
}

function matchPlace(
  raw: string,
  table: readonly { code: string; name: string; city: string; region: string; country: string }[],
) {
  const t = raw.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  const lower = t.toLowerCase();
  return (
    table.find((p) => p.code === upper) ||
    table.find((p) => p.city.toLowerCase() === lower) ||
    table.find((p) => p.name.toLowerCase() === lower) ||
    table.find((p) => lower.includes(p.city.toLowerCase()) && p.city) ||
    table.find((p) => lower.includes(p.code.toLowerCase())) ||
    null
  );
}

function parsePlace(
  raw: string,
  codeHint: string,
  cityHint: string,
  countryHint: string,
  table: readonly { code: string; name: string; city: string; region: string; country: string }[],
  fallback: { code: string; label: string; city: string; region: string | null; country: string },
) {
  const hit = matchPlace(codeHint, table) || matchPlace(raw, table) || matchPlace(cityHint, table);
  if (hit) {
    return {
      code: hit.code,
      label: hit.name,
      city: hit.city || cityHint || fallback.city,
      region: hit.region || null,
      country: hit.country || countryHint || fallback.country,
    };
  }
  const city = cityHint || raw.split(",")[0]?.trim() || fallback.city;
  const country = countryHint || raw.split(",").slice(1).join(",").trim() || fallback.country;
  return {
    code: (codeHint || fallback.code).replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8) || fallback.code,
    label: raw || `${city}, ${country}`,
    city: city || fallback.city,
    region: fallback.region,
    country: country || fallback.country,
  };
}

function pickupFor(destCode: string, destAddress: string | null) {
  if (destCode === "NAS") return "NASSAU";
  if (destCode === "FPO") return "FREEPORT";
  if (destAddress) return "ADDRESS";
  return "ADDRESS";
}

function num(raw: string, fallback: number) {
  const n = Number(String(raw).replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function dateOnly(raw: string) {
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = Date.parse(raw);
  if (!Number.isNaN(d)) return new Date(d).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function emailOf(value: string) {
  const e = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : "";
}

function skipName(name: string) {
  return /wayne\s+gray/i.test(name);
}

function readCsvIfPresent(dir: string, file: string): Row[] | null {
  const path = join(dir, file);
  if (!existsSync(path)) return null;
  return parseCsv(readFileSync(path, "utf8"));
}

function planCustomers(rows: Row[], flags: Flag[]) {
  const users: PlannedUser[] = [];
  const byBoltId = new Map<string, PlannedUser>();
  const byEmail = new Map<string, PlannedUser>();

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const boltId = pick(row, ["id", "customer_id", "uuid", "user_id"]);
    const email = emailOf(pick(row, ["email", "email_address"]));
    const name = pick(row, ["full_name", "name", "customer_name", "display_name"]) || email.split("@")[0] || "";
    const phone = pick(row, ["phone", "phone_number", "mobile", "tel"]) || null;

    if (looksAdmin(row)) {
      flags.push({ file: "customers.csv", row: line, reason: `skipped admin-like role/email (${pick(row, ["role", "user_role", "email"]) || "admin"})` });
      return;
    }
    if (skipName(name)) {
      flags.push({ file: "customers.csv", row: line, reason: "skipped excluded name" });
      return;
    }
    if (!email) {
      flags.push({ file: "customers.csv", row: line, reason: "skipped: missing email" });
      return;
    }
    if (byEmail.has(email)) {
      flags.push({ file: "customers.csv", row: line, reason: `skipped duplicate email ${email}` });
      return;
    }

    const planned: PlannedUser = {
      id: isUuid(boltId) ? boltId.trim() : undefined,
      boltId: boltId || email,
      email,
      name: name.slice(0, 80) || email,
      phone: phone ? phone.slice(0, 40) : null,
    };
    users.push(planned);
    byEmail.set(email, planned);
    if (planned.boltId) byBoltId.set(planned.boltId, planned);
  });

  return { users, byBoltId, byEmail };
}

function planShipmentRow(
  row: Row,
  line: number,
  file: "shipments.csv" | "quotes.csv",
  source: "shipment" | "quote",
  flags: Flag[],
): PlannedBooking | null {
  const tracking = pick(row, [
    "tracking_number",
    "tracking",
    "tracking_id",
    "tracking_code",
    "booking_code",
    "shipment_id",
    "awb",
  ]);
  const quoteId = pick(row, ["quote_number", "quote_id", "id"]);
  const bookingCode = (source === "quote" ? tracking || (quoteId ? `BOLT-Q-${quoteId}` : "") : tracking).trim();

  if (!bookingCode) {
    flags.push({ file, row: line, reason: "skipped: no tracking_number / quote id" });
    return null;
  }

  const destRaw = pick(row, ["destination", "dest", "dest_city", "destination_city", "to"]);
  const destCodeHint = pick(row, ["dest_code", "destination_code"]);
  const destCityHint = pick(row, ["dest_city", "destination_city"]);
  const destCountryHint = pick(row, ["dest_country", "destination_country"]);
  const destAddress = pick(row, ["dest_address", "destination_address", "delivery_address"]) || null;

  if (source === "quote") {
    const contact = pick(row, ["contact_email", "email", "customer_email"]);
    const name = pick(row, ["contact_name", "customer_name", "full_name", "name"]);
    if (!destRaw && !destCodeHint && !destCityHint) {
      flags.push({ file, row: line, reason: "skipped quote: no destination (not a useful REQUESTED stub)" });
      return null;
    }
    if (!emailOf(contact) && !name && !pick(row, ["customer_id", "user_id"])) {
      flags.push({ file, row: line, reason: "skipped quote: no contact (not a useful REQUESTED stub)" });
      return null;
    }
  }

  const originRaw = pick(row, ["origin", "origin_city", "from"]);
  const originCodeHint = pick(row, ["origin_code"]);
  const originCityHint = pick(row, ["origin_city"]);
  const originCountryHint = pick(row, ["origin_country"]);

  const dest = parsePlace(destRaw, destCodeHint, destCityHint, destCountryHint, DESTINATIONS, {
    code: "OTH",
    label: destRaw || "Destination on file",
    city: destCityHint || destRaw || "Unknown",
    region: null,
    country: destCountryHint || "",
  });
  const origin = originRaw || originCodeHint
    ? parsePlace(originRaw, originCodeHint, originCityHint, originCountryHint, ORIGINS, {
        code: "FLL",
        label: "Fort Lauderdale warehouse",
        city: WAREHOUSE.city,
        region: WAREHOUSE.state,
        country: WAREHOUSE.country,
      })
    : {
        code: "FLL",
        label: "Fort Lauderdale warehouse",
        city: WAREHOUSE.city,
        region: WAREHOUSE.state,
        country: WAREHOUSE.country,
      };

  const { status, unmapped: statusUnmapped } = mapStatus(pick(row, ["status", "shipment_status", "quote_status"]));
  const { service, unmapped: serviceUnmapped } = mapService(pick(row, ["shipping_method", "service", "service_type", "method"]));
  if (statusUnmapped) {
    flags.push({
      file,
      row: line,
      reason: `unmapped status "${pick(row, ["status", "shipment_status"])}" → REQUESTED`,
    });
  }
  if (serviceUnmapped) {
    flags.push({
      file,
      row: line,
      reason: `unmapped shipping_method "${pick(row, ["shipping_method", "service"])}" → EXPRESS_AIR`,
    });
  }

  const cargo =
    pick(row, ["cargo_description", "cargo", "description", "contents", "notes"]) ||
    (source === "quote" ? "Imported Bolt quote stub (no cargo description)." : "Imported from Bolt Transport (no cargo description).");
  const banned = forbiddenCargo(cargo);
  if (banned) {
    flags.push({ file, row: line, reason: `skipped: forbidden cargo term "${banned}"` });
    return null;
  }

  const contactEmail =
    emailOf(pick(row, ["contact_email", "email", "customer_email", "consignee_email"])) || "";
  const contactName =
    pick(row, ["contact_name", "customer_name", "consignee", "full_name", "name"]) ||
    (contactEmail ? contactEmail.split("@")[0] : "Bolt import");
  const contactPhone = pick(row, ["contact_phone", "phone", "customer_phone"]) || "unknown";

  if (source === "shipment" && !contactEmail && !pick(row, ["customer_id", "user_id"])) {
    flags.push({ file, row: line, reason: `flagged ${bookingCode}: no contact email or customer_id (will import as guest)` });
  }

  const boltCustomer = pick(row, ["customer_id", "user_id", "customer_uuid"]);
  const readyDate = dateOnly(pick(row, ["ready_date", "created_at", "created", "date"]));
  const estimateUsd = num(pick(row, ["estimate_usd", "estimate", "price", "amount", "cost", "quoted_usd"]), 0);
  const weightLb = num(pick(row, ["weight_lb", "weight_lbs", "weight"]), 1);
  const pieces = Math.max(1, Math.round(num(pick(row, ["pieces", "pkgs", "packages", "qty"]), 1)));

  const notesParts = [
    source === "quote" ? "Imported Bolt quote stub. Not a live shipment." : "Imported from Bolt Transport.",
    boltCustomer ? `boltCustomerId=${boltCustomer}` : "",
    `boltTracking=${bookingCode}`,
  ].filter(Boolean);

  return {
    bookingCode: bookingCode.slice(0, 80),
    userBoltId: boltCustomer || null,
    userEmail: contactEmail || null,
    contactName: contactName.slice(0, 80),
    contactEmail: contactEmail || `unknown+${bookingCode.replace(/[^a-z0-9]/gi, "").slice(0, 24)}@import.invalid`,
    contactPhone: contactPhone.slice(0, 40),
    originMode: origin.code === "FLL" && !originRaw ? "WAREHOUSE" : "OTHER",
    originLabel: origin.label,
    originCode: origin.code,
    originAddress: origin.code === "FLL" ? WAREHOUSE.street : pick(row, ["origin_address"]) || null,
    originCity: origin.city,
    originRegion: origin.region,
    originCountry: origin.country,
    destLabel: dest.label,
    destCode: dest.code,
    destAddress,
    destCity: dest.city,
    destRegion: dest.region,
    destCountry: dest.country,
    pickupPoint: pickupFor(dest.code, destAddress),
    service,
    cargoDescription: cargo.slice(0, 500),
    weightLb,
    pieces,
    readyDate,
    status: source === "quote" ? "REQUESTED" : status,
    estimateUsd,
    notes: notesParts.join(" ").slice(0, 500),
    eventNote:
      source === "quote"
        ? `Imported Bolt quote ${bookingCode} as REQUESTED stub. Invoice / pay-later unchanged.`
        : `Imported from Bolt Transport. Tracking ${bookingCode} kept as-is.`,
    source,
  };
}

function planShipments(rows: Row[], flags: Flag[]) {
  const bookings: PlannedBooking[] = [];
  const seen = new Set<string>();
  rows.forEach((row, idx) => {
    const planned = planShipmentRow(row, idx + 2, "shipments.csv", "shipment", flags);
    if (!planned) return;
    if (seen.has(planned.bookingCode)) {
      flags.push({ file: "shipments.csv", row: idx + 2, reason: `skipped duplicate tracking ${planned.bookingCode}` });
      return;
    }
    seen.add(planned.bookingCode);
    bookings.push(planned);
  });
  return bookings;
}

function planQuotes(rows: Row[], shipments: PlannedBooking[], flags: Flag[]) {
  const existing = new Set(shipments.map((s) => s.bookingCode));
  const bookings: PlannedBooking[] = [];
  rows.forEach((row, idx) => {
    const planned = planShipmentRow(row, idx + 2, "quotes.csv", "quote", flags);
    if (!planned) return;
    if (existing.has(planned.bookingCode)) {
      flags.push({ file: "quotes.csv", row: idx + 2, reason: `skipped quote: tracking ${planned.bookingCode} already in shipments.csv` });
      return;
    }
    existing.add(planned.bookingCode);
    bookings.push(planned);
  });
  return bookings;
}

function csvDataRows(dir: string, file: string): { present: boolean; rows: number } {
  const path = join(dir, file);
  if (!existsSync(path)) return { present: false, rows: 0 };
  // Read-only. Never unlink, rewrite, or move backup CSVs — clinic_* stay for a later clinics table.
  return { present: true, rows: parseCsv(readFileSync(path, "utf8")).length };
}

function collectSkipped(dir: string): SkipTally[] {
  const tallies: SkipTally[] = [];
  const seen = new Set<string>();
  const names = existsSync(dir) ? readdirSync(dir) : [];

  const clinicSeen = new Set<string>(CANONICAL_CLINIC_FILES);
  const clinicNames = [
    ...CANONICAL_CLINIC_FILES,
    ...names.filter((n) => /^clinic_.*\.csv$/i.test(n) && !clinicSeen.has(n)),
  ];
  for (const file of clinicNames) {
    if (seen.has(file)) continue;
    seen.add(file);
    const { present, rows } = csvDataRows(dir, file);
    tallies.push({ file, rows, present, kind: "clinic" });
  }

  const emp = csvDataRows(dir, EMPLOYEES_FILE);
  tallies.push({ file: EMPLOYEES_FILE, rows: emp.rows, present: emp.present, kind: "employees" });
  seen.add(EMPLOYEES_FILE);

  const known = new Set<string>([...FREIGHT_FILES, ...Array.from(seen)]);
  for (const name of names) {
    if (!name.toLowerCase().endsWith(".csv") || known.has(name)) continue;
    const { present, rows } = csvDataRows(dir, name);
    tallies.push({ file: name, rows, present, kind: "other" });
  }
  return tallies;
}

function printCounts(opts: {
  mode: Mode;
  usersImported: number;
  usersUpserted: number;
  bookingsImported: number;
  bookingsUpserted: number;
  skipped: SkipTally[];
}) {
  const { mode, usersImported, usersUpserted, bookingsImported, bookingsUpserted, skipped } = opts;
  console.log("");
  console.log("=== counts ===");
  if (mode === "dry-run") {
    const users = usersImported + usersUpserted;
    const bookings = bookingsImported + bookingsUpserted;
    console.log(`users                imported/upserted=${users}  (dry-run; no DB write)`);
    console.log(`bookings             imported/upserted=${bookings}  (dry-run; no DB write)`);
  } else {
    console.log(`users                imported=${usersImported}  upserted=${usersUpserted}`);
    console.log(`bookings             imported=${bookingsImported}  upserted=${bookingsUpserted}`);
  }
  const clinic = skipped.filter((s) => s.kind === "clinic");
  const employees = skipped.find((s) => s.kind === "employees");
  const other = skipped.filter((s) => s.kind === "other");
  if (!clinic.length) {
    console.log("clinic_*             skipped=0  (no clinic_*.csv present; nothing dropped)");
  } else {
    for (const s of clinic) {
      const kept = s.present
        ? `${s.rows} row(s) skipped — file kept for later clinics table`
        : "not present";
      console.log(`${s.file.padEnd(21)} skipped=${s.present ? s.rows : 0}  (${kept})`);
    }
  }
  if (employees) {
    const kept = employees.present
      ? `${employees.rows} row(s) skipped — file kept`
      : "not present";
    console.log(`${EMPLOYEES_FILE.padEnd(21)} skipped=${employees.present ? employees.rows : 0}  (${kept})`);
  }
  for (const s of other) {
    console.log(`${s.file.padEnd(21)} skipped=${s.rows}  (unknown CSV; file kept)`);
  }
}

function resolveUserId(booking: PlannedBooking, persisted: Map<string, string>) {
  if (booking.userBoltId && persisted.has(booking.userBoltId)) return persisted.get(booking.userBoltId)!;
  if (booking.userEmail && persisted.has(`email:${booking.userEmail}`)) return persisted.get(`email:${booking.userEmail}`)!;
  return null;
}

async function placeholderHash() {
  const token = randomBytes(24).toString("hex");
  return bcrypt.hash(token, 10);
}

async function applyImport(
  prisma: PrismaClient,
  users: PlannedUser[],
  bookings: PlannedBooking[],
) {
  const persisted = new Map<string, string>();
  let usersCreated = 0;
  let usersUpdated = 0;
  let bookingsCreated = 0;
  let bookingsUpdated = 0;
  let eventsCreated = 0;

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: user.name, phone: user.phone },
      });
      persisted.set(user.boltId, existing.id);
      persisted.set(`email:${user.email}`, existing.id);
      usersUpdated += 1;
      continue;
    }
    if (user.id) {
      const byId = await prisma.user.findUnique({ where: { id: user.id } });
      if (byId) {
        await prisma.user.update({
          where: { id: byId.id },
          data: { name: user.name, phone: user.phone },
        });
        persisted.set(user.boltId, byId.id);
        persisted.set(`email:${user.email}`, byId.id);
        usersUpdated += 1;
        continue;
      }
    }
    const created = await prisma.user.create({
      data: {
        ...(user.id ? { id: user.id } : {}),
        email: user.email,
        name: user.name,
        phone: user.phone,
        passwordHash: await placeholderHash(),
      },
    });
    persisted.set(user.boltId, created.id);
    persisted.set(`email:${user.email}`, created.id);
    usersCreated += 1;
  }

  for (const booking of bookings) {
    const userId = resolveUserId(booking, persisted);
    const existing = await prisma.booking.findUnique({
      where: { bookingCode: booking.bookingCode },
      include: { events: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const freightData = {
      userId,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone,
      originMode: booking.originMode,
      originLabel: booking.originLabel,
      originCode: booking.originCode,
      originAddress: booking.originAddress,
      originCity: booking.originCity,
      originRegion: booking.originRegion,
      originCountry: booking.originCountry,
      destLabel: booking.destLabel,
      destCode: booking.destCode,
      destAddress: booking.destAddress,
      destCity: booking.destCity,
      destRegion: booking.destRegion,
      destCountry: booking.destCountry,
      pickupPoint: booking.pickupPoint,
      service: booking.service,
      cargoDescription: booking.cargoDescription,
      weightLb: booking.weightLb,
      pieces: booking.pieces,
      readyDate: booking.readyDate,
      status: booking.status,
      estimateUsd: booking.estimateUsd,
      notes: booking.notes,
    };

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: freightData,
      });
      bookingsUpdated += 1;
      const latest = existing.events[0]?.status;
      if (latest !== booking.status) {
        await prisma.trackingEvent.create({
          data: { bookingId: existing.id, status: booking.status, note: booking.eventNote },
        });
        eventsCreated += 1;
      }
      continue;
    }

    const created = await prisma.booking.create({
      data: {
        bookingCode: booking.bookingCode,
        ...freightData,
        invoiceStatus: "none",
        paymentProvider: "invoice_pay_later",
      },
    });
    await prisma.trackingEvent.create({
      data: { bookingId: created.id, status: booking.status, note: booking.eventNote },
    });
    bookingsCreated += 1;
    eventsCreated += 1;
  }

  return { usersCreated, usersUpdated, bookingsCreated, bookingsUpdated, eventsCreated };
}

async function main() {
  loadDotEnv();
  const { mode, dir, help } = parseArgs(process.argv.slice(2));
  if (help) {
    usage();
    return;
  }

  console.log(`Bolt Transport import (${mode})`);
  console.log(`IMPORT_DIR=${dir}`);
  if (!existsSync(dir)) {
    console.log("IMPORT_DIR does not exist. Create it and copy CSVs there (see docs/BOLT_TRANSPORT_IMPORT.md).");
    printCounts({
      mode,
      usersImported: 0,
      usersUpserted: 0,
      bookingsImported: 0,
      bookingsUpserted: 0,
      skipped: collectSkipped(dir),
    });
    if (mode === "apply") process.exit(1);
    return;
  }

  const skipped = collectSkipped(dir);
  for (const s of skipped) {
    if (!s.present) continue;
    if (s.kind === "clinic") {
      console.log(`skip  ${s.file} — ${s.rows} row(s) left on disk for a later clinics table (not imported).`);
    } else if (s.kind === "employees") {
      console.log(`skip  ${s.file} — ${s.rows} row(s) left on disk (out of freight staging scope).`);
    } else {
      console.log(`skip  ${s.file} — ${s.rows} row(s); unknown CSV (freight importer reads customers/shipments/quotes only). File kept.`);
    }
  }

  const flags: Flag[] = [];
  const customerRows = readCsvIfPresent(dir, "customers.csv");
  const shipmentRows = readCsvIfPresent(dir, "shipments.csv");
  const quoteRows = readCsvIfPresent(dir, "quotes.csv");

  if (!customerRows) console.log("skip  customers.csv — not present");
  if (!shipmentRows) console.log("skip  shipments.csv — not present");
  if (!quoteRows) console.log("skip  quotes.csv — not present");

  const { users, byBoltId, byEmail } = planCustomers(customerRows || [], flags);
  const shipments = planShipments(shipmentRows || [], flags);
  const quotes = quoteRows ? planQuotes(quoteRows, shipments, flags) : [];
  const bookings = [...shipments, ...quotes];

  for (const b of bookings) {
    if (b.userBoltId && byBoltId.has(b.userBoltId)) {
      const u = byBoltId.get(b.userBoltId)!;
      if (!b.userEmail) b.userEmail = u.email;
      if (b.contactEmail.endsWith("@import.invalid")) b.contactEmail = u.email;
      if (b.contactName === "Bolt import") b.contactName = u.name;
      if (b.contactPhone === "unknown" && u.phone) b.contactPhone = u.phone;
    } else if (b.userEmail && byEmail.has(b.userEmail)) {
      /* linked by email */
    }
  }

  console.log("");
  console.log(`customers.csv  ${customerRows ? `${users.length} freight user(s) planned` : "absent"}`);
  console.log(`shipments.csv  ${shipmentRows ? `${shipments.length} booking(s) planned` : "absent"}`);
  console.log(
    `quotes.csv     ${
      quoteRows
        ? quotes.length
          ? `${quotes.length} REQUESTED stub(s) planned`
          : "present but no useful REQUESTED stubs (see flags)"
        : "absent"
    }`,
  );

  if (users.length) {
    console.log("\nUsers:");
    for (const u of users.slice(0, 20)) {
      console.log(`  ${u.email}  name=${u.name}  id=${u.id || "(generated)"}  boltId=${u.boltId}`);
    }
    if (users.length > 20) console.log(`  … ${users.length - 20} more`);
  }
  if (bookings.length) {
    console.log("\nBookings:");
    for (const b of bookings.slice(0, 20)) {
      console.log(`  ${b.bookingCode}  ${b.status}  ${b.service}  ${b.originCode}→${b.destCode}  (${b.source})`);
    }
    if (bookings.length > 20) console.log(`  … ${bookings.length - 20} more`);
  }

  if (flags.length) {
    console.log(`\nFlags (${flags.length}):`);
    for (const f of flags) console.log(`  ${f.file}:${f.row}  ${f.reason}`);
  }

  if (mode === "dry-run") {
    console.log("\nDry-run complete. No database writes.");
    printCounts({
      mode,
      usersImported: users.length,
      usersUpserted: 0,
      bookingsImported: bookings.length,
      bookingsUpserted: 0,
      skipped,
    });
    console.log("Re-run with --apply to upsert User / Booking / TrackingEvent.");
    return;
  }

  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("DATABASE_URL is required for --apply.");
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const result = await applyImport(prisma, users, bookings);
    console.log("\nApply complete. TrackingEvent created=" + result.eventsCreated + ".");
    console.log("invoiceStatus / paymentProvider left as invoice_pay_later (no Stripe keys).");
    printCounts({
      mode,
      usersImported: result.usersCreated,
      usersUpserted: result.usersUpdated,
      bookingsImported: result.bookingsCreated,
      bookingsUpserted: result.bookingsUpdated,
      skipped,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
