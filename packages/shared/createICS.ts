// createICS.ts — FINAL VERSION (use as-is)
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { randomUUID } from "crypto";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface Event {
  startDate: string; // stored in course local time (e.g. "2025-10-31 14:24:00.000")
  endDate?: string;
  email?: string;
  courseTimeZone?: string; // e.g. "America/Los_Angeles" (REQUIRED)
  name?: string | null;
  address?: string | null;
  reservationId?: string | null;
  courseReservation?: string | null;
  numberOfPlayer?: string | null;
  playTime?: string | null;
  reservationGroupId?: string | null;
  attendeeEmail?: string | null;
}

/**
 * IMPORTANT:
 * DB times are already in course local timezone.
 * We DO NOT convert or shift. We interpret them as-is.
 */
export default function createICS(event: Event, sequence = 0): string {
  console.log("hello called with event:", event, "sequence:", sequence);

  // ✅ Helper: validate IANA timezone
  function isValidTimeZone(tz: string | undefined): boolean {
    if (!tz) return false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  const tz = isValidTimeZone(event.courseTimeZone)
    ? event.courseTimeZone
    : "America/Los_Angeles"; // ✅ Safe fallback
  const datePart = dayjs(event.startDate).format("YYYY-MM-DD");
  const playTime = event.playTime?.trim();

  // ✅ NEW: ensure playTime is actually a time like "3:45 PM"
  const isValidPlayTime = playTime && /^[0-9]{1,2}:[0-9]{2}\s?(AM|PM)$/i.test(playTime);

  let startMoment;

  if (isValidPlayTime) {
    // ✅ Build datetime using date + playTime in course timezone
    startMoment = dayjs.tz(`${datePart} ${playTime}`, "YYYY-MM-DD h:mm A", tz);
  } else {
    // ✅ Interpret stored DB time as already local
    startMoment = dayjs.tz(event.startDate, tz);
  }

  // end time
  let endMoment;

  if (event.endDate) {
    const endDatePart = dayjs(event.endDate).format("YYYY-MM-DD");
    if (isValidPlayTime) {
      endMoment = dayjs.tz(`${endDatePart} ${playTime}`, "YYYY-MM-DD h:mm A", tz).add(1, "hour");
    } else {
      endMoment = dayjs.tz(event.endDate, tz).add(1, "hour");
    }
  } else {
    endMoment = startMoment.add(1, "hour");
  }

  const formatICSDate = (d: dayjs.Dayjs) => d.format("YYYYMMDDTHHmmss");

  const uidBase = event.reservationGroupId ?? event.courseReservation ?? "reservation";
  const uid = `${uidBase}-${Date.now()}-${randomUUID()}@golfdistrict.com`;

  const dtStamp = dayjs.utc().format("YYYYMMDDTHHmmss") + "Z";
  const dtStart = formatICSDate(startMoment);
  const dtEnd = formatICSDate(endMoment);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GolfDistrict//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${tz}:${dtStart}`,
    `DTEND;TZID=${tz}:${dtStart}`,
    `SUMMARY:${(event.name ?? "Golf Reservation").replace(/\r?\n/g, " ")}`,
    `LOCATION:${(event.address ?? "").replace(/\r?\n/g, " ")}`,
    `DESCRIPTION:Reservation ID: ${uidBase}\\nPlayers: ${event.numberOfPlayer ?? "N/A"}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    `ORGANIZER;CN=Golf District:MAILTO:${process.env.SENDGRID_EMAIL ?? "noreply@golfdistrict.com"}`,
  ];

  if (event.attendeeEmail) {
    lines.push(`ATTENDEE;CN=Guest;RSVP=TRUE:MAILTO:${event.attendeeEmail}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
