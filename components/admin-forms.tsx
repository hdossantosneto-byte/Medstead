"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveClinic,
  generateInvoice,
  generateManifest,
  markPaymentPending,
  overrideClinicStatus,
  recordPayment,
  setCrmStage,
  setGate,
  setShipmentStatus,
} from "@/lib/actions";
import {
  CLINIC_ORDER_LABEL,
  CLINIC_ORDER_STATUSES,
  CRM_LABEL,
  CRM_STAGES,
  GATE_LABEL,
  SHIPMENT_LABEL,
  SHIPMENT_STATUSES,
} from "@/lib/constants";
import type { ClinicOrderStatus, CrmStage, GateName, GateState, ShipmentStatus } from "@prisma/client";
import { Button, inputClass } from "@/components/ui";

export function ApproveButton({ clinicId, approved }: { clinicId: string; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={approved ? "ghost" : "secondary"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await approveClinic(clinicId, !approved);
        setBusy(false);
        router.refresh();
      }}
    >
      {approved ? "Revoke" : "Approve clinic"}
    </Button>
  );
}

export function StatusOverride({ orderId, current }: { orderId: string; current: ClinicOrderStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await overrideClinicStatus(orderId, status, "Admin override");
        setBusy(false);
        router.refresh();
      }}
    >
      <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ClinicOrderStatus)}>
        {CLINIC_ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {CLINIC_ORDER_LABEL[s]}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={busy}>
        Override status
      </Button>
    </form>
  );
}

export function InvoiceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await generateInvoice(orderId);
        router.refresh();
      }}
    >
      Generate invoice
    </Button>
  );
}

export function PendingPayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await markPaymentPending(orderId);
        router.refresh();
      }}
    >
      Mark payment pending
    </Button>
  );
}

export function ManifestButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div>
      <Button
        onClick={async () => {
          const res = await generateManifest(orderId);
          setMsg(res.error ?? "Manifest generated");
          router.refresh();
        }}
      >
        Generate manifest
      </Button>
      {msg && <p className="mt-2 text-xs text-navy-800/60">{msg}</p>}
    </div>
  );
}

export function PaymentForm({ invoiceId, remaining }: { invoiceId: string; remaining: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState("Online card (demo)");
  const [online, setOnline] = useState(true);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await recordPayment(invoiceId, amount, method, online);
        router.refresh();
      }}
    >
      <input className={inputClass} type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      <input className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
        Paid online (10% freight discount does not change clinic invoice totals)
      </label>
      <Button type="submit">Record payment</Button>
    </form>
  );
}

export function CrmStageForm({ id, stage }: { id: string; stage: CrmStage }) {
  const router = useRouter();
  const [next, setNext] = useState(stage);
  const [reason, setReason] = useState("");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await setCrmStage(id, next, reason);
        router.refresh();
      }}
    >
      <select className={inputClass} value={next} onChange={(e) => setNext(e.target.value as CrmStage)}>
        {CRM_STAGES.map((s) => (
          <option key={s} value={s}>
            {CRM_LABEL[s]}
          </option>
        ))}
      </select>
      {(next === "HOLD" || next === "LOST") && (
        <input className={inputClass} placeholder="Hold / lost reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      )}
      <Button type="submit" variant="ghost">
        Move stage
      </Button>
    </form>
  );
}

export function GateToggle({
  shipmentId,
  name,
  state,
  financeOnly,
}: {
  shipmentId: string;
  name: GateName;
  state: GateState;
  financeOnly?: boolean;
}) {
  const router = useRouter();
  if (financeOnly && name !== "COMMERCIAL_FINANCE") return null;
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span>{GATE_LABEL[name]}</span>
      <select
        className={inputClass + " w-32"}
        value={state}
        onChange={async (e) => {
          await setGate(shipmentId, name, e.target.value as GateState);
          router.refresh();
        }}
      >
        <option value="PENDING">Pending</option>
        <option value="GREEN">Green</option>
        <option value="RED">Red</option>
      </select>
    </div>
  );
}

export function ShipmentStatusForm({
  shipmentId,
  current,
  canShip,
}: {
  shipmentId: string;
  current: ShipmentStatus;
  canShip: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [msg, setMsg] = useState("");
  if (!canShip) {
    return <p className="text-xs text-navy-800/50">Finance cannot run warehouse or flights.</p>;
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await setShipmentStatus(shipmentId, status);
        setMsg(res.error ?? "Updated");
        router.refresh();
      }}
    >
      <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
        {SHIPMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SHIPMENT_LABEL[s]}
          </option>
        ))}
      </select>
      <Button type="submit">Update shipment</Button>
      {msg && <p className="text-xs">{msg}</p>}
    </form>
  );
}
