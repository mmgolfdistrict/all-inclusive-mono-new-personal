export interface Event {
  startDate: string;
  endDate: string;
  email?: string;
  address?: string | null;
  name?: string | null;
  reservationId?: string | null;
  courseReservation?: string | null;
  numberOfPlayer?: string | null;
  playTime?: string | null;
  reservationGroupId?: string | null;
  // summary: string;
  // location: string;
}

const createICS = (event: Event, sequence = 0): string => {
  // Converts a date string into ICS-compliant UTC format (YYYYMMDDTHHmmssZ)
  const formatToUTC = (dateString: string): string => {
    const dt = new Date(dateString);
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dt.getUTCDate()).padStart(2, "0");
    const hours = String(dt.getUTCHours()).padStart(2, "0");
    const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
    const seconds = String(dt.getUTCSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  // If no endDate provided, add 1 hour to startDate
  const calculateEndDate = (start: string, end?: string): string => {
    if (end) return end;
    const dt = new Date(start);
    dt.setHours(dt.getHours() + 1);
    return dt.toISOString();
  };

  const dtEnd = calculateEndDate(event.startDate, event.endDate);

  const content = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GolfDistrict//Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${event.reservationId || "no-id"}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}@golfdistrict.com
SEQUENCE:${sequence}
DTSTAMP:${formatToUTC(event.startDate)}
DTSTART:${formatToUTC(event.startDate)}
DTEND:${formatToUTC(dtEnd)}
SUMMARY:${event.name ?? "Golf Reservation"}
LOCATION:${event.address ?? "Not Provided"}
DESCRIPTION:Reservation ID: ${event.reservationId ?? "N/A"}, Players: ${event.numberOfPlayer ?? "N/A"
    }
STATUS:CONFIRMED
TRANSP:OPAQUE
ORGANIZER;CN=Golf District:MAILTO:${process.env.SENDGRID_EMAIL ?? "noreply@golfdistrict.com"
    }
ATTENDEE;CN=Guest;RSVP=TRUE:MAILTO:${event.email ?? ""}
END:VEVENT
END:VCALENDAR
  `.trim();

  return content;
};

export default createICS;
