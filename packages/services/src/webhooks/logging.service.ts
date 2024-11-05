import type { Db } from "@golf-district/database";
import { NextResponse } from "next/server";

interface AuditLog {
  id?: string;
  userId: string;
  teeTimeId: string;
  bookingId: string;
  listingId: string;
  courseId?: string;
  eventId: string;
  json: string;
  createdDateTime?: Date;
  lastUpdatedDateTime?: Date;
  ip?: string;
}

interface ErrorLog {
  applicationName?: string;
  clientIP?: string;
  userId: string;
  url: string;
  userAgent: string;
  message: string;
  stackTrace: string;
  additionalDetailsJSON: string;
  createdDateTime?: string;
  lastUpdatedDateTime?: string;
  ip?: string;
  domainName?: string;
}

export class LoggerService {
  public courseId = "";
  public userIpAddress = "";
  public userAgent = "";
  public userDomainName = "";

  auditLog = async (data: AuditLog, ip = "") => {
    data.ip = ip;
    try {
      const res = await fetch(`${process.env.QSTASH_BASE_URL}${process.env.QSTASH_AUDIT_TOPIC}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Upstash-Delay": `${process.env.QSTASH_AUDIT_DELAY_IN_SECONDS}s`,
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
  };
  errorLog = async (data: ErrorLog, ip = "") => {
    data.applicationName = process.env.APPLICATION_NAME ?? "";
    try {
      const res = await fetch(`${process.env.QSTASH_BASE_URL}${process.env.QSTASH_AUDIT_ERROR_LOG_TOPIC}`, {
        method: "POST",
        body: JSON.stringify(
          {
            ...data,
            courseId: this.courseId,
            clientIP: ip.length > 0 ? ip : this.userIpAddress,
            userAgent: this.userAgent,
            domainName: this.userDomainName,
          }),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Upstash-Delay": `${process.env.QSTASH_AUDIT_DELAY_IN_SECONDS}s`,
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
  };
}

export const loggerService = new LoggerService();