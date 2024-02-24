import { processStripeWebhook } from "@golf-district/api";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const sig = headers().get("stripe-signature");
  console.log("stripe webhook called");
  if (!sig) return NextResponse.json({ ok: false });
  await processStripeWebhook(await req.text(), sig);
  return NextResponse.json({ ok: true });
}
