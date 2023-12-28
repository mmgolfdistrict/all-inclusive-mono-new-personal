import { processHyperSwitchWebhook } from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await processHyperSwitchWebhook(await req.json());
  return NextResponse.json({ ok: true });
}
