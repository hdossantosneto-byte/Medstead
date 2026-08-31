"use server";

import {
  ClinicOrderStatus,
  CrmStage,
  FlightCorridor,
  FlightPhase,
  FlightTripType,
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
  CALL_CENTER_SOURCE,
  CURRENT_FLEET_ASSIGN,
  WELCOME_POINTS,
} from "./constants";
import { parseReceivedAt } from "./call-center";
import { fleetLine } from "./fleet";
import { prisma } from "./prisma";
import { unitPriceForQty } from "./pricing";
import { auth, requireRole, requireUser, clinicApproved } from "./session";
import { nextShipmentCode } from "./shipment-id";
import type { QueueKind } from "./queue";
import { advanceClinicOrder, advanceShipment, ensureLinkedShipment } from "./handoff";
import { isDel } from "./org";

function revalidateApp() {
  revalidatePath("/app");
  revalidatePath("/app/clinic/orders");
  revalidatePath("/app/admin");
  revalidatePath("/app/ops");
  revalidatePath("/app/finance");
  revalidatePath("/app/ops/packages");
  revalidatePath("/app/ops/orders");
  revalidatePath("/app/flights");
  revalidatePath("/app/flights/135");
  revalidatePath("/app/travel");
  revalidatePath("/app/clinic/charter");
  revalidatePath("/app/sales");
  revalidatePath("/app/finance/payroll");
  revalidatePath("/app/finance/payables");
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

async function nextFlightCode(corridor: FlightCorridor, tripType: FlightTripType = "MEDICAL_CARGO") {
  const n = await prisma.flight.count();
  const seq = String(n + 1).padStart(3, "0");
  if (tripType === "MEDICAL_CARGO") {
    return `FL-${corridor.replace("_", "-")}-${seq}`;
  }
  const tag =
    tripType === "COMPANY_TRAVEL"
      ? "TRAV"
      : tripType === "PERSONAL_GOODS"
        ? "PERS"
        : tripType === "RESCUE_ORGAN"
          ? "RSC"
          : "CHTR";
  return `MTG-A-${tag}-${seq}`;
}

async function defaultPilotId() {
  const pilot = await prisma.user.findFirst({ where: { role: "PILOT", active: true } });
  return pilot?.id ?? null;
}

function airBrief(flight: {
  flightCode: string;
  tripType: string;
  origin: string;
  destination: string;
  timeCritical?: boolean;
}) {
  const kind =
    flight.tripType === "RESCUE_ORGAN"
      ? "organ"
      : flight.tripType === "DOCTOR_CHARTER" || flight.tripType === "COMPANY_TRAVEL"
        ? "passengers"
        : "cargo";
  const clock = flight.timeCritical ? "TIME-CRITICAL clock on" : "scheduled";
  return `${flight.flightCode} · ${flight.tripType.replaceAll("_", " ")} · ${flight.origin}→${flight.destination} · ${kind} · ${clock}`;
}

async function advisePilot(flightId: string, actorLine: string) {
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return;
  const pilotId = flight.assignedPilotId ?? (await defaultPilotId());
  const brief = airBrief(flight);
  await prisma.flight.update({
    where: { id: flightId },
    data: {
      assignedPilotId: pilotId ?? undefined,
      pilotAdvisedAt: new Date(),
      activityLine: `${actorLine} Pilot advised in-app · ${brief}. No WhatsApp.`,
    },
  });
}

async function attachAircraft(flightId: string, aircraftId?: string | null) {
  if (!aircraftId) return { ok: true as const };
  const ac = await prisma.aircraft.findUnique({ where: { id: aircraftId } });
  if (!ac) return { error: "Aircraft not found." };
  if (ac.status !== "CURRENT") return { error: "Pick a current-fleet aircraft. MX and down stay on the ground." };
  await prisma.flight.update({
    where: { id: flightId },
    data: { aircraftId: ac.id, aircraftNote: fleetLine(ac) },
  });
  return { ok: true as const };
}

export async function addAircraft(form: {
  name: string;
  type?: string;
  tailNumber?: string;
  homeBase?: string;
}) {
  const actor = await requireUser();
  const allowed = actor.role === "MEDSTEAD_ADMIN" || (actor.role === "OPS" && isDel(actor));
  if (!allowed) return { error: "Only Del or admin can add a current-fleet aircraft." };
  const name = form.name.trim();
  const type = form.type?.trim() || null;
  const tailNumber = form.tailNumber?.trim().toUpperCase() || null;
  const homeBase = (form.homeBase?.trim().toUpperCase() || "FLL").slice(0, 8);
  if (!name) return { error: "Callsign or name is required." };
  const blocked = `${name} ${type ?? ""}`.toLowerCase();
  if (/\b(islander|flying[- ]club|pompano)\b/.test(blocked)) {
    return { error: "Flying-club and unnamed types stay off this fleet." };
  }
  if (tailNumber) {
    const taken = await prisma.aircraft.findUnique({ where: { tailNumber } });
    if (taken) return { error: "That tail is already on the current fleet." };
  }
  await prisma.aircraft.create({
    data: {
      name,
      type,
      tailNumber,
      homeBase,
      status: "CURRENT",
      corridors: "FLL_NAS,FLL_FPO",
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function assignAircraft(flightId: string, aircraftId: string) {
  const actor = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  if (actor.role === "OPS" && !isDel(actor)) {
    return { error: "Only Del assigns a current-fleet aircraft." };
  }
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return { error: "Trip not found." };
  const attached = await attachAircraft(flightId, aircraftId);
  if ("error" in attached) return attached;
  revalidateApp();
  return { ok: true };
}

export async function dispatchFlight(shipmentId: string, aircraftId?: string) {
  const actor = await requireRole(["OPS"]);
  if (!isDel(actor)) return { error: "Only Del dispatches flights. Warehouse ops pick and pack." };
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
        flightCode: await nextFlightCode(corridor, "MEDICAL_CARGO"),
        corridor,
        tripType: "MEDICAL_CARGO",
        tripStatus: "DISPATCHED",
        live: true,
        phase: "DEPARTED",
        goNoGo: "GO",
        origin: "FLL",
        destination: shipment.destination,
        dispatchedAt: new Date(),
        aircraftNote: CURRENT_FLEET_ASSIGN,
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
        tripStatus: "DISPATCHED",
        dispatchedAt: new Date(),
        activityLine: "Del dispatched flight · clinic order follows to In Transit.",
      },
    });
  }

  const attached = await attachAircraft(flight.id, aircraftId);
  if ("error" in attached) return attached;

  const line =
    "Del dispatched flight · package is In Transit. Public clock is on. Doctor does not need a call.";
  await advanceShipment(shipmentId, "IN_TRANSIT", actor.id, line);
  await advisePilot(flight.id, "Del dispatched medical cargo ·");
  revalidateApp();
  return { ok: true, flightCode: flight.flightCode };
}

export async function setFlightPhase(flightId: string, phase: FlightPhase, goNoGo?: string) {
  const actor = await requireRole(["OPS"]);
  if (!isDel(actor)) return { error: "Only Del runs the flight-day board." };
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

export async function requestAirTrip(form: {
  tripType: FlightTripType;
  origin: string;
  destination: string;
  purpose: string;
  passengerNote: string;
  custodyNote?: string;
  temperatureNote?: string;
}) {
  const user = await requireUser();
  if (user.role === "FINANCE" || user.role === "PILOT") {
    return { error: "Finance and pilots do not open trips. Del owns the board." };
  }

  const tripType = form.tripType;
  if (tripType === "DOCTOR_CHARTER") {
    if (!CLINIC_ROLES.includes(user.role) && user.role !== "SALES") {
      return { error: "Only a clinic seat or sales can request a doctor charter." };
    }
    if (CLINIC_ROLES.includes(user.role) && (!clinicApproved(user) || !user.clinic)) {
      return { error: "Clinic must be approved first." };
    }
  } else if (tripType === "COMPANY_TRAVEL") {
    if (user.role !== "MEDSTEAD_ADMIN" && user.role !== "OPS" && user.role !== "SALES") {
      return { error: "Company travel is for MedStead people. Del dispatches." };
    }
  } else if (tripType === "PERSONAL_GOODS") {
    if (user.role !== "CUSTOMER" && user.role !== "MEDSTEAD_ADMIN" && user.role !== "OPS") {
      return { error: "Personal goods moves start from a freight seat or admin." };
    }
  } else if (tripType === "RESCUE_ORGAN") {
    if (user.role !== "MEDSTEAD_ADMIN" && user.role !== "OPS" && !CLINIC_ROLES.includes(user.role)) {
      return { error: "Rescue organ trips are opened by ops, admin, or an approved clinic." };
    }
    if (CLINIC_ROLES.includes(user.role) && (!clinicApproved(user) || !user.clinic)) {
      return { error: "Clinic must be approved first." };
    }
  } else {
    return { error: "Medical cargo is dispatched from the package board, not this form." };
  }

  const dest = form.destination.trim().toUpperCase();
  const corridor = corridorForDest(dest);
  if (!corridor) return { error: "Pick NAS, FPO, or MSY. Mexico / MSY stay labeled not live." };
  const live = corridor === "FLL_NAS" || corridor === "FLL_FPO";
  const purpose = form.purpose.trim();
  const passengerNote = form.passengerNote.trim();
  if (!purpose || !passengerNote) return { error: "Purpose and who is on the trip are required. No patient names." };

  const rescue = tripType === "RESCUE_ORGAN";
  await prisma.flight.create({
    data: {
      flightCode: await nextFlightCode(corridor, tripType),
      corridor,
      tripType,
      tripStatus: rescue ? "SCHEDULED" : "REQUESTED",
      live,
      phase: rescue ? "T6_GO_NO_GO" : "T48_PREP",
      goNoGo: rescue ? "GO" : null,
      origin: form.origin.trim().toUpperCase() || "FLL",
      destination: dest,
      requestedById: user.id,
      passengerNote,
      purpose,
      timeCritical: rescue,
      clockStartedAt: rescue ? new Date() : null,
      custodyNote: rescue ? form.custodyNote?.trim() || "Chain of custody open · in-app only." : null,
      temperatureNote: rescue ? form.temperatureNote?.trim() || "Temperature note TBD." : null,
      assignedPilotId: (await defaultPilotId()) ?? undefined,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: rescue
        ? "TIME-CRITICAL rescue organ trip opened · dispatch of a rescue organ trip. Not an OPO or UNOS claim. Notify pilots in-app."
        : tripType === "DOCTOR_CHARTER"
          ? "Doctor charter requested · not a clinic supply order. Waiting on Del to schedule. No WhatsApp."
          : "Air-arm request in. Del owns dispatch across trip types.",
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function scheduleAirTrip(flightId: string) {
  const actor = await requireRole(["OPS"]);
  if (!isDel(actor)) return { error: "Only Del schedules MTG Airlines trips." };
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return { error: "Trip not found." };
  if (!flight.live || flight.corridor === "FLL_MSY") {
    return { error: "This corridor is not live yet." };
  }
  await prisma.flight.update({
    where: { id: flightId },
    data: {
      tripStatus: "SCHEDULED",
      phase: "T6_GO_NO_GO",
      goNoGo: "GO",
      activityLine: "Del scheduled the trip · Dispatch is next. Finance cannot fly.",
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function dispatchAirTrip(flightId: string, aircraftId?: string) {
  const actor = await requireRole(["OPS"]);
  if (!isDel(actor)) return { error: "Only Del dispatches. Warehouse ops pick and pack." };
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: { shipments: true },
  });
  if (!flight) return { error: "Trip not found." };
  if (!flight.live || flight.corridor === "FLL_MSY") {
    return { error: "This corridor is not live yet." };
  }
  const cargo = flight.shipments[0];
  if (flight.tripType === "MEDICAL_CARGO" && cargo) {
    return dispatchFlight(cargo.id);
  }
  await prisma.flight.update({
    where: { id: flightId },
    data: {
      phase: "DEPARTED",
      goNoGo: "GO",
      tripStatus: "DISPATCHED",
      dispatchedAt: new Date(),
      assignedPilotId: flight.assignedPilotId ?? (await defaultPilotId()) ?? undefined,
      activityLine: "Del dispatched MTG Airlines trip · doctor does not block the air arm.",
    },
  });
  const attached = await attachAircraft(flightId, aircraftId);
  if ("error" in attached) return attached;
  await advisePilot(flightId, "Del dispatched ·");
  revalidateApp();
  return { ok: true, flightCode: flight.flightCode };
}

export async function notifyPilots(flightId: string) {
  const actor = await requireRole(["OPS"]);
  if (!isDel(actor)) return { error: "Only Del notifies pilots in-app." };
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return { error: "Trip not found." };
  await advisePilot(flightId, "Notify pilots ·");
  revalidateApp();
  return { ok: true };
}

export async function acknowledgePilotBrief(flightId: string) {
  const user = await requireUser();
  if (user.role !== "PILOT") return { error: "Only the assigned pilot acknowledges a brief." };
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return { error: "Trip not found." };
  if (flight.assignedPilotId && flight.assignedPilotId !== user.id) {
    return { error: "This brief is assigned to another pilot." };
  }
  await prisma.flight.update({
    where: { id: flightId },
    data: {
      assignedPilotId: user.id,
      activityLine: `Pilot ${user.name} acknowledged in-app · ${airBrief(flight)}. No text thread.`,
    },
  });
  revalidateApp();
  return { ok: true };
}

const CALL_TYPES = ["ORGAN_RESCUE", "MEDICAL_CARGO", "DOCTOR_CHARTER", "OTHER_URGENT_MEDICAL"] as const;
const CALL_URGENCIES = ["ROUTINE", "URGENT", "ORGAN_CLOCK"] as const;

function normalizeCallEnum<T extends string>(raw: string | undefined, allowed: readonly T[]): T | null {
  const v = (raw ?? "").trim().toUpperCase().replace(/-/g, "_");
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export async function persistIncomingCall(
  input: {
    callerName: string;
    callerPhone: string;
    callbackPhone?: string;
    callerOrg?: string;
    callType: string;
    origin?: string;
    destination: string;
    notes?: string;
    urgency?: string;
    source?: string;
    receivedAt?: string;
  },
  actorId?: string | null,
) {
  const callerName = input.callerName.trim();
  const callerPhone = input.callerPhone.trim();
  const callbackPhone = input.callbackPhone?.trim() || null;
  const dest = input.destination.trim().toUpperCase();
  const callType = normalizeCallEnum(input.callType, CALL_TYPES);
  const urgencyRaw =
    input.urgency?.trim() || (input.callType.toLowerCase().replace(/-/g, "_") === "organ_rescue" ? "organ_clock" : "urgent");
  const urgency = normalizeCallEnum(urgencyRaw, CALL_URGENCIES);
  if (!callType) return { error: "Unknown call type." };
  if (!urgency) return { error: "Unknown urgency." };
  if (!callerName || !callerPhone) return { error: "Caller name and phone are required. No patient identifiers." };
  if (!dest) return { error: "Destination is required." };
  const received = parseReceivedAt(input.receivedAt);
  if (received && typeof received === "object" && "error" in received) return received;
  const corridor = corridorForDest(dest);
  if (!corridor) return { error: "Pick NAS, FPO, or MSY. Mexico / MSY stay labeled not live." };
  const live = corridor === "FLL_NAS" || corridor === "FLL_FPO";
  const origin = (input.origin || "FLL").trim().toUpperCase();
  const org = input.callerOrg?.trim() || "Phone intake";
  const notes = input.notes?.trim() || "";
  const rescue = callType === "ORGAN_RESCUE";
  const tripType: FlightTripType =
    rescue
      ? "RESCUE_ORGAN"
      : callType === "DOCTOR_CHARTER"
        ? "DOCTOR_CHARTER"
        : "MEDICAL_CARGO";
  const phoneLine = `Phone intake · ${org} · ${callerPhone} · routed to Del. Do not re-type. No patient name.`;

  const flight = await prisma.flight.create({
    data: {
      flightCode: await nextFlightCode(corridor, tripType),
      corridor,
      tripType,
      tripStatus: rescue || tripType === "MEDICAL_CARGO" ? "SCHEDULED" : "REQUESTED",
      live,
      phase: rescue ? "T6_GO_NO_GO" : tripType === "MEDICAL_CARGO" ? "T6_GO_NO_GO" : "T48_PREP",
      goNoGo: rescue || tripType === "MEDICAL_CARGO" ? "GO" : null,
      origin,
      destination: dest,
      requestedById: actorId || undefined,
      passengerNote: `${org} · phone origin. No patient name.`,
      purpose: notes || `${tripType.replaceAll("_", " ")} from call center.`,
      timeCritical: rescue,
      clockStartedAt: rescue ? (received as Date) : null,
      custodyNote: rescue ? "Chain of custody open · phone intake · in-app only." : null,
      temperatureNote: rescue ? "Temperature note from the call. No patient identifiers." : null,
      assignedPilotId: (await defaultPilotId()) ?? undefined,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: rescue
        ? `TIME-CRITICAL ${phoneLine}`
        : phoneLine,
    },
  });

  const call = await prisma.callLog.create({
    data: {
      receivedAt: received as Date,
      callerName,
      callerPhone,
      callbackPhone,
      callerOrg: input.callerOrg?.trim() || null,
      callType,
      origin,
      destination: dest,
      notes: notes || null,
      urgency,
      source: input.source?.trim() || CALL_CENTER_SOURCE,
      routedTo: "DEL",
      flightId: flight.id,
    },
  });

  revalidateApp();
  return { ok: true, callId: call.id, flightCode: flight.flightCode, flightId: flight.id };
}

export async function ingestCall(input: {
  callerName: string;
  callerPhone: string;
  callbackPhone?: string;
  callerOrg?: string;
  callType: string;
  origin?: string;
  destination: string;
  notes?: string;
  urgency?: string;
  source?: string;
  receivedAt?: string;
}) {
  const actor = await requireRole(["MEDSTEAD_ADMIN", "OPS", "SALES"]);
  return persistIncomingCall(input, actor.id);
}

async function writeSalesActivity(
  accountId: string,
  kind: string,
  title: string,
  body: string,
  href?: string,
) {
  await prisma.salesActivity.create({ data: { accountId, kind, title, body, href } });
  await prisma.salesAccount.update({
    where: { id: accountId },
    data: { lastTouchAt: new Date(), activityLine: body },
  });
}

export async function createSalesAccount(form: {
  name: string;
  kind: "CLINIC" | "DOCTOR" | "WAREHOUSE" | "CHARTER";
  country: string;
  market: string;
  clinicId?: string;
  customerId?: string;
}) {
  const actor = await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const name = form.name.trim();
  if (!name) return { error: "Account name is required." };
  const next = new Date(Date.now() + 3 * 86400000);
  const account = await prisma.salesAccount.create({
    data: {
      name,
      kind: form.kind,
      stage: "PROSPECT",
      country: form.country.trim() || "United States",
      market: form.market.trim() || "USA",
      ownerId: actor.id,
      clinicId: form.clinicId || null,
      customerId: form.customerId || null,
      nextFollowUpAt: next,
      activityLine: "Opened on the sales desk. First conversation is next.",
    },
  });
  await prisma.salesFollowUp.create({
    data: { accountId: account.id, dueAt: next, kind: "follow_up", note: "First conversation." },
  });
  await writeSalesActivity(
    account.id,
    "note",
    "Account opened",
    `${actor.name} opened this account. No revenue on this desk.`,
    `/app/sales/${account.id}`,
  );
  revalidateApp();
  return { ok: true, id: account.id };
}

export async function logSalesFollowUp(accountId: string, note?: string) {
  const actor = await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const account = await prisma.salesAccount.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found." };
  const next = new Date(Date.now() + 7 * 86400000);
  await prisma.salesFollowUp.updateMany({
    where: { accountId, doneAt: null },
    data: { doneAt: new Date(), note: note?.trim() || "Logged in-app. No WhatsApp." },
  });
  await prisma.salesFollowUp.create({
    data: { accountId, dueAt: next, kind: "follow_up", note: "Next conversation." },
  });
  await prisma.salesAccount.update({
    where: { id: accountId },
    data: {
      nextFollowUpAt: next,
      stage: account.stage === "PROSPECT" ? "TALKING" : account.stage,
    },
  });
  await writeSalesActivity(
    accountId,
    "followup",
    "Follow-up logged",
    note?.trim() || `Sales ${actor.name} logged a follow-up. Next date set. No WhatsApp.`,
    `/app/sales/${accountId}`,
  );
  revalidateApp();
  return { ok: true };
}

export async function bookSalesEvent(input: {
  accountId: string;
  kind: "DINNER" | "SITE_VISIT" | "WAREHOUSE_TOUR" | "CONFERENCE" | "DOCTOR_CHARTER_DAY";
  date: string;
  title?: string;
}) {
  const actor = await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const account = await prisma.salesAccount.findUnique({
    where: { id: input.accountId },
    include: { clinic: { include: { users: true } } },
  });
  if (!account) return { error: "Account not found." };
  if (!input.date) return { error: "Pick a date." };
  const occursAt = new Date(`${input.date}T16:00:00.000Z`);
  const title =
    input.title?.trim() ||
    `${input.kind.replaceAll("_", " ")} · ${account.name}`;

  let flightId: string | undefined;
  let handedTo: string | undefined;
  if (input.kind === "DOCTOR_CHARTER_DAY") {
    const dest = account.country.toLowerCase().includes("bahamas") ? "NAS" : "NAS";
    const requestedById =
      account.clinic?.users.find((u) => u.role === "DOCTOR")?.id ??
      account.customerId ??
      actor.id;
    const flight = await prisma.flight.create({
      data: {
        flightCode: await nextFlightCode("FLL_NAS", "DOCTOR_CHARTER"),
        corridor: "FLL_NAS",
        tripType: "DOCTOR_CHARTER",
        tripStatus: "REQUESTED",
        live: true,
        phase: "T48_PREP",
        origin: "FLL",
        destination: dest,
        requestedById,
        passengerNote: `${account.name} — doctor charter day`,
        purpose: "Sales booked a doctor charter day. Del schedules. Not a clinic supply order.",
        assignedPilotId: (await defaultPilotId()) ?? undefined,
        aircraftNote: CURRENT_FLEET_ASSIGN,
        activityLine: "Sales handed a charter day to Del. No WhatsApp.",
      },
    });
    flightId = flight.id;
    handedTo = "DEL";
  } else if (input.kind === "WAREHOUSE_TOUR") {
    handedTo = "OPS";
  }

  const event = await prisma.salesEvent.create({
    data: {
      accountId: account.id,
      ownerId: actor.id,
      kind: input.kind,
      title,
      occursAt,
      status: "BOOKED",
      handedTo,
      flightId,
      activityLine:
        handedTo === "DEL"
          ? "Booked · handed to Del for charter dispatch."
          : handedTo === "OPS"
            ? "Booked · handed to warehouse ops for the tour."
            : "Event booked in-app.",
    },
  });

  await prisma.salesAccount.update({
    where: { id: account.id },
    data: {
      stage: account.stage === "PROSPECT" || account.stage === "TALKING" ? "EVENT_SET" : account.stage,
      nextFollowUpAt: occursAt,
    },
  });
  await prisma.salesFollowUp.updateMany({
    where: { accountId: account.id, doneAt: null, kind: "book_event" },
    data: { doneAt: new Date() },
  });
  await writeSalesActivity(
    account.id,
    "event",
    title,
    event.activityLine || "Event booked.",
    `/app/sales/${account.id}`,
  );
  void actor;
  revalidateApp();
  return { ok: true };
}

export async function convertSalesToOrder(accountId: string) {
  const actor = await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const account = await prisma.salesAccount.findUnique({
    where: { id: accountId },
    include: { clinic: true },
  });
  if (!account) return { error: "Account not found." };
  if (!account.clinicId || !account.clinic) {
    return { error: "Link a clinic first. Clinic approval stays on the admin desk." };
  }
  await prisma.salesAccount.update({
    where: { id: accountId },
    data: { stage: "BOOKED", activityLine: "Sales marked ready to order. Clinic shops in-app." },
  });
  await prisma.clinic.update({
    where: { id: account.clinicId },
    data: { activityLine: "Sales converted this account · shop the book. No call needed." },
  });
  await writeSalesActivity(
    accountId,
    "order",
    "Ready to order",
    `${actor.name} converted ${account.name} to a clinic order next step. No revenue on this card.`,
    "/app/clinic/catalog",
  );
  const next = new Date(Date.now() + 7 * 86400000);
  await prisma.salesFollowUp.create({
    data: { accountId, dueAt: next, kind: "follow_up", note: "Check that an order landed." },
  });
  await prisma.salesAccount.update({
    where: { id: accountId },
    data: { nextFollowUpAt: next },
  });
  revalidateApp();
  return { ok: true };
}

export async function salesRequestCharter(accountId: string) {
  const actor = await requireRole(["SALES", "MEDSTEAD_ADMIN"]);
  const account = await prisma.salesAccount.findUnique({
    where: { id: accountId },
    include: { clinic: { include: { users: true } } },
  });
  if (!account) return { error: "Account not found." };
  const requestedById =
    account.clinic?.users.find((u) => u.role === "DOCTOR" || u.role === "CLINIC_ADMIN")?.id ??
    account.customerId ??
    actor.id;
  const dest = account.country.toLowerCase().includes("freeport") ? "FPO" : "NAS";
  const corridor = dest === "FPO" ? "FLL_FPO" : "FLL_NAS";
  const flight = await prisma.flight.create({
    data: {
      flightCode: await nextFlightCode(corridor, "DOCTOR_CHARTER"),
      corridor,
      tripType: "DOCTOR_CHARTER",
      tripStatus: "REQUESTED",
      live: true,
      phase: "T48_PREP",
      origin: "FLL",
      destination: dest,
      requestedById,
      passengerNote: `${account.name} — sales charter request`,
      purpose: "Sales requested a charter. Del owns dispatch. Not a clinic supply order.",
      assignedPilotId: (await defaultPilotId()) ?? undefined,
      aircraftNote: CURRENT_FLEET_ASSIGN,
      activityLine: "Sales requested a charter · waiting on Del to schedule. No WhatsApp.",
    },
  });
  await prisma.salesAccount.update({
    where: { id: accountId },
    data: { stage: account.stage === "ACTIVE" ? "ACTIVE" : "BOOKED" },
  });
  await writeSalesActivity(
    accountId,
    "flight",
    flight.flightCode,
    "Charter requested · handed to Del. Finance cannot fly.",
    "/app/flights",
  );
  revalidateApp();
  return { ok: true };
}

export async function completeWarehouseVisit(eventId: string) {
  const actor = await requireRole(["OPS", "MEDSTEAD_ADMIN"]);
  const event = await prisma.salesEvent.findUnique({
    where: { id: eventId },
    include: { account: true },
  });
  if (!event) return { error: "Visit not found." };
  await prisma.salesEvent.update({
    where: { id: eventId },
    data: { status: "DONE", activityLine: `${actor.name} completed the warehouse visit in-app.` },
  });
  await writeSalesActivity(
    event.accountId,
    "event",
    event.title,
    "Warehouse tour done. Sales sees it on the account timeline.",
    `/app/sales/${event.accountId}`,
  );
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
  accountId?: string;
  eventId?: string;
  eventKind?: "DINNER" | "SITE_VISIT" | "WAREHOUSE_TOUR" | "CONFERENCE" | "DOCTOR_CHARTER_DAY";
  aircraftId?: string;
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
    if (!isDel(actor)) return { error: "Only Del confirms delivery dates." };
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
    return dispatchFlight(input.shipmentId, input.aircraftId);
  }
  if (input.kind === "dispatch_air_trip" && input.flightId) {
    return dispatchAirTrip(input.flightId, input.aircraftId);
  }
  if (input.kind === "schedule_charter" && input.flightId) {
    return scheduleAirTrip(input.flightId);
  }
  if (input.kind === "notify_pilots" && input.flightId) {
    return notifyPilots(input.flightId);
  }
  if (input.kind === "acknowledge_brief" && input.flightId) {
    return acknowledgePilotBrief(input.flightId);
  }
  if (input.kind === "log_followup" && input.accountId) {
    return logSalesFollowUp(input.accountId);
  }
  if (input.kind === "book_event" && input.accountId && input.eventKind && input.date) {
    return bookSalesEvent({
      accountId: input.accountId,
      kind: input.eventKind,
      date: input.date,
    });
  }
  if (input.kind === "convert_order" && input.accountId) {
    return convertSalesToOrder(input.accountId);
  }
  if (input.kind === "request_charter" && input.accountId) {
    return salesRequestCharter(input.accountId);
  }
  if (input.kind === "host_warehouse_visit" && input.eventId) {
    return completeWarehouseVisit(input.eventId);
  }

  return { error: "Unknown next action." };
}
