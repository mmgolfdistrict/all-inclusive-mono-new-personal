import { processUpdateWithdrawableBalance } from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as { userId: string; amount: number };
    await processUpdateWithdrawableBalance(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false });
  }
};
