import { processHyperSwitchWebhook } from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

export async function POST(req: NextRequest) {
  console.log("hyperswitch webhook called.");
  console.log(req);
  const reqJSON = await req.json();
  console.log(reqJSON);

  await processHyperSwitchWebhook(reqJSON);
  return NextResponse.json({ ok: true });
}
