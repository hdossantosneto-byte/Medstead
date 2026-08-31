import { NextResponse } from "next/server";
import { ingestCall } from "@/lib/actions";
import { auth } from "@/lib/session";

/**
 * POST /api/calls — Call Center phone intake into MedStead OS.
 *
 * Auth: signed-in admin, ops, or sales (session cookie).
 *
 * JSON body:
 * {
 *   callerName: string,          // facility / caller, NOT a patient name
 *   callerPhone: string,
 *   callerOrg?: string,
 *   callType: "ORGAN_RESCUE" | "MEDICAL_CARGO" | "DOCTOR_CHARTER" | "OTHER_URGENT_MEDICAL",
 *   origin?: string,             // default FLL
 *   destination: string,         // NAS | FPO | MSY
 *   notes?: string,              // operational only — no patient name, DOB, or MRN
 *   urgency: "ROUTINE" | "URGENT" | "ORGAN_CLOCK",
 *   source?: string              // default "call_center"
 * }
 *
 * Creates a CallLog and an MTG Airlines flight so Del gets a next action
 * (Schedule / Dispatch / Notify pilots) without re-typing. organ_rescue
 * opens a TIME-CRITICAL rescue organ trip. Does not claim OPO / UNOS status.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in as admin, ops, or sales." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON body required." }, { status: 400 });
  }
  const b = body as Record<string, string | undefined>;
  const res = await ingestCall({
    callerName: b.callerName ?? "",
    callerPhone: b.callerPhone ?? "",
    callerOrg: b.callerOrg,
    callType: (b.callType as "ORGAN_RESCUE") ?? "OTHER_URGENT_MEDICAL",
    origin: b.origin,
    destination: b.destination ?? "",
    notes: b.notes,
    urgency: (b.urgency as "ROUTINE") ?? "ROUTINE",
    source: b.source,
  });
  if (res && "error" in res && res.error) {
    const status = res.error.includes("sign") || res.error.includes("login") ? 401 : 400;
    return NextResponse.json({ error: res.error }, { status });
  }
  return NextResponse.json(res);
}
