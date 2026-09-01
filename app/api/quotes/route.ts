import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cargoFieldsHit } from "@/lib/cargo";
import { CARGO_REJECT_MESSAGE } from "@/lib/constants";
import { createFreightQuote } from "@/lib/actions";
import { quoteFreight } from "@/lib/pricing";

const schema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  service: z.enum(["EXPRESS_AIR", "STANDARD_SEA"]),
  weightLb: z.number().positive(),
  pieces: z.number().int().positive(),
  description: z.string().optional(),
  retailerUrl: z.string().optional(),
  createShipment: z.boolean().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  pickupPoint: z.string().optional(),
  destAddress: z.string().optional(),
  readyDate: z.string().optional(),
  originMode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  }
  const hit = cargoFieldsHit(parsed.data.description, parsed.data.retailerUrl);
  if (hit) {
    return NextResponse.json({ error: CARGO_REJECT_MESSAGE }, { status: 400 });
  }
  const amounts = quoteFreight(parsed.data);
  try {
    const saved = await createFreightQuote({
      ...parsed.data,
      createShipment: parsed.data.createShipment !== false,
    });
    if ("error" in saved && saved.error) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    return NextResponse.json({ ...amounts, ...saved });
  } catch {
    return NextResponse.json({ ...amounts, saved: false });
  }
}
