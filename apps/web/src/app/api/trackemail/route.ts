import { trackEmailOpen } from "@golf-district/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    console.log("email open successfully");
    const url = req.nextUrl;  
    const queryParams = url.searchParams;
    const id = queryParams.get('id')!;
    await trackEmailOpen(id);
    return NextResponse.json({ ok: true });
}