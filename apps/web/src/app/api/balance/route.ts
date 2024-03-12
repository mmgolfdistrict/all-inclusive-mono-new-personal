import {
  processUpdateWithdrawableBalance,
  verifySignatureAppRouter,
} from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

async function handler(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId: string; amount: number };
    await processUpdateWithdrawableBalance(body);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}

//@ts-expect-error
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "sig_XYZ",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "sig_XYZ",
});
