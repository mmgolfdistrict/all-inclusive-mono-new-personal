import { processForeUpWebhook } from "@golf-district/api";
import { NextResponse } from "next/server";

export const maxDuration = 300; //5min timeout
export const dynamic = "force-dynamic";

export async function POST() {
  await processForeUpWebhook();
  return NextResponse.json({ ok: true });
}
