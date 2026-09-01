import type { ClinicOrderStatus, ShipmentStatus } from "@prisma/client";
import { CLINIC_ORDER_STATUSES, GATE_ORDER, SHIPMENT_STATUSES } from "./constants";
import { prisma } from "./prisma";
import { nextShipmentCode } from "./shipment-id";

export const CLINIC_DRIVES_SHIPMENT: Record<ClinicOrderStatus, ShipmentStatus> = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "COMPLIANCE_REVIEW",
  APPROVED: "QUOTED",
  INVOICE_GENERATED: "QUOTED",
  PAYMENT_PENDING: "QUOTED",
  PAYMENT_RECEIVED: "APPROVED_PAID",
  PREPARING_SHIPMENT: "AWAITING_SUPPLIER",
  MANIFEST_GENERATED: "RELEASED_MANIFESTED",
  SHIPPED: "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED_CLOSED",
};

export const SHIPMENT_DRIVES_CLINIC: Record<ShipmentStatus, ClinicOrderStatus> = {
  SUBMITTED: "SUBMITTED",
  COMPLIANCE_REVIEW: "UNDER_REVIEW",
  QUOTED: "APPROVED",
  APPROVED_PAID: "PAYMENT_RECEIVED",
  AWAITING_SUPPLIER: "PREPARING_SHIPMENT",
  ORIGIN_RECEIVED_HOLD: "PREPARING_SHIPMENT",
  RELEASED_MANIFESTED: "MANIFEST_GENERATED",
  IN_TRANSIT: "IN_TRANSIT",
  CUSTOMS_HOLD_RELEASED: "IN_TRANSIT",
  DESTINATION_RECEIVED: "IN_TRANSIT",
  DELIVERED_CLOSED: "DELIVERED",
};

export function publicClockOn(status: ShipmentStatus) {
  return (
    status === "RELEASED_MANIFESTED" ||
    status === "IN_TRANSIT" ||
    status === "CUSTOMS_HOLD_RELEASED" ||
    status === "DESTINATION_RECEIVED" ||
    status === "DELIVERED_CLOSED"
  );
}

function clinicRank(status: ClinicOrderStatus) {
  return CLINIC_ORDER_STATUSES.indexOf(status);
}

function shipRank(status: ShipmentStatus) {
  return SHIPMENT_STATUSES.indexOf(status);
}

export function shipmentTargetForClinic(
  clinicStatus: ClinicOrderStatus,
  current?: ShipmentStatus | null,
): ShipmentStatus {
  const target = CLINIC_DRIVES_SHIPMENT[clinicStatus];
  if (
    clinicStatus === "PREPARING_SHIPMENT" &&
    (current === "ORIGIN_RECEIVED_HOLD" || current === "RELEASED_MANIFESTED")
  ) {
    return current;
  }
  if (clinicStatus === "IN_TRANSIT" && current === "DESTINATION_RECEIVED") {
    return current;
  }
  if (current && shipRank(target) < shipRank(current) && clinicStatus !== "DELIVERED") {
    return current;
  }
  return target;
}

export function clinicTargetForShipment(
  shipStatus: ShipmentStatus,
  currentClinic?: ClinicOrderStatus | null,
): ClinicOrderStatus {
  const target = SHIPMENT_DRIVES_CLINIC[shipStatus];
  if (
    currentClinic &&
    (currentClinic === "INVOICE_GENERATED" || currentClinic === "PAYMENT_PENDING") &&
    (shipStatus === "QUOTED" || shipStatus === "SUBMITTED" || shipStatus === "COMPLIANCE_REVIEW")
  ) {
    return currentClinic;
  }
  if (currentClinic && clinicRank(target) < clinicRank(currentClinic) && shipStatus !== "DELIVERED_CLOSED") {
    return currentClinic;
  }
  return target;
}

export async function ensureLinkedShipment(orderId: string, actorId: string) {
  const order = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { clinic: true, shipment: { include: { gates: true } }, invoice: true, items: true },
  });
  if (!order) return null;
  if (order.shipment) return order.shipment;

  const dest = order.clinic.market === "USA" ? "FLL" : "NAS";
  const paid = order.invoice?.status === "paid";
  const shipStatus = shipmentTargetForClinic(order.status);
  const code = await nextShipmentCode("FLL", dest);
  const pieces = Math.max(1, order.items.length);

  return prisma.shipment.create({
    data: {
      shipmentCode: code,
      status: shipStatus,
      service: "EXPRESS_AIR",
      origin: "FLL",
      destination: dest,
      weightLb: 20,
      pieces,
      clinicOrderId: order.id,
      consignee: order.clinic.name,
      publicClock: false,
      activityLine: "Linked logistics record created · public clock starts only after release.",
      gates: {
        create: GATE_ORDER.map((name) => ({
          name,
          state: name === "COMMERCIAL_FINANCE" && paid ? "GREEN" : "PENDING",
          signedById: name === "COMMERCIAL_FINANCE" && paid ? actorId : undefined,
        })),
      },
      events: {
        create: {
          toStatus: shipStatus,
          actorId,
          note: "Shipment attached at clinic submit. Public clock is off.",
        },
      },
    },
    include: { gates: true },
  });
}

export async function advanceClinicOrder(
  orderId: string,
  status: ClinicOrderStatus,
  actorId: string,
  line: string,
) {
  const order = await prisma.clinicOrder.findUnique({
    where: { id: orderId },
    include: { shipment: true, invoice: true },
  });
  if (!order) return { error: "Order not found." };

  await prisma.clinicOrder.update({
    where: { id: orderId },
    data: { status, activityLine: line },
  });
  await prisma.statusEvent.create({
    data: {
      clinicOrderId: orderId,
      fromStatus: order.status,
      toStatus: status,
      note: line,
      actorId,
    },
  });

  const shipment = await ensureLinkedShipment(orderId, actorId);
  if (shipment) {
    const nextShip = shipmentTargetForClinic(status, shipment.status);
    const paid = order.invoice?.status === "paid" || status === "PAYMENT_RECEIVED";
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: nextShip,
        publicClock: publicClockOn(nextShip),
        activityLine: line,
      },
    });
    if (nextShip !== shipment.status) {
      await prisma.statusEvent.create({
        data: {
          shipmentId: shipment.id,
          fromStatus: shipment.status,
          toStatus: nextShip,
          note: line,
          actorId,
        },
      });
    }
    if (paid) {
      await prisma.releaseGate.updateMany({
        where: { shipmentId: shipment.id, name: "COMMERCIAL_FINANCE" },
        data: { state: "GREEN", signedById: actorId },
      });
    }
  }
  return { ok: true };
}

export async function advanceShipment(
  shipmentId: string,
  status: ShipmentStatus,
  actorId: string | null,
  line: string,
) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { clinicOrder: true, gates: true },
  });
  if (!shipment) return { error: "Shipment not found." };

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      status,
      publicClock: publicClockOn(status),
      activityLine: line,
    },
  });
  await prisma.statusEvent.create({
    data: {
      shipmentId,
      fromStatus: shipment.status,
      toStatus: status,
      note: line,
      actorId: actorId || undefined,
    },
  });

  if (shipment.clinicOrderId && shipment.clinicOrder) {
    const nextClinic = clinicTargetForShipment(status, shipment.clinicOrder.status);
    if (nextClinic !== shipment.clinicOrder.status) {
      await prisma.clinicOrder.update({
        where: { id: shipment.clinicOrderId },
        data: { status: nextClinic, activityLine: line },
      });
      await prisma.statusEvent.create({
        data: {
          clinicOrderId: shipment.clinicOrderId,
          fromStatus: shipment.clinicOrder.status,
          toStatus: nextClinic,
          note: line,
          actorId: actorId || undefined,
        },
      });
    } else {
      await prisma.clinicOrder.update({
        where: { id: shipment.clinicOrderId },
        data: { activityLine: line },
      });
    }
  }
  return { ok: true };
}
