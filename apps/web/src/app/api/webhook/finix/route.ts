import { NextRequest, NextResponse } from "next/server";
import { processFinixWebhook } from "@golf-district/api";
import { db } from "@golf-district/database";
export async function POST(request: NextRequest) {
    try {
        console.log("inside finix  webhook call");
        const reqJSON = await request.json();
        await processFinixWebhook(reqJSON);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: true })
    }
}
