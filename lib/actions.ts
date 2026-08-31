"use server";

import { ClinicOrderStatus, CrmStage, GateName, GateState, ShipmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  CLINIC_ORDER_STATUSES,
  CLINIC_ROLES,
  GATE_ORDER,
  SHIPMENT_STATUSES,
} from "./constants";
import { prisma } from "./prisma";
import { unitPriceForQty } from "./pricing";
import { auth, requireRole, requireUser, clinicApproved } from "./session";
import { nextShipmentCode } from "./shipment-id";

function revalidateApp() {
  revalidatePath("/app");
  revalidatePath("/app/clinic/orders");
  revalidatePath("/app/admin");
  revalidatePath("/app/ops");
  revalidatePath("/app/finance");
}

export async function placeClinicOrder(form: {
  items: Array<{ productId: string; qty: number }>;
  notes?: string;
}) {
  const user = await requireUser();
  if (!CLINIC_ROLES.includes(user.role) || !clinicApproved(user) || !user.clinic) {
    return { error: "Clinic account is not approved yet." };
  }
  if (!form.items.length) return { error: "Add at least one item." };

  const market = user.clinic.market;
  const lines = [];
  for (const item of form.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { prices: true },
    });
    if (!product) return { error: "Unknown product." };
    if (product.category === "NON_RX" && market === "INTL" && item.qty < 20) {
      return { error: `${product.name}: international Non-RX minimum is 20 units.` };
    }
    if (product.category === "NON_RX" && market === "USA" && item.qty < 100) {
      return { error: `${product.name}: USA Non-RX volume book starts at qty 100.` };
    }
    const tier = unitPriceForQty(product.prices, market, item.qty);
    if (!tier) return { error: `No price tier for ${product.name} at qty ${item.qty}.` };
    lines.push({
      productId: product.id,
      qty: item.qty,
      unitPrice: tier.unitPrice,
      priceLabel: tier.label,
    });
  }

  const count = await prisma.clinicOrder.count();
  const order = await prisma.clinicOrder.create({
    data: {
      orderNumber: `CO-${1000 + count + 1}`,
      clinicId: user.clinic.id,
      userId: user.id,
      status: "SUBMITTED",
      notes: form.notes,
      items: { create: lines },
      events: { create: { toStatus: "SUBMITTED", actorId: user.id, note: "Clinic submitted order" } },
    },
  });
  revalidateApp();
  return { ok: true, id: order.id };
}

export async function approveClinic(clinicId: string, approve: boolean) {
  const admin = await requireRole(["MEDSTEAD_ADMIN"]);
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { approved: approve },
  });
  await prisma.user.updateMany({
    where: { clinicId, role: { in: CLINIC_ROLES } },
    data: { active: approve },
  });
  await prisma.crmAccount.updateMany({
    where: { clinicId },
    data: { stage: approve ? "ACTIVATED" : "ELIGIBILITY_REVIEW" },
  });
  void admin;
  revalidateApp();
  return { ok: true };
}

export async function overrideClinicStatus(orderId: string, status: ClinicOrderStatus, note?: string) {
  const admin = await requireRole(["MEDSTEAD_ADMIN"]);
  if (!CLINIC_ORDER_STATUSES.includes(status)) return { error: "Invalid status." };
  const order = await prisma.clinicOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { status },
  });
  await prisma.statusEvent.create({
    data: {
      clinicOrderId: orderId,
      fromStatus: order.status,
      toStatus: status,
      note: note || "Admin status override",
      actorId: admin.id,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function generateInvoice(orderId: string) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "FINANCE"]);
  const order = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: true },
  });
  if (!order) return { error: "Order not found." };
  if (order.invoice) return { error: "Invoice already exists." };
  const amount = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  await prisma.invoice.create({
    data: {
      number: `INV-${order.orderNumber.replace("CO-", "")}`,
      orderId: order.id,
      amount,
      dueAt: new Date(Date.now() + 14 * 86400000),
    },
  });
  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { status: "INVOICE_GENERATED" },
  });
  await prisma.statusEvent.create({
    data: {
      clinicOrderId: orderId,
      fromStatus: order.status,
      toStatus: "INVOICE_GENERATED",
      note: "Invoice generated",
      actorId: actor.id,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function markPaymentPending(orderId: string) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "FINANCE"]);
  const order = await prisma.clinicOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { status: "PAYMENT_PENDING" },
  });
  await prisma.statusEvent.create({
    data: {
      clinicOrderId: orderId,
      fromStatus: order.status,
      toStatus: "PAYMENT_PENDING",
      actorId: actor.id,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function recordPayment(invoiceId: string, amount: number, method: string, online: boolean) {
  const actor = await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: true },
  });
  if (!invoice) return { error: "Invoice not found." };
  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method,
      online,
      userId: actor.id,
    },
  });
  const paidAmount = invoice.paidAmount + amount;
  const paid = paidAmount >= invoice.amount - 0.009;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, status: paid ? "paid" : "partial" },
  });
  if (paid) {
    await prisma.clinicOrder.update({
      where: { id: invoice.orderId },
      data: { status: "PAYMENT_RECEIVED" },
    });
    await prisma.statusEvent.create({
      data: {
        clinicOrderId: invoice.orderId,
        fromStatus: invoice.order.status,
        toStatus: "PAYMENT_RECEIVED",
        actorId: actor.id,
        note: "Finance recorded payment / credit",
      },
    });
  }
  revalidateApp();
  return { ok: true };
}

export async function generateManifest(orderId: string) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "OPS"]);
  const order = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { clinic: true, manifest: true, shipment: { include: { gates: true } } },
  });
  if (!order) return { error: "Order not found." };
  if (order.manifest) return { error: "Manifest already exists." };

  if (order.shipment) {
    const allGreen =
      order.shipment.gates.length === GATE_ORDER.length &&
      order.shipment.gates.every((g) => g.state === "GREEN");
    if (!allGreen) {
      return { error: "All six release gates must be green before a manifest." };
    }
  }

  const dest = order.clinic.market === "USA" ? "FLL" : "NAS";
  await prisma.manifest.create({
    data: {
      number: `MAN-${order.orderNumber.replace("CO-", "")}`,
      orderId,
      origin: "FLL",
      destination: dest,
    },
  });
  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { status: "MANIFEST_GENERATED" },
  });
  await prisma.statusEvent.create({
    data: {
      clinicOrderId: orderId,
      fromStatus: order.status,
      toStatus: "MANIFEST_GENERATED",
      actorId: actor.id,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function setCrmStage(id: string, stage: CrmStage, holdReason?: string) {
  await requireRole(["MEDSTEAD_ADMIN"]);
  await prisma.crmAccount.update({
    where: { id },
    data: { stage, holdReason: stage === "HOLD" || stage === "LOST" ? holdReason : null },
  });
  revalidateApp();
  return { ok: true };
}

export async function setGate(shipmentId: string, name: GateName, state: GateState, note?: string) {
  const user = await requireRole(["OPS", "MEDSTEAD_ADMIN", "FINANCE"]);
  if (user.role === "FINANCE" && name !== "COMMERCIAL_FINANCE") {
    return { error: "Finance may only sign the commercial / finance gate." };
  }
  const gate = await prisma.releaseGate.findFirst({ where: { shipmentId, name } });
  if (!gate) return { error: "Gate not found." };
  await prisma.releaseGate.update({
    where: { id: gate.id },
    data: { state, note, signedById: user.id },
  });
  revalidateApp();
  return { ok: true };
}

export async function setShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  const actor = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  if (!SHIPMENT_STATUSES.includes(status)) return { error: "Invalid shipment status." };
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { gates: true },
  });
  if (!shipment) return { error: "Shipment not found." };
  if (status === "RELEASED_MANIFESTED") {
    const allGreen =
      shipment.gates.length === GATE_ORDER.length &&
      shipment.gates.every((g) => g.state === "GREEN");
    if (!allGreen) return { error: "All six gates must be green before release / manifest." };
  }
  const publicClock =
    status === "RELEASED_MANIFESTED" ||
    status === "IN_TRANSIT" ||
    status === "CUSTOMS_HOLD_RELEASED" ||
    status === "DESTINATION_RECEIVED" ||
    status === "DELIVERED_CLOSED";
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: { status, publicClock },
  });
  await prisma.statusEvent.create({
    data: {
      shipmentId,
      fromStatus: shipment.status,
      toStatus: status,
      actorId: actor.id,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function createFreightQuote(input: {
  origin: string;
  destination: string;
  service: "EXPRESS_AIR" | "STANDARD_SEA";
  weightLb: number;
  pieces: number;
  description?: string;
  createShipment?: boolean;
}) {
  const session = await auth();
  const sessionUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const { quoteFreight } = await import("./pricing");
  const amounts = quoteFreight(input);
  const count = await prisma.freightQuote.count();
  const quote = await prisma.freightQuote.create({
    data: {
      quoteNumber: `FQ-${2400 + count + 1}`,
      userId: sessionUser?.id,
      origin: input.origin,
      destination: input.destination,
      service: input.service,
      weightLb: input.weightLb,
      pieces: input.pieces,
      listAmount: amounts.listAmount,
      onlineAmount: amounts.onlineAmount,
      description: input.description,
    },
  });

  let shipmentCode: string | undefined;
  if (input.createShipment && sessionUser) {
    const code = await nextShipmentCode(input.origin, input.destination);
    await prisma.shipment.create({
      data: {
        shipmentCode: code,
        status: "QUOTED",
        service: input.service,
        origin: input.origin,
        destination: input.destination,
        weightLb: input.weightLb,
        pieces: input.pieces,
        customerId: sessionUser.id,
        quoteId: quote.id,
        consignee: sessionUser.name,
        description: input.description,
        gates: { create: GATE_ORDER.map((name) => ({ name })) },
        events: { create: { toStatus: "QUOTED", actorId: sessionUser.id } },
      },
    });
    if (sessionUser.role === "CUSTOMER" || sessionUser.role === "PUBLIC") {
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { rewardsPoints: { increment: Math.floor(amounts.listAmount) } },
      });
    }
    shipmentCode = code;
  }

  revalidatePath("/freight");
  revalidatePath("/app/customer");
  return { ok: true, quoteId: quote.id, quoteNumber: quote.quoteNumber, ...amounts, shipmentCode };
}

export async function ensureCustomerWarehouse() {
  const user = await requireUser();
  if (user.warehouseCode) return user.warehouseCode;
  const code = `MS-C15-${String(1000 + Math.floor(Math.random() * 8000))}`;
  await prisma.user.update({ where: { id: user.id }, data: { warehouseCode: code } });
  return code;
}
