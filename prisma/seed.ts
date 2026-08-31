import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("storefront1234", 10);

  const customer = await prisma.user.upsert({
    where: { email: "customer@medstead.demo" },
    update: { passwordHash },
    create: {
      email: "customer@medstead.demo",
      passwordHash,
      name: "Alex Rivera",
      phone: "+1 954 555 0144",
    },
  });

  const existing = await prisma.booking.findUnique({
    where: { bookingCode: "MS-20260820-FLL-NAS-0001" },
  });

  if (!existing) {
    const booking = await prisma.booking.create({
      data: {
        bookingCode: "MS-20260820-FLL-NAS-0001",
        userId: customer.id,
        contactName: "Alex Rivera",
        contactEmail: "customer@medstead.demo",
        contactPhone: "+1 954 555 0144",
        originMode: "WAREHOUSE",
        originLabel: "Fort Lauderdale warehouse",
        originCode: "FLL",
        originAddress: "700 NW 57th Ct, Unit C15",
        originCity: "Fort Lauderdale",
        originRegion: "FL",
        originCountry: "United States",
        destLabel: "Nassau, Bahamas",
        destCode: "NAS",
        destCity: "Nassau",
        destCountry: "Bahamas",
        pickupPoint: "NASSAU",
        service: "EXPRESS_AIR",
        cargoDescription: "Clinic supplies and household goods — no patient data.",
        weightLb: 22,
        pieces: 2,
        readyDate: "2026-08-21",
        status: "IN_TRANSIT",
        estimateUsd: 233.45,
        invoiceUsd: 233.45,
        invoiceStatus: "pay_later",
        invoiceRef: "INV-MS-20260820-FLL-NAS-0001",
        paymentProvider: "invoice_pay_later",
      },
    });

    const stamps = [
      { status: "REQUESTED", note: "Booking received. No card charged.", hoursAgo: 240 },
      { status: "CONFIRMED", note: "Ops confirmed the request.", hoursAgo: 230 },
      { status: "INVOICE_ISSUED", note: "Invoice INV-MS-20260820-FLL-NAS-0001 issued — pay later.", hoursAgo: 220 },
      { status: "RECEIVED", note: "Received at WareSpace C15, Fort Lauderdale.", hoursAgo: 96 },
      { status: "IN_TRANSIT", note: "Released and in transit to Nassau. Public clock started.", hoursAgo: 36 },
    ];

    for (const row of stamps) {
      await prisma.trackingEvent.create({
        data: {
          bookingId: booking.id,
          status: row.status,
          note: row.note,
          createdAt: new Date(Date.now() - row.hoursAgo * 3600 * 1000),
        },
      });
    }
  }

  const medical = await prisma.booking.findUnique({
    where: { bookingCode: "MS-20260822-FLL-KIN-0001" },
  });

  if (!medical) {
    await prisma.booking.create({
      data: {
        bookingCode: "MS-20260822-FLL-KIN-0001",
        contactName: "Jordan Blake",
        contactEmail: "orders-demo@medstead.demo",
        contactPhone: "+1 305 555 0199",
        originMode: "WAREHOUSE",
        originLabel: "Fort Lauderdale warehouse",
        originCode: "FLL",
        originCity: "Fort Lauderdale",
        originRegion: "FL",
        originCountry: "United States",
        destLabel: "Kingston, Jamaica",
        destCode: "KIN",
        destCity: "Kingston",
        destCountry: "Jamaica",
        pickupPoint: "ADDRESS",
        destAddress: "Clinic receiving desk — address on file with ops",
        service: "MEDICAL_REMOTE",
        cargoDescription: "IV supplies and devices for a licensed clinic.",
        weightLb: 18,
        pieces: 1,
        readyDate: "2026-08-24",
        status: "CONFIRMED",
        estimateUsd: 268.55,
        invoiceStatus: "none",
        events: {
          create: [
            { status: "REQUESTED", note: "Hard-to-reach medical transport request." },
            { status: "CONFIRMED", note: "Lane confirmed. Invoice will follow." },
          ],
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
