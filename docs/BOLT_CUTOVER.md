# Bolt → owned MedStead gap list

Live customer freight stays on Bolt (`https://go.medsteadtransport.com`) until a later cutover. This repo is the owned successor. Do **not** change DNS or publish this app to customer DNS from this work.

## Ported into this owned OS

- Book → confirmation (`/freight/confirm/{MS-id}`) → public track, including **guest** bookings
- Invoice / pay-later on freight shipments (no card rail; no invented Stripe keys)
- Cargo rejection for peptides / GLP-1 / TRT / BHRT on book, cart, Shop & Ship, and `/api/quotes`
- Services + How it works + WareSpace C15 copy from Transport Bolt
- Phone nav: Home · Ship · Track · Cart · Account, plus a hamburger
- Freight cart (logistics pieces only — not clinic-shop SKUs)
- `/account` hub with personal C15 address
- PIN freight desk at `/ops` (default PIN `local-ops`) that moves public track + invoices
- Del phone dispatch tab + compact corridor/fleet jumpers on `/app/flights`
- Charter CTA is **Request a charter** + broker footer (not an operating-airline booking)

## Still only on Bolt until cutover

- The **live public door** and any customer accounts/history already stored on Bolt
- Bolt-hosted auth, rewards balances, and in-flight packages that were never imported
- Bolt “AI quote” marketing and any Bolt-only payment processor (if one is live there)
- Flight Ops Bolt staff logins, historical trip files, and whatever is not in this SQLite seed
- Native Bolt PWA install / host chrome (this app has its own PWA + Capacitor shell, not live)
- Customer DNS (`go.medsteadtransport.com`, `medsteadtransport.com`) — Squarespace/Bolt remain the public hosts

## Intentionally not copied

- Clinic Portal shop SKUs, peptides, GLP-1, Semaglutide, Tirzepatide, Retatrutide, TRT, BHRT on public routes
- STEADAIR as a live airline, “Book a STEADAIR flight,” or Part 135 operating claims
- FEIN, Florida doc L26000114326, D-U-N-S, full bank numbers, or card 6890
- Merging Flight Ops into the public freight storefront
