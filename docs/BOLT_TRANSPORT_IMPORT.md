# Bolt Transport CSV import (freight staging)

One-shot CLI that copies **freight** rows from a Bolt Transport export into this storefront’s Prisma models. It does **not** change live DNS, clinic catalog, or invoice/pay-later behavior. Do not merge this work to `main` as a production cutover.

```bash
npx tsx scripts/import-bolt-transport.ts              # dry-run (default) — no DB writes
npx tsx scripts/import-bolt-transport.ts --apply      # upsert User / Booking / TrackingEvent
```

Optional: `npm run import:bolt` (same default dry-run).

## Env

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `--apply` only | Existing Postgres URL (Prisma). Dry-run never opens the DB. |
| `SESSION_SECRET` | the running app, not this CLI | Sign customer session cookies. |
| `OPS_PIN` | `/ops` desk, not this CLI | Staging default is `local-ops`. |
| `IMPORT_DIR` | this CLI | Directory of CSVs. Default `./import-data`. Override with `--dir PATH`. |

Copy `.env.example` → `.env` for local apply. This script never invents Stripe keys.

## Where to put CSVs

Do **not** commit real customer PII. The repo only keeps `import-data/.gitkeep`. `import-data/*` (except `.gitkeep`) is gitignored.

1. Export from Bolt (or copy the ops drop) into a folder Hairson controls.
2. Place these files in `IMPORT_DIR` when present:
   - `customers.csv`
   - `shipments.csv`
   - `quotes.csv` (optional)
3. If `clinic_accounts.csv`, `clinic_orders.csv`, or `employees.csv` are in that folder, the CLI **skips them and logs** — clinic/employee data is out of freight staging scope.

```bash
cp /path/to/bolt-export/customers.csv ./import-data/
cp /path/to/bolt-export/shipments.csv ./import-data/
# optional
cp /path/to/bolt-export/quotes.csv ./import-data/
```

## Dry-run vs `--apply`

| Mode | DB | What happens |
| --- | --- | --- |
| `--dry-run` (default) | never written; Prisma is not opened | Parses CSVs, prints planned users/bookings and flags. |
| `--apply` | upserts only | Creates/updates `User`, `Booking`, `TrackingEvent`. Re-runnable. |

`--apply` requires `DATABASE_URL`. Existing invoice fields (`invoiceStatus`, `invoiceRef`, `invoiceUsd`, `paymentProvider`) are **not** overwritten.

## Freight map

### `customers.csv` → `User`

Prisma `User.id` is `String`, so a Bolt UUID is stored as `id` when the cell is a UUID. Non-UUID ids get a generated cuid; the Bolt id is kept only for linking shipments (`boltCustomerId=…` on `Booking.notes`).

| Bolt column (aliases) | User field |
| --- | --- |
| `email` / `email_address` | `email` (required; unique upsert key) |
| `full_name` / `name` | `name` |
| `phone` / `phone_number` | `phone` |
| `id` / `uuid` | `id` if UUID |

Rows that look like **admin** (`role` = admin / staff / ops / finance / employee, or `admin@…` email) are skipped and flagged. `passwordHash` is bcrypt of a **discarded random token** — not a Bolt hash. Imported users cannot log in with their Bolt password; v1 has no self-serve reset, so ops must set a new hash before those accounts can sign in.

### `shipments.csv` → `Booking` + one `TrackingEvent`

| Bolt column (aliases) | Booking field |
| --- | --- |
| `tracking_number` / `tracking` / `awb` | `bookingCode` **as-is** (including `SEA-MTG-…`; not rewritten to `MS-…`) |
| `status` | `status` (see map below) |
| `destination` / `dest_city` | `destLabel` / `destCity` / `destCode` (matched to known lanes when possible) |
| `shipping_method` / `service` | `service` (see map below) |

A single `TrackingEvent` is created on first insert (and on later applies only if status changed). New bookings keep `invoiceStatus=none` and `paymentProvider=invoice_pay_later`.

### `quotes.csv` → optional `REQUESTED` stubs

A quote becomes a `REQUESTED` booking only when it has a usable id/tracking **and** a destination **and** a contact. Otherwise the file is skipped per-row with a log. Quote codes use the tracking number, or `BOLT-Q-{id}` if there is no tracker.

## Status and service maps

**Status** (unknown → `REQUESTED`, flagged):

| Bolt-ish label | Storefront |
| --- | --- |
| requested, submitted, pending, new, quoted | `REQUESTED` |
| confirmed, approved, accepted | `CONFIRMED` |
| invoice, invoiced, invoice_issued | `INVOICE_ISSUED` |
| paid, payment_received | `PAID` |
| received, warehouse, origin_received | `RECEIVED` |
| in_transit, shipped, departed | `IN_TRANSIT` |
| customs, customs_hold | `CUSTOMS` |
| ready, ready_pickup | `READY_PICKUP` |
| delivered, completed, closed | `DELIVERED` |

**Service** (unknown → `EXPRESS_AIR`, flagged):

| Bolt-ish `shipping_method` | Storefront |
| --- | --- |
| air, express, express_air, plane | `EXPRESS_AIR` |
| sea, ocean, standard_sea, boat | `STANDARD_SEA` |
| medical, remote, medical_remote | `MEDICAL_REMOTE` |

## Out of scope

- Clinic accounts / clinic orders / employees (logged skip)
- Peptide / GLP-1 cargo rows (skipped)
- Live DNS, Stripe, or merging this PR to `main`
