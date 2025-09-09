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
  const convertToUTCString = (dtStr: string, nextDay?: boolean): string => {
    const dt = new Date(dtStr);
    if (nextDay) {
      dt.setDate(dt.getDate() + 1);
    }
    const year = dt.getUTCFullYear();
    const month = (dt.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = dt.getUTCDate().toString().padStart(2, "0");
    const utcStr = `${year}${month}${day}`;
    return utcStr;
  };

  const getTimeFromString = (inputString: string) => {
    const time = inputString.substring(11, 19);
    return time;
  };

  const content = `
  BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//GolfDistrict//Booking//EN
  CALSCALE:GREGORIAN
  METHOD:REQUEST
  BEGIN:VEVENT
  UID:${event.reservationId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@golfdistrict.com
  SEQUENCE:${sequence}
  DTSTAMP:${convertToUTCString(`${event.startDate}`)}
  DTSTART:${convertToUTCString(`${event.startDate}`)}
  DTEND:${convertToUTCString(`${event.startDate}`, true)}
  SUMMARY:${event.name}
  LOCATION:${event.address}
  DESCRIPTION:Reservation ID: ${event.reservationId}, Players: ${event.numberOfPlayer}
  STATUS:CONFIRMED
  TRANSP:OPAQUE
  ORGANIZER;CN=Golf District:MAILTO:${process.env.FROM_EMAIL}
  ATTENDEE;CN=Guest;RSVP=TRUE:MAILTO:${event.email}
  END:VEVENT
  END:VCALENDAR
  `.trim()
  return content;
};

export default createICS;
