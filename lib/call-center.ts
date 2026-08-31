import { timingSafeEqual } from "crypto";
import { CALL_CENTER_SOURCE } from "./constants";

export const PHI_FIELD_KEYS = [
  "patientName",
  "patient_name",
  "patient",
  "dob",
  "dateOfBirth",
  "date_of_birth",
  "patientDob",
  "patient_dob",
  "mrn",
  "MRN",
  "diagnosis",
] as const;

export type CallIngestFields = {
  receivedAt?: string;
  callerName: string;
  callerPhone: string;
  callbackPhone?: string;
  callerOrg?: string;
  callType: string;
  origin?: string;
  destination: string;
  notes: string;
  urgency?: string;
  source?: string;
};

function headerToken(req: Request) {
  const bearer = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(bearer.trim());
  if (match?.[1]) return match[1].trim();
  return (req.headers.get("x-call-center-token") ?? "").trim();
}

export function callCenterTokenOk(req: Request) {
  const expected = process.env.CALL_CENTER_INGEST_TOKEN?.trim();
  const provided = headerToken(req);
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function phiFieldsPresent(body: Record<string, unknown>) {
  return PHI_FIELD_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(body, k));
}

function pick(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const v = body[key];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

export function readCallBody(body: Record<string, unknown>): CallIngestFields {
  const callType = pick(body, "callType", "call_type");
  const urgency = pick(body, "urgency") || (callType.toLowerCase() === "organ_rescue" ? "organ_clock" : "urgent");
  return {
    receivedAt: pick(body, "receivedAt", "received_at") || undefined,
    callerName: pick(body, "callerName", "caller_name"),
    callerPhone: pick(body, "callerPhone", "caller_phone"),
    callbackPhone: pick(body, "callbackPhone", "callback_phone") || undefined,
    callerOrg: pick(body, "callerOrg", "caller_org") || undefined,
    callType,
    origin: pick(body, "origin") || undefined,
    destination: pick(body, "destination"),
    notes: pick(body, "notes"),
    urgency,
    source: pick(body, "source") || CALL_CENTER_SOURCE,
  };
}

export function parseReceivedAt(raw?: string) {
  if (!raw?.trim()) return new Date();
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return { error: "receivedAt must be ISO-8601." as const };
  return d;
}
