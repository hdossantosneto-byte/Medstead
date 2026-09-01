import type { ShipmentStatus } from "@prisma/client";
import { PUBLIC_TRACK_STEPS, type PublicTrackStep } from "./constants";

const FROM_SHIPMENT: Record<ShipmentStatus, PublicTrackStep> = {
  SUBMITTED: "REQUESTED",
  COMPLIANCE_REVIEW: "REQUESTED",
  QUOTED: "CONFIRMED",
  APPROVED_PAID: "PAID",
  AWAITING_SUPPLIER: "RECEIVED",
  ORIGIN_RECEIVED_HOLD: "RECEIVED",
  RELEASED_MANIFESTED: "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT",
  CUSTOMS_HOLD_RELEASED: "CUSTOMS",
  DESTINATION_RECEIVED: "READY_PICKUP",
  DELIVERED_CLOSED: "DELIVERED",
};

const TO_SHIPMENT: Record<PublicTrackStep, ShipmentStatus> = {
  REQUESTED: "SUBMITTED",
  CONFIRMED: "QUOTED",
  INVOICE_ISSUED: "QUOTED",
  PAID: "APPROVED_PAID",
  RECEIVED: "ORIGIN_RECEIVED_HOLD",
  IN_TRANSIT: "IN_TRANSIT",
  CUSTOMS: "CUSTOMS_HOLD_RELEASED",
  READY_PICKUP: "DESTINATION_RECEIVED",
  DELIVERED: "DELIVERED_CLOSED",
};

export function publicStepForShipment(
  status: ShipmentStatus,
  invoiceStatus?: string | null,
): PublicTrackStep {
  if (invoiceStatus === "paid") {
    if (status === "QUOTED" || status === "SUBMITTED" || status === "COMPLIANCE_REVIEW") {
      return "PAID";
    }
  }
  if (
    (invoiceStatus === "issued" || invoiceStatus === "pay_later") &&
    (status === "QUOTED" || status === "SUBMITTED" || status === "COMPLIANCE_REVIEW")
  ) {
    return "INVOICE_ISSUED";
  }
  return FROM_SHIPMENT[status] ?? "REQUESTED";
}

export function shipmentStatusForPublicStep(step: PublicTrackStep): ShipmentStatus {
  return TO_SHIPMENT[step];
}

export function isPublicTrackStep(value: string): value is PublicTrackStep {
  return (PUBLIC_TRACK_STEPS as readonly string[]).includes(value);
}
