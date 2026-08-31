import { prisma } from "./prisma";

export async function nextShipmentCode(origin: string, destination: string) {
  const day = new Date();
  const y = day.getUTCFullYear();
  const m = String(day.getUTCMonth() + 1).padStart(2, "0");
  const d = String(day.getUTCDate()).padStart(2, "0");
  const ymd = `${y}${m}${d}`;
  const org = origin.slice(0, 3).toUpperCase();
  const dest = destination.slice(0, 3).toUpperCase();

  const seq = await prisma.shipmentSequence.upsert({
    where: { id: "global" },
    create: { id: "global", lastN: 1 },
    update: { lastN: { increment: 1 } },
  });

  const n = String(seq.lastN).padStart(4, "0");
  const code = `MS-${ymd}-${org}-${dest}-${n}`;

  const clash = await prisma.shipment.findUnique({ where: { shipmentCode: code } });
  if (clash) {
    return nextShipmentCode(origin, destination);
  }
  return code;
}
