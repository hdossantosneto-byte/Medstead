import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issuePayLaterInvoice } from "@/lib/freight-payments";
import { isOpsDesk } from "@/lib/ops-desk";
import { isPublicTrackStep, shipmentStatusForPublicStep } from "@/lib/public-track";
import { prisma } from "@/lib/prisma";
import { advanceShipment } from "@/lib/handoff";

const patchSchema = z.object({
  action: z.enum(["set_status", "issue_invoice", "pay_later", "mark_paid"]),
  status: z.string().optional(),
  note: z.string().max(300).optional(),
  amountUsd: z.number().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  if (!isOpsDesk()) {
    return NextResponse.json({ error: "Ops desk sign-in required" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const code = decodeURIComponent(params.code);
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentCode: code },
    include: { quote: true },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const amount = parsed.data.amountUsd ?? shipment.invoiceUsd ?? shipment.quote?.listAmount ?? 0;

  if (parsed.data.action === "set_status") {
    const step = parsed.data.status ?? "";
    if (!isPublicTrackStep(step)) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
    await advanceShipment(
      shipment.id,
      shipmentStatusForPublicStep(step),
      null,
      parsed.data.note || `Ops desk set ${step}`,
    );
  } else if (parsed.data.action === "issue_invoice") {
    const issued = issuePayLaterInvoice(shipment.shipmentCode, amount);
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        invoiceStatus: issued.invoiceStatus,
        invoiceRef: issued.invoiceRef,
        invoiceUsd: issued.invoiceUsd,
      },
    });
    await prisma.statusEvent.create({
      data: {
        shipmentId: shipment.id,
        fromStatus: shipment.status,
        toStatus: shipment.status,
        note: parsed.data.note || issued.note,
      },
    });
  } else if (parsed.data.action === "pay_later") {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { invoiceStatus: "pay_later", invoiceUsd: amount },
    });
    await prisma.statusEvent.create({
      data: {
        shipmentId: shipment.id,
        fromStatus: shipment.status,
        toStatus: shipment.status,
        note: parsed.data.note || "Pay later — invoice stays open.",
      },
    });
  } else {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { invoiceStatus: "paid", invoiceUsd: amount },
    });
    if (shipment.status === "QUOTED" || shipment.status === "SUBMITTED") {
      await advanceShipment(shipment.id, "APPROVED_PAID", null, "Freight invoice marked paid.");
    } else {
      await prisma.statusEvent.create({
        data: {
          shipmentId: shipment.id,
          fromStatus: shipment.status,
          toStatus: shipment.status,
          note: parsed.data.note || "Freight invoice marked paid.",
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
