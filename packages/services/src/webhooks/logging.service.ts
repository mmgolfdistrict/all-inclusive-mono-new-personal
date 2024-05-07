import type { Db } from "@golf-district/database";
import { NextResponse } from "next/server";

interface AuditLog {
  id: string;
  userId: string;
  teeTimeId: string;
  bookingId: string;
  listingId: string;
  eventId: string;
  json: string;
  createdAt?: Date;
  lastUpdatedDateTime?: Date;
}


export class LoggerService {
  constructor(
    private readonly database: Db 
  ) {}

  auditLog= async (data:AuditLog)=>{
    try {
      const res = await fetch(`${process.env.QSTASH_BASE_URL}/v2/publish/${process.env.QSTASH_AUDIT_TOPIC}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
          Authorization:
            `Bearer ${process.env.QSTASH_TOKEN}`,
          "Upstash-Delay": "5s",
        },
      });
      if (res.ok) {
        return NextResponse.json({ message: "Message successfully sent." });
      } else {
        return NextResponse.json({ error: "Oops! Something is wrong." }, { status: 500 });
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
    }
  }

}
