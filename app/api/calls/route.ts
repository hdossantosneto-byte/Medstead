import { NextResponse } from "next/server";
import { persistIncomingCall } from "@/lib/actions";
import {
  callCenterTokenOk,
  phiFieldsPresent,
  readCallBody,
} from "@/lib/call-center";
import { auth } from "@/lib/session";

/**
 * POST /api/calls — Call Center phone intake into MedStead OS.
 *
 * Auth (either):
 *   Authorization: Bearer $CALL_CENTER_INGEST_TOKEN
 *   x-call-center-token: $CALL_CENTER_INGEST_TOKEN
 *   or a signed-in admin / ops / sales session cookie (in-app staff).
 *
 * Main line / default source: +1-954-228-4551
 *
 * Call Center copy-paste example (POST to this app’s /api/calls — no invented public URL):
 *
 *   curl -sS -X POST "$ORIGIN/api/calls" \
 *     -H "Authorization: Bearer $CALL_CENTER_INGEST_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "receivedAt": "2026-08-31T16:00:00.000Z",
 *       "callerName": "Nassau Transfer Desk",
 *       "callerPhone": "+1 242 555 0140",
 *       "callType": "organ_rescue",
 *       "destination": "NAS",
 *       "notes": "Clock on. Operational only.",
 *       "source": "+1-954-228-4551"
 *     }'
 *
 * Required: receivedAt (ISO-8601), callerName, callerPhone, callType
 *   (organ_rescue | medical_cargo | doctor_charter | other_urgent_medical),
 *   destination, notes, source (defaults to +1-954-228-4551 if omitted).
 * Optional: callerOrg, origin, callbackPhone, urgency (routine | urgent | organ_clock).
 * Rejected (never stored): patientName, dob, mrn, diagnosis, and the same in snake_case.
 *
 * Creates a CallLog and an MTG Airlines trip so Del gets a next action
 * (Schedule / Dispatch / Notify pilots) without re-typing.
 * organ_rescue opens a TIME-CRITICAL rescue organ trip + Notify pilots.
 * Not an OPO / UNOS claim. Part 135 stays NOT LIVE. No PHI on this record.
 */
export async function POST(req: Request) {
  const tokenOk = callCenterTokenOk(req);
  const session = tokenOk ? null : await auth();
  const role = session?.user?.role;
  const staff =
    role === "MEDSTEAD_ADMIN" || role === "OPS" || role === "SALES";
  if (!tokenOk && !staff) {
    return NextResponse.json(
      { error: "Call Center token or sign-in as admin, ops, or sales." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON body required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "JSON object required." }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  const phi = phiFieldsPresent(raw);
  if (phi.length) {
    return NextResponse.json(
      { error: "Do not send patient name, DOB, MRN, or diagnosis. Those fields are dropped." },
      { status: 400 },
    );
  }

  const fields = readCallBody(raw);
  if (
    !fields.callerName ||
    !fields.callerPhone ||
    !fields.callType ||
    !fields.destination ||
    !fields.notes ||
    (tokenOk && !fields.receivedAt)
  ) {
    return NextResponse.json(
      { error: "receivedAt, callerName, callerPhone, callType, destination, and notes are required." },
      { status: 400 },
    );
  }

  const res = await persistIncomingCall(
    {
      receivedAt: fields.receivedAt,
      callerName: fields.callerName,
      callerPhone: fields.callerPhone,
      callbackPhone: fields.callbackPhone,
      callerOrg: fields.callerOrg,
      callType: fields.callType,
      origin: fields.origin,
      destination: fields.destination,
      notes: fields.notes,
      urgency: fields.urgency,
      source: fields.source,
    },
    tokenOk ? null : session?.user?.id,
  );
  if (res && "error" in res && res.error) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json(res);
}
