import { processHyperSwitchWebhook } from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("hyperswitch webhook called");
  console.log(req);
  console.log(req.json());

  await processHyperSwitchWebhook(await req.json());
  return NextResponse.json({ ok: true });
}
