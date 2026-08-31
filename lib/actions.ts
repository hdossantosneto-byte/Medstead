"use server";

import {
  ClinicOrderStatus,
  CrmStage,
  FlightCorridor,
  FlightPhase,
  GateName,
  GateState,
  ShipmentStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  CLINIC_ORDER_STATUSES,
  CLINIC_ROLES,
  GATE_LABEL,
  GATE_ORDER,
  SHIPMENT_STATUSES,
  WELCOME_POINTS,
} from "./constants";
import { prisma } from "./prisma";
import { unitPriceForQty } from "./pricing";
import { auth, requireRole, requireUser, clinicApproved } from "./session";
import { nextShipmentCode } from "./shipment-id";
import type { QueueKind } from "./queue";
import { advanceClinicOrder, advanceShipment, ensureLinkedShipment } from "./handoff";

function revalidateApp() {
  revalidatePath("/app");
  revalidatePath("/app/clinic/orders");
  revalidatePath("/app/admin");
  revalidatePath("/app/ops");
  revalidatePath("/app/finance");
  revalidatePath("/app/ops/packages");
  revalidatePath("/app/ops/orders");
  revalidatePath("/app/flights");
  revalidatePath("/app/finance/payroll");
  revalidatePath("/app/finance/quotes");
  revalidatePath("/app/finance/expenses");
  revalidatePath("/orders");
}

async function writeOrderActivity(
  orderId: string,
  actorId: string,
  fromStatus: string | null,
  toStatus: string,
  line: string,
) {
  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { activityLine: line },
  });
  await prisma.statusEvent.create({
    data: { clinicOrderId: orderId, fromStatus, toStatus, note: line, actorId },
  });
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
      activityLine: "Clinic submitted order · waiting on admin review.",
      events: {
        create: {
          toStatus: "SUBMITTED",
          actorId: user.id,
          note: "Clinic submitted order · waiting on admin review.",
        },
      },
    },
  });
  await ensureLinkedShipment(order.id, user.id);
  revalidateApp();
  return { ok: true, id: order.id };
}

export async function requestClinicInvite(form: {
  token: string;
  name: string;
  email: string;
  clinicName: string;
  country: string;
  city: string;
}) {
  const email = form.email.toLowerCase().trim();
  if (!email || !form.name.trim() || !form.clinicName.trim()) {
    return { error: "Name, email, and clinic are required." };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has a seat. Sign in." };

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const clinic = await prisma.clinic.create({
    data: {
      name: form.clinicName.trim(),
      country: form.country.trim() || "USA",
      city: form.city.trim() || "Fort Lauderdale",
      market: form.country.trim().toUpperCase() === "USA" ? "USA" : "INTL",
      type: "Clinic",
      approved: false,
      address: "Pending",
      contactEmail: email,
      licenseNote: `Invite token ${form.token}`,
      activityLine: "Invite received · waiting on Clint to approve. Seat stays inactive.",
    },
  });
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: form.name.trim(),
      role: "CLINIC_ADMIN",
      active: false,
      clinicId: clinic.id,
    },
  });
  await prisma.crmAccount.create({
    data: {
      name: clinic.name,
      kind: "Clinic",
      market: clinic.market,
      country: clinic.country,
      stage: "ELIGIBILITY_REVIEW",
      clinicId: clinic.id,
      activityLine: "Invite landing · no patient data.",
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function approveClinic(clinicId: string, approve: boolean) {
  const admin = await requireRole(["MEDSTEAD_ADMIN"]);
  const line = approve
    ? "Admin approved clinic · they can order without a call."
    : "Admin revoked approval · clinic seats inactive.";
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { approved: approve, activityLine: line },
  });
  await prisma.user.updateMany({
    where: { clinicId, role: { in: CLINIC_ROLES } },
    data: { active: approve },
  });
  await prisma.crmAccount.updateMany({
    where: { clinicId },
    data: {
      stage: approve ? "ACTIVATED" : "ELIGIBILITY_REVIEW",
      activityLine: line,
    },
  });
  void admin;
  revalidateApp();
  return { ok: true };
}

export async function overrideClinicStatus(orderId: string, status: ClinicOrderStatus, note?: string) {
  const admin = await requireRole(["MEDSTEAD_ADMIN"]);
  if (!CLINIC_ORDER_STATUSES.includes(status)) return { error: "Invalid status." };
  const result = await advanceClinicOrder(
    orderId,
    status,
    admin.id,
    note || `Admin overrode status · both machines moved to stay in sync.`,
  );
  revalidateApp();
  return result;
}

export async function generateInvoice(orderId: string) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "FINANCE"]);
  const order = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: true },
  });
  if (!order) return { error: "Order not found." };
  if (order.status !== "APPROVED") return { error: "Approve the order before invoicing." };
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
  await advanceClinicOrder(
    orderId,
    "INVOICE_GENERATED",
    actor.id,
    "Finance generated invoice · waiting on payment pending.",
  );
  revalidateApp();
  return { ok: true };
}

export async function markPaymentPending(orderId: string) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "FINANCE"]);
  const order = await prisma.clinicOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (order.status !== "INVOICE_GENERATED") return { error: "Generate the invoice first." };
  await advanceClinicOrder(
    orderId,
    "PAYMENT_PENDING",
    actor.id,
    "Finance sent invoice · waiting on clinic payment.",
  );
  revalidateApp();
  return { ok: true };
}

export async function recordPayment(invoiceId: string, amount: number, method: string, online: boolean) {
  const actor = await requireUser();
  const allowed =
    actor.role === "FINANCE" ||
    actor.role === "MEDSTEAD_ADMIN" ||
    CLINIC_ROLES.includes(actor.role);
  if (!allowed) return { error: "Not allowed to record payment." };
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: true },
  });
  if (!invoice) return { error: "Invoice not found." };
  if (CLINIC_ROLES.includes(actor.role) && invoice.order.clinicId !== actor.clinicId) {
    return { error: "Not your clinic invoice." };
  }
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
    const line = CLINIC_ROLES.includes(actor.role)
      ? "Clinic paid invoice · waiting on ops to prepare shipment and run gates."
      : "Finance marked paid · waiting on ops to prepare shipment and run gates.";
    await advanceClinicOrder(invoice.orderId, "PAYMENT_RECEIVED", actor.id, line);
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

  if (!order.shipment) {
    await ensureLinkedShipment(orderId, actor.id);
  }
  const fresh = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { shipment: { include: { gates: true } } },
  });
  if (fresh?.shipment) {
    const allGreen =
      fresh.shipment.gates.length === GATE_ORDER.length &&
      fresh.shipment.gates.every((g) => g.state === "GREEN");
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
  const line = "Manifest generated · waiting on Del to confirm the delivery date.";
  await advanceClinicOrder(orderId, "MANIFEST_GENERATED", actor.id, line);
  revalidateApp();
  return { ok: true };
}

export async function setCrmStage(id: string, stage: CrmStage, holdReason?: string) {
  await requireRole(["MEDSTEAD_ADMIN"]);
  await prisma.crmAccount.update({
    where: { id },
    data: {
      stage,
      holdReason: stage === "HOLD" || stage === "LOST" ? holdReason : null,
      activityLine: `CRM moved to ${stage} · no patient data.`,
    },
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
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { gates: true, clinicOrder: true },
  });
  if (shipment) {
    const fresh = await prisma.releaseGate.findMany({ where: { shipmentId } });
    const green = GATE_ORDER.filter((n) => fresh.some((g) => g.name === n && g.state === "GREEN")).length;
    const line =
      green === GATE_ORDER.length
        ? "All six gates green · waiting on ops to generate manifest."
        : `${GATE_LABEL[name]} ${state.toLowerCase()} · ${green}/6 gates green.`;
    await prisma.shipment.update({ where: { id: shipmentId }, data: { activityLine: line } });
    if (shipment.clinicOrderId) {
      await prisma.clinicOrder.update({
        where: { id: shipment.clinicOrderId },
        data: { activityLine: line },
      });
    }
  }
  revalidateApp();
  return { ok: true };
}

export async function setShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  const actor = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  if (!SHIPMENT_STATUSES.includes(status)) return { error: "Invalid shipment status." };
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { gates: true, clinicOrder: { include: { clinic: true, manifest: true } } },
  });
  if (!shipment) return { error: "Shipment not found." };
  if (status === "RELEASED_MANIFESTED") {
    const allGreen =
      shipment.gates.length === GATE_ORDER.length &&
      shipment.gates.every((g) => g.state === "GREEN");
    if (!allGreen) return { error: "All six gates must be green before release / manifest." };
    if (shipment.clinicOrder && !shipment.clinicOrder.manifest) {
      const dest = shipment.clinicOrder.clinic.market === "USA" ? "FLL" : "NAS";
      await prisma.manifest.create({
        data: {
          number: `MAN-${shipment.clinicOrder.orderNumber.replace("CO-", "")}`,
          orderId: shipment.clinicOrder.id,
          origin: "FLL",
          destination: dest,
        },
      });
    }
  }
  const line =
    status === "RELEASED_MANIFESTED"
      ? "Ops released / manifested · clinic order is Manifest Generated. Public clock is on."
      : status === "IN_TRANSIT"
        ? "Ops marked in transit · clinic order followed to In Transit. Public clock is on."
        : status === "DELIVERED_CLOSED"
          ? "Ops marked delivered · clinic order is Delivered."
          : `Ops moved logistics to ${status} · clinic status followed.`;
  await advanceShipment(shipmentId, status, actor.id, line);
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
  retailerUrl?: string;
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
      retailerUrl: input.retailerUrl,
      status: "UNDER_REVIEW",
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
        retailerUrl: input.retailerUrl,
        gates: { create: GATE_ORDER.map((name) => ({ name })) },
        events: { create: { toStatus: "QUOTED", actorId: sessionUser.id, note: "Quoted · under review" } },
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
  revalidatePath("/shop-and-ship");
  revalidatePath("/app/customer");
  revalidatePath("/app/finance/quotes");
  return {
    ok: true,
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    status: "UNDER_REVIEW",
    ...amounts,
    shipmentCode,
  };
}

export async function approveFreightQuote(quoteId: string) {
  const actor = await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const quote = await prisma.freightQuote.findUnique({
    where: { id: quoteId },
    include: { shipment: true },
  });
  if (!quote) return { error: "Quote not found." };
  if (quote.status === "APPROVED") return { error: "Already approved." };
  await prisma.freightQuote.update({
    where: { id: quoteId },
    data: { status: "APPROVED" },
  });
  if (quote.shipment) {
    await advanceShipment(
      quote.shipment.id,
      "APPROVED_PAID",
      actor.id,
      "Finance approved quote · waiting on origin receive at C15.",
    );
  }
  revalidateApp();
  return { ok: true };
}

export async function submitExpense(form: {
  title: string;
  amount: number;
  incurredAt: string;
  note?: string;
}) {
  const user = await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  if (!form.title.trim()) return { error: "Add a title." };
  if (!(form.amount > 0)) return { error: "Amount must be greater than zero." };
  const incurredAt = new Date(form.incurredAt);
  if (Number.isNaN(incurredAt.getTime())) return { error: "Need a date." };
  await prisma.expenseReport.create({
    data: {
      userId: user.id,
      title: form.title.trim(),
      amount: form.amount,
      incurredAt,
      note: form.note?.trim() || null,
      status: "SUBMITTED",
    },
  });
  revalidatePath("/app/finance/expenses");
  revalidatePath("/app/admin");
  return { ok: true };
}

function corridorForDest(destination: string): FlightCorridor | null {
  if (destination === "NAS") return "FLL_NAS";
  if (destination === "FPO") return "FLL_FPO";
  if (destination === "MSY") return "FLL_MSY";
  return null;
}

async function nextFlightCode(corridor: FlightCorridor) {
  const n = await prisma.flight.count();
  return `FL-${corridor.replace("_", "-")}-${String(n + 1).padStart(3, "0")}`;
}

export async function dispatchFlight(shipmentId: string) {
  const actor = await requireRole(["OPS"]);
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { gates: true, clinicOrder: { include: { invoice: true } }, flight: true },
  });
  if (!shipment) return { error: "Package not found." };
  const corridor = corridorForDest(shipment.destination);
  if (!corridor) return { error: "No flight corridor for this destination." };
  if (corridor === "FLL_MSY") return { error: "Gulf Coast / New Orleans is not live yet." };
  const allGreen =
    shipment.gates.length === GATE_ORDER.length &&
    shipment.gates.every((g) => g.state === "GREEN");
  if (!allGreen) return { error: "All six gates must be green before dispatch." };
  if (shipment.clinicOrder?.invoice && shipment.clinicOrder.invoice.status !== "paid") {
    return { error: "Finance must mark paid / credit before dispatch." };
  }
  if (
    shipment.status !== "RELEASED_MANIFESTED" &&
    shipment.status !== "IN_TRANSIT" &&
    shipment.clinicOrder?.status !== "MANIFEST_GENERATED" &&
    shipment.clinicOrder?.status !== "SHIPPED"
  ) {
    return { error: "Release / manifest first. Doctor does not need to approve dispatch." };
  }

  let flight = shipment.flight;
  if (!flight) {
    flight = await prisma.flight.create({
      data: {
        flightCode: await nextFlightCode(corridor),
        corridor,
        live: true,
        phase: "DEPARTED",
        goNoGo: "GO",
        origin: "FLL",
        destination: shipment.destination,
        dispatchedAt: new Date(),
        activityLine: "Del dispatched flight · doctor does not block cargo.",
      },
    });
    await prisma.shipment.update({ where: { id: shipmentId }, data: { flightId: flight.id } });
  } else {
    if (flight.corridor === "FLL_MSY" || !flight.live) {
      return { error: "This corridor is not live." };
    }
    await prisma.flight.update({
      where: { id: flight.id },
      data: {
        phase: "DEPARTED",
        goNoGo: "GO",
        dispatchedAt: new Date(),
        activityLine: "Del dispatched flight · clinic order follows to In Transit.",
      },
    });
  }

  const line =
    "Del dispatched flight · package is In Transit. Public clock is on. Doctor does not need a call.";
  await advanceShipment(shipmentId, "IN_TRANSIT", actor.id, line);
  revalidateApp();
  return { ok: true, flightCode: flight.flightCode };
}

export async function setFlightPhase(flightId: string, phase: FlightPhase, goNoGo?: string) {
  const actor = await requireRole(["OPS"]);
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return { error: "Flight not found." };
  if (!flight.live) return { error: "This corridor is not live yet." };
  await prisma.flight.update({
    where: { id: flightId },
    data: {
      phase,
      goNoGo: goNoGo ?? flight.goNoGo,
      activityLine:
        phase === "T24_FREEZE"
          ? "Del froze the manifest · T-6 go/no-go is next."
          : phase === "T6_GO_NO_GO"
            ? goNoGo === "NO_GO"
              ? "Del called no-go · flight stays on the ground."
              : "Del called GO · dispatch when the package is released."
            : `Flight moved to ${phase}.`,
    },
  });
  void actor;
  revalidateApp();
  return { ok: true };
}

export async function markScheduledPaySent(id: string) {
  await requireRole(["FINANCE", "MEDSTEAD_ADMIN"]);
  const row = await prisma.scheduledPay.findUnique({ where: { id } });
  if (!row) return { error: "Pay date not found." };
  if (row.status === "SENT") return { error: "Already marked sent." };
  await prisma.scheduledPay.update({
    where: { id },
    data: { status: "SENT", note: row.note },
  });
  revalidateApp();
  return { ok: true };
}

export async function createFreightAccount(form: {
  name: string;
  email: string;
  password: string;
}) {
  const email = form.email.toLowerCase().trim();
  const name = form.name.trim();
  if (!email || !name) return { error: "Name and email are required." };
  if (form.password.length < 8) return { error: "Password must be at least 8 characters." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has a seat. Sign in." };
  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(form.password, 10);
  const warehouseCode = `MS-C15-${String(1000 + Math.floor(Math.random() * 8000))}`;
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "CUSTOMER",
      active: true,
      rewardsPoints: WELCOME_POINTS,
      warehouseCode,
    },
  });
  return { ok: true };
}

export async function ensureCustomerWarehouse() {
  const user = await requireUser();
  if (user.warehouseCode) return user.warehouseCode;
  const code = `MS-C15-${String(1000 + Math.floor(Math.random() * 8000))}`;
  await prisma.user.update({ where: { id: user.id }, data: { warehouseCode: code } });
  return code;
}

export async function runNextAction(input: {
  kind: QueueKind;
  clinicId?: string;
  orderId?: string;
  invoiceId?: string;
  shipmentId?: string;
  crmId?: string;
  gate?: GateName;
  date?: string;
  flightId?: string;
  quoteId?: string;
}) {
  if (input.kind === "open") return { ok: true };

  if (input.kind === "approve_quote" && input.quoteId) {
    return approveFreightQuote(input.quoteId);
  }

  if (input.kind === "approve_clinic" && input.clinicId) {
    return approveClinic(input.clinicId, true);
  }

  if (input.kind === "start_review" && input.orderId) {
    const admin = await requireRole(["MEDSTEAD_ADMIN"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order || order.status !== "SUBMITTED") return { error: "Order is not waiting for review." };
    await advanceClinicOrder(
      input.orderId,
      "UNDER_REVIEW",
      admin.id,
      "Admin started review · waiting on Clint to approve so finance can invoice.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "approve_order" && input.orderId) {
    const admin = await requireRole(["MEDSTEAD_ADMIN"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order || order.status !== "UNDER_REVIEW") return { error: "Order is not under review." };
    await advanceClinicOrder(
      input.orderId,
      "APPROVED",
      admin.id,
      "Admin approved order · waiting on finance to generate invoice.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "crm_followup" && input.crmId) {
    await requireRole(["MEDSTEAD_ADMIN"]);
    await prisma.crmAccount.update({
      where: { id: input.crmId },
      data: {
        stage: "ELIGIBILITY_REVIEW",
        followUpAt: new Date(Date.now() + 48 * 3600 * 1000),
        activityLine: "Clint logged 48h follow-up · waiting on eligibility review. No patient data.",
      },
    });
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "crm_activate" && input.crmId) {
    await requireRole(["MEDSTEAD_ADMIN"]);
    const crm = await prisma.crmAccount.findUnique({ where: { id: input.crmId } });
    if (!crm) return { error: "CRM account not found." };
    if (crm.clinicId) {
      await approveClinic(crm.clinicId, true);
    }
    await prisma.crmAccount.update({
      where: { id: input.crmId },
      data: {
        stage: "ACTIVATED",
        activityLine: "Clint activated clinic · they can order without a call.",
      },
    });
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "generate_invoice" && input.orderId) {
    return generateInvoice(input.orderId);
  }
  if (input.kind === "mark_payment_pending" && input.orderId) {
    return markPaymentPending(input.orderId);
  }
  if (input.kind === "mark_paid" && input.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) return { error: "Invoice not found." };
    return recordPayment(input.invoiceId, invoice.amount - invoice.paidAmount, "In-app (demo)", true);
  }
  if (input.kind === "clinic_pay" && input.invoiceId) {
    const user = await requireUser();
    if (!CLINIC_ROLES.includes(user.role) || !clinicApproved(user)) {
      return { error: "Clinic is not approved." };
    }
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { order: true },
    });
    if (!invoice || invoice.order.clinicId !== user.clinicId) return { error: "Invoice not found." };
    if (invoice.order.status !== "PAYMENT_PENDING") return { error: "Invoice is not waiting for payment." };
    return recordPayment(input.invoiceId, invoice.amount - invoice.paidAmount, "Clinic paid in-app", true);
  }

  if (input.kind === "sign_finance_gate" && input.shipmentId) {
    return setGate(input.shipmentId, "COMMERCIAL_FINANCE", "GREEN", "Finance signed payment / credit.");
  }

  if (input.kind === "prepare_shipment" && input.orderId) {
    const actor = await requireRole(["OPS"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order) return { error: "Order not found." };
    if (order.status !== "PAYMENT_RECEIVED" && order.status !== "PREPARING_SHIPMENT") {
      return { error: "Order is not ready to prepare." };
    }
    await ensureLinkedShipment(input.orderId, actor.id);
    await advanceClinicOrder(
      input.orderId,
      "PREPARING_SHIPMENT",
      actor.id,
      "Ops preparing shipment · waiting on six-gate release. Del owns delivery dates.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "mark_origin_received" && input.shipmentId) {
    const actor = await requireRole(["OPS"]);
    await advanceShipment(
      input.shipmentId,
      "ORIGIN_RECEIVED_HOLD",
      actor.id,
      "Origin received-hold · clinic stays Preparing Shipment until gates and manifest.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "green_gate" && input.shipmentId && input.gate) {
    const actor = await requireRole(["OPS"]);
    if (input.gate === "COMMERCIAL_FINANCE") {
      return { error: "Finance signs the commercial / finance gate." };
    }
    void actor;
    return setGate(input.shipmentId, input.gate, "GREEN", "Ops cleared gate.");
  }

  if (input.kind === "generate_manifest" && input.orderId) {
    return generateManifest(input.orderId);
  }

  if (input.kind === "set_delivery_date" && input.orderId) {
    const actor = await requireRole(["OPS"]);
    if (!input.date) return { error: "Pick a delivery date. Del owns date promises." };
    const when = new Date(input.date);
    if (Number.isNaN(when.getTime())) return { error: "Invalid date." };
    const line = "Del confirmed delivery date · waiting on ops to mark shipped. Sales cannot promise dates.";
    await prisma.clinicOrder.update({
      where: { id: input.orderId },
      data: { promisedDate: when, activityLine: line },
    });
    await prisma.shipment.updateMany({
      where: { clinicOrderId: input.orderId },
      data: { promisedDate: when, activityLine: line },
    });
    await writeOrderActivity(input.orderId, actor.id, "MANIFEST_GENERATED", "MANIFEST_GENERATED", line);
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "mark_shipped" && input.orderId) {
    const actor = await requireRole(["OPS"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order) return { error: "Order not found." };
    if (order.status !== "MANIFEST_GENERATED") return { error: "Generate the manifest first." };
    if (!order.promisedDate) return { error: "Del must confirm a delivery date first." };
    await advanceClinicOrder(
      input.orderId,
      "SHIPPED",
      actor.id,
      "Ops marked shipped · logistics is In Transit. Clinic can track without calling.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "mark_in_transit" && input.orderId) {
    const actor = await requireRole(["OPS"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order || order.status !== "SHIPPED") return { error: "Mark shipped first." };
    await advanceClinicOrder(
      input.orderId,
      "IN_TRANSIT",
      actor.id,
      "Ops confirmed in transit · waiting on destination / delivery. Do not WhatsApp Del.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "mark_delivered" && input.orderId) {
    const actor = await requireRole(["OPS"]);
    const order = await prisma.clinicOrder.findUnique({ where: { id: input.orderId } });
    if (!order || (order.status !== "IN_TRANSIT" && order.status !== "SHIPPED")) {
      return { error: "Order is not in transit." };
    }
    await advanceClinicOrder(
      input.orderId,
      "DELIVERED",
      actor.id,
      "Ops marked delivered · logistics is Delivered/Closed.",
    );
    revalidateApp();
    return { ok: true };
  }

  if (input.kind === "release_shipment" && input.shipmentId) {
    return setShipmentStatus(input.shipmentId, "RELEASED_MANIFESTED");
  }

  if (input.kind === "freeze_manifest" && input.flightId) {
    return setFlightPhase(input.flightId, "T24_FREEZE");
  }
  if (input.kind === "go_no_go" && input.flightId) {
    return setFlightPhase(input.flightId, "T6_GO_NO_GO", "GO");
  }
  if (input.kind === "dispatch_flight" && input.shipmentId) {
    return dispatchFlight(input.shipmentId);
  }

  return { error: "Unknown next action." };
}
