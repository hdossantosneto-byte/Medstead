import type { GateName, Role } from "@prisma/client";
import {
  CLINIC_ORDER_LABEL,
  CLINIC_ROLES,
  CRM_LABEL,
  GATE_LABEL,
  GATE_ORDER,
  SHIPMENT_LABEL,
} from "./constants";
import { prisma } from "./prisma";

export type QueueKind =
  | "approve_clinic"
  | "start_review"
  | "approve_order"
  | "crm_followup"
  | "crm_activate"
  | "generate_invoice"
  | "mark_payment_pending"
  | "mark_paid"
  | "sign_finance_gate"
  | "prepare_shipment"
  | "mark_origin_received"
  | "green_gate"
  | "generate_manifest"
  | "set_delivery_date"
  | "release_shipment"
  | "mark_shipped"
  | "mark_in_transit"
  | "mark_delivered"
  | "clinic_pay"
  | "freeze_manifest"
  | "go_no_go"
  | "dispatch_flight"
  | "open";

export type QueueItem = {
  id: string;
  who: string;
  what: string;
  why: string;
  actionLabel: string;
  kind: QueueKind;
  href: string;
  clinicId?: string;
  orderId?: string;
  invoiceId?: string;
  shipmentId?: string;
  crmId?: string;
  gate?: GateName;
  flightId?: string;
  needsDate?: boolean;
};

function gatesGreen(gates: Array<{ name: GateName; state: string }>) {
  return (
    GATE_ORDER.every((name) => gates.some((g) => g.name === name && g.state === "GREEN")) &&
    gates.length >= GATE_ORDER.length
  );
}

function nextOpsGate(gates: Array<{ name: GateName; state: string }>) {
  return GATE_ORDER.find((name) => {
    if (name === "COMMERCIAL_FINANCE") return false;
    const g = gates.find((x) => x.name === name);
    return !g || g.state !== "GREEN";
  });
}

export async function loadQueue(user: {
  id: string;
  role: Role;
  clinicId: string | null;
  clinic: { id: string; name: string; approved: boolean } | null;
  active: boolean;
}): Promise<QueueItem[]> {
  const items: QueueItem[] = [];

  if (user.role === "MEDSTEAD_ADMIN") {
    const [clinics, orders, crm] = await Promise.all([
      prisma.clinic.findMany({
        where: { approved: false },
        include: { crm: true, users: true },
      }),
      prisma.clinicOrder.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        include: { clinic: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.crmAccount.findMany({
        where: { stage: { in: ["FORUM_CONSULT", "ELIGIBILITY_REVIEW"] } },
        include: { clinic: true },
      }),
    ]);

    for (const c of crm.filter((x) => x.stage === "FORUM_CONSULT")) {
      items.push({
        id: `crm-follow-${c.id}`,
        who: c.name,
        what: "Log 48-hour follow-up",
        why: `${CRM_LABEL.FORUM_CONSULT} · ENABLE next step before eligibility. No patient data.`,
        actionLabel: "Log 48h follow-up",
        kind: "crm_followup",
        href: "/app/admin/crm",
        crmId: c.id,
      });
    }

    for (const c of crm.filter((x) => x.stage === "ELIGIBILITY_REVIEW")) {
      items.push({
        id: `crm-act-${c.id}`,
        who: c.name,
        what: "Activate after eligibility review",
        why: "Waiting on Clint to activate. Approving the clinic lets them order without a call.",
        actionLabel: "Activate clinic",
        kind: "crm_activate",
        href: "/app/admin/crm",
        crmId: c.id,
        clinicId: c.clinicId ?? undefined,
      });
    }

    for (const c of clinics) {
      if (c.crm?.stage === "ELIGIBILITY_REVIEW") continue;
      items.push({
        id: `clinic-${c.id}`,
        who: c.name,
        what: `Approve ${c.type.toLowerCase()} account`,
        why: "Clinic / doctor / pharmacy seats stay inactive until admin approval.",
        actionLabel: "Approve",
        kind: "approve_clinic",
        href: "/app/admin/approvals",
        clinicId: c.id,
      });
    }

    for (const o of orders) {
      if (o.status === "SUBMITTED") {
        items.push({
          id: `rev-${o.id}`,
          who: o.clinic.name,
          what: `Start review of ${o.orderNumber}`,
          why: "Submitted · moves clinic to Under Review and logistics to Compliance Review.",
          actionLabel: "Start review",
          kind: "start_review",
          href: `/app/admin/orders/${o.id}`,
          orderId: o.id,
        });
      } else {
        items.push({
          id: `ord-${o.id}`,
          who: o.clinic.name,
          what: `Approve ${o.orderNumber}`,
          why: "Under Review · approve so finance can invoice. Logistics moves to Quoted.",
          actionLabel: "Approve order",
          kind: "approve_order",
          href: `/app/admin/orders/${o.id}`,
          orderId: o.id,
        });
      }
    }
  }

  if (user.role === "FINANCE") {
    const [needInvoice, needPending, unpaid, gates] = await Promise.all([
      prisma.clinicOrder.findMany({
        where: { status: "APPROVED", invoice: null },
        include: { clinic: true },
      }),
      prisma.clinicOrder.findMany({
        where: { status: "INVOICE_GENERATED" },
        include: { clinic: true, invoice: true },
      }),
      prisma.invoice.findMany({
        where: { status: { not: "paid" }, order: { status: { in: ["PAYMENT_PENDING"] } } },
        include: { order: { include: { clinic: true } } },
      }),
      prisma.releaseGate.findMany({
        where: { name: "COMMERCIAL_FINANCE", state: { not: "GREEN" } },
        include: { shipment: { include: { clinicOrder: { include: { clinic: true, invoice: true } } } } },
      }),
    ]);

    for (const o of needInvoice) {
      items.push({
        id: `inv-${o.id}`,
        who: o.clinic.name,
        what: `Generate invoice for ${o.orderNumber}`,
        why: "Approved · waiting on finance. Ops cannot see this total.",
        actionLabel: "Generate invoice",
        kind: "generate_invoice",
        href: "/app/finance/invoices",
        orderId: o.id,
      });
    }
    for (const o of needPending) {
      items.push({
        id: `pend-${o.id}`,
        who: o.clinic.name,
        what: `Send ${o.orderNumber} for payment`,
        why: "Invoice generated · mark payment pending so the clinic can pay without a call.",
        actionLabel: "Mark payment pending",
        kind: "mark_payment_pending",
        href: "/app/finance/invoices",
        orderId: o.id,
      });
    }
    for (const inv of unpaid) {
      items.push({
        id: `pay-${inv.id}`,
        who: inv.order.clinic.name,
        what: `Record payment for ${inv.number}`,
        why: "Payment pending · commercial / finance gate stays blocked until paid.",
        actionLabel: "Mark paid",
        kind: "mark_paid",
        href: "/app/finance/invoices",
        invoiceId: inv.id,
      });
    }
    for (const g of gates) {
      if (g.shipment.clinicOrder && g.shipment.clinicOrder.invoice?.status !== "paid") {
        continue;
      }
      items.push({
        id: `gate3-${g.id}`,
        who: g.shipment.clinicOrder?.clinic.name ?? g.shipment.consignee,
        what: "Sign commercial / finance gate",
        why: "Payment is in · sign gate 3 so ops can release. Finance cannot ship.",
        actionLabel: "Sign finance gate",
        kind: "sign_finance_gate",
        href: "/app/finance/invoices",
        shipmentId: g.shipmentId,
      });
    }

    const upcomingPays = await prisma.scheduledPay.findMany({
      where: { status: "SCHEDULED", dueAt: { gte: new Date("2026-08-31") } },
      include: { payee: true },
      orderBy: { dueAt: "asc" },
      take: 3,
    });
    for (const p of upcomingPays) {
      items.push({
        id: `paydate-${p.id}`,
        who: p.payee.displayName,
        what: `Review pay date ${p.dueAt.toISOString().slice(0, 10)}`,
        why: "Scheduled / not sent. Books only — do not Zelle unless Hairson says so.",
        actionLabel: "Open payroll",
        kind: "open",
        href: "/app/finance/payroll",
      });
    }
  }

  if (user.role === "OPS") {
    const [needPrep, preparing, manifested, moving, holds, flights] = await Promise.all([
      prisma.clinicOrder.findMany({
        where: { status: "PAYMENT_RECEIVED" },
        include: { clinic: true, shipment: { include: { gates: true } } },
      }),
      prisma.clinicOrder.findMany({
        where: { status: "PREPARING_SHIPMENT" },
        include: { clinic: true, shipment: { include: { gates: true } }, manifest: true },
      }),
      prisma.clinicOrder.findMany({
        where: { status: "MANIFEST_GENERATED" },
        include: { clinic: true, shipment: true },
      }),
      prisma.clinicOrder.findMany({
        where: { status: { in: ["SHIPPED", "IN_TRANSIT"] } },
        include: { clinic: true, shipment: true },
      }),
      prisma.shipment.findMany({
        where: { status: "ORIGIN_RECEIVED_HOLD" },
        include: { gates: true, clinicOrder: { include: { clinic: true } } },
      }),
      prisma.flight.findMany({
        where: { live: true, phase: { in: ["T48_PREP", "T24_FREEZE", "T6_GO_NO_GO"] } },
        include: { shipments: { include: { clinicOrder: { include: { clinic: true } } } } },
      }),
    ]);

    for (const o of needPrep) {
      items.push({
        id: `prep-${o.id}`,
        who: o.clinic.name,
        what: `Prepare shipment for ${o.orderNumber}`,
        why: "Finance marked paid · waiting on ops to start gates. Del owns delivery dates.",
        actionLabel: "Prepare shipment",
        kind: "prepare_shipment",
        href: "/app/ops/packages",
        orderId: o.id,
      });
    }

    for (const o of preparing) {
      const shipment = o.shipment;
      if (!shipment) {
        items.push({
          id: `prep2-${o.id}`,
          who: o.clinic.name,
          what: `Open gates for ${o.orderNumber}`,
          why: "Preparing shipment · create the six-gate checklist.",
          actionLabel: "Prepare shipment",
          kind: "prepare_shipment",
          href: "/app/ops/packages",
          orderId: o.id,
        });
        continue;
      }
      if (gatesGreen(shipment.gates) && !o.manifest) {
        if (shipment.status === "AWAITING_SUPPLIER") {
          items.push({
            id: `origin-${shipment.id}`,
            who: o.clinic.name,
            what: `Mark origin received for ${o.orderNumber}`,
            why: "Gates are green · move logistics to Origin Received-Hold, then manifest.",
            actionLabel: "Mark origin received",
            kind: "mark_origin_received",
            href: "/app/ops/packages",
            shipmentId: shipment.id,
          });
          continue;
        }
        items.push({
          id: `man-${o.id}`,
          who: o.clinic.name,
          what: `Generate manifest for ${o.orderNumber}`,
          why: "All six gates green · clinic becomes Manifest Generated, logistics Released/Manifested.",
          actionLabel: "Generate manifest",
          kind: "generate_manifest",
          href: `/docs/manifest/${o.id}`,
          orderId: o.id,
        });
        continue;
      }
      const next = nextOpsGate(shipment.gates);
      if (next) {
        items.push({
          id: `gate-${shipment.id}-${next}`,
          who: o.clinic.name,
          what: `Clear ${GATE_LABEL[next]}`,
          why: `${o.orderNumber} · six-gate release. All green before manifest.`,
          actionLabel: `Mark ${GATE_LABEL[next]} green`,
          kind: "green_gate",
          href: "/app/ops/compliance",
          shipmentId: shipment.id,
          gate: next,
        });
      }
    }

    for (const o of manifested) {
      if (!o.promisedDate) {
        items.push({
          id: `date-${o.id}`,
          who: o.clinic.name,
          what: `Confirm delivery date for ${o.orderNumber}`,
          why: "Del only. Sales and admin CRM cannot promise dates.",
          actionLabel: "Confirm date",
          kind: "set_delivery_date",
          href: "/app/ops/packages",
          orderId: o.id,
          needsDate: true,
        });
      } else if (
        o.shipment &&
        (o.shipment.destination === "NAS" || o.shipment.destination === "FPO")
      ) {
        items.push({
          id: `fly-${o.id}`,
          who: o.clinic.name,
          what: `Dispatch flight for ${o.orderNumber}`,
          why: "Gates are green and the date is set. Doctor does not block cargo. Finance cannot fly.",
          actionLabel: "Dispatch flight",
          kind: "dispatch_flight",
          href: "/app/flights",
          shipmentId: o.shipment.id,
          orderId: o.id,
        });
      } else {
        items.push({
          id: `ship-${o.id}`,
          who: o.clinic.name,
          what: `Mark ${o.orderNumber} shipped`,
          why: "Manifest generated and Del confirmed the date.",
          actionLabel: "Mark shipped",
          kind: "mark_shipped",
          href: "/app/ops/packages",
          orderId: o.id,
        });
      }
    }

    for (const o of moving) {
      if (o.status === "SHIPPED") {
        items.push({
          id: `transit-${o.id}`,
          who: o.clinic.name,
          what: `Confirm ${o.orderNumber} in transit`,
          why: "Shipped · move clinic to In Transit. Logistics stays In Transit. Public clock is on.",
          actionLabel: "Mark in transit",
          kind: "mark_in_transit",
          href: "/app/ops/packages",
          orderId: o.id,
        });
      } else {
        items.push({
          id: `dlv-${o.id}`,
          who: o.clinic.name,
          what: `Mark ${o.orderNumber} delivered`,
          why: "In Transit · close both machines (Delivered / Delivered/Closed).",
          actionLabel: "Mark delivered",
          kind: "mark_delivered",
          href: "/app/ops/packages",
          orderId: o.id,
        });
      }
    }

    for (const f of flights) {
      const who = f.shipments[0]?.clinicOrder?.clinic.name ?? f.shipments[0]?.consignee ?? f.flightCode;
      if (f.phase === "T48_PREP") {
        items.push({
          id: `frz-${f.id}`,
          who,
          what: `Freeze manifest ${f.flightCode}`,
          why: "T-24 · lock the manifest. Doctor does not need to be on the phone.",
          actionLabel: "Freeze manifest",
          kind: "freeze_manifest",
          href: "/app/flights",
          flightId: f.id,
        });
      } else if (f.phase === "T24_FREEZE") {
        items.push({
          id: `gng-${f.id}`,
          who,
          what: `Go / no-go ${f.flightCode}`,
          why: "T-6 · Del owns the call. Then dispatch.",
          actionLabel: "Call GO",
          kind: "go_no_go",
          href: "/app/flights",
          flightId: f.id,
        });
      } else if (f.phase === "T6_GO_NO_GO" && f.goNoGo !== "NO_GO") {
        const ship = f.shipments[0];
        if (ship) {
          items.push({
            id: `disp-${f.id}`,
            who,
            what: `Dispatch ${f.flightCode}`,
            why: "GO is in. Dispatch even if a doctor placed the clinic order.",
            actionLabel: "Dispatch flight",
            kind: "dispatch_flight",
            href: "/app/flights",
            shipmentId: ship.id,
            flightId: f.id,
          });
        }
      }
    }

    for (const s of holds) {
      if (s.clinicOrder?.status === "PREPARING_SHIPMENT") continue;
      const who = s.clinicOrder?.clinic.name ?? s.consignee;
      if (gatesGreen(s.gates)) {
        items.push({
          id: `rel-${s.id}`,
          who,
          what: `Release ${s.shipmentCode}`,
          why: `${SHIPMENT_LABEL.ORIGIN_RECEIVED_HOLD} · gates are green. Public clock starts after release.`,
          actionLabel: "Release / manifest",
          kind: "release_shipment",
          href: "/app/ops/packages",
          shipmentId: s.id,
        });
      } else {
        const next = nextOpsGate(s.gates);
        if (next) {
          items.push({
            id: `holdgate-${s.id}-${next}`,
            who,
            what: `Clear ${GATE_LABEL[next]} on hold freight`,
            why: `${s.shipmentCode} is Origin Received-Hold until remaining gates are green.`,
            actionLabel: `Mark ${GATE_LABEL[next]} green`,
            kind: "green_gate",
            href: "/app/ops/compliance",
            shipmentId: s.id,
            gate: next,
          });
        }
      }
    }

    const first = ["dispatch_flight", "set_delivery_date", "freeze_manifest", "go_no_go"];
    items.sort((a, b) => {
      const ap = first.indexOf(a.kind);
      const bp = first.indexOf(b.kind);
      if (ap === -1 && bp === -1) return 0;
      if (ap === -1) return 1;
      if (bp === -1) return -1;
      return ap - bp;
    });
  }

  if (CLINIC_ROLES.includes(user.role)) {
    const approved = Boolean(user.clinic?.approved && user.active);
    if (!approved) {
      items.push({
        id: "clinic-pending",
        who: user.clinic?.name ?? "Your clinic",
        what: "Account waiting on MedStead admin",
        why: "Clinic, doctor, and pharmacy seats stay inactive until Clint approves. You cannot order yet.",
        actionLabel: "See status",
        kind: "open",
        href: "/app/clinic/pending",
      });
    } else if (user.clinicId) {
      const orders = await prisma.clinicOrder.findMany({
        where: { clinicId: user.clinicId },
        include: { invoice: true },
        orderBy: { createdAt: "desc" },
      });
      for (const o of orders) {
        if (o.status === "PAYMENT_PENDING" && o.invoice && o.invoice.status !== "paid") {
          items.push({
            id: `cpay-${o.id}`,
            who: user.clinic?.name ?? "Your clinic",
            what: `Pay invoice ${o.invoice.number}`,
            why: "Payment pending · pay here so ops can prepare. No need to message finance.",
            actionLabel: "Pay invoice",
            kind: "clinic_pay",
            href: `/app/clinic/orders/${o.id}`,
            invoiceId: o.invoice.id,
            orderId: o.id,
          });
        } else if (o.status !== "DELIVERED") {
          items.push({
            id: `csee-${o.id}`,
            who: user.clinic?.name ?? "Your clinic",
            what: `${o.orderNumber} is ${CLINIC_ORDER_LABEL[o.status]}`,
            why: o.activityLine || "Open the record to see who has the next step. Do not call ops for dates.",
            actionLabel: "Open order",
            kind: "open",
            href: `/app/clinic/orders/${o.id}`,
            orderId: o.id,
          });
        }
      }
    }
  }

  if (user.role === "CUSTOMER" || user.role === "PUBLIC") {
    const shipments = await prisma.shipment.findMany({
      where: {
        customerId: user.id,
        status: { notIn: ["DELIVERED_CLOSED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    for (const s of shipments) {
      items.push({
        id: `trk-${s.id}`,
        who: s.consignee,
        what: `Track ${s.shipmentCode}`,
        why: s.activityLine || `${SHIPMENT_LABEL[s.status]} · public clock starts after release.`,
        actionLabel: "Open tracking",
        kind: "open",
        href: `/track/${s.shipmentCode}`,
      });
    }
  }

  return items;
}
