import { prisma } from "./prisma";

function pad(n: number) {
  return String(n).padStart(4, "0");
}

export async function nextBookingCode(originCode: string, destCode: string, at = new Date()) {
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, "0");
  const d = String(at.getUTCDate()).padStart(2, "0");
  const day = `${y}${m}${d}`;
  const orig = originCode.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4) || "ORIG";
  const dest = destCode.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4) || "DEST";
  const prefix = `MS-${day}-${orig}-${dest}-`;

  const latest = await prisma.booking.findFirst({
    where: { bookingCode: { startsWith: prefix } },
    orderBy: { bookingCode: "desc" },
  });

  const last = latest ? Number(latest.bookingCode.slice(-4)) : 0;
  const seq = Number.isFinite(last) ? last + 1 : 1;
  return `${prefix}${pad(seq)}`;
}
