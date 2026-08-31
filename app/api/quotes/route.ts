import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createFreightQuote } from "@/lib/actions";
import { quoteFreight } from "@/lib/pricing";

const schema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  service: z.enum(["EXPRESS_AIR", "STANDARD_SEA"]),
  weightLb: z.number().positive(),
  pieces: z.number().int().positive(),
  description: z.string().optional(),
  createShipment: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  }
  const amounts = quoteFreight(body.data);
  try {
    const saved = await createFreightQuote(body.data);
    return NextResponse.json({ ...amounts, ...saved });
  } catch {
    return NextResponse.json({ ...amounts, saved: false });
  }
}
