export interface Event {
  startDate: string;
  endDate: string;
  email?: string;
  address?:string|null;
  name?:string|null;
  reservationId?:string|null,
  courseReservation?:string|null,
  numberOfPlayer?:string|null
  // summary: string;
  // location: string;
}

  const createICS = (event: Event): string => {

    const convertToUTCString=(dtStr: string, nextDay?: boolean): string =>{
      let dt = new Date(dtStr);
      if (nextDay) {
        dt.setDate(dt.getDate() + 1);
      }
      const year = dt.getUTCFullYear();
      const month = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = dt.getUTCDate().toString().padStart(2, '0');
      const utcStr = `${year}${month}${day}`;
      return utcStr;
    }

  const content = `
    BEGIN:VCALENDAR
    PRODID:${new Date().getTime()}
    VERSION:2.0
    METHOD:REQUEST
    BEGIN:VEVENT
    UID:unique-id@example.com
    DTSTAMP:${convertToUTCString(`${event.startDate}`)}
    DTSTART:${convertToUTCString(`${event.startDate}`)}
    DTEND:${convertToUTCString(`${event.startDate}`,true)}
    SUMMARY:Golf Reservation at ${event.name}
    LOCATION:${event.address}
    DESCRIPTION: GOLFdistrict Reservation : ${event.reservationId} , Course Reservation : ${event.courseReservation},  Number of Players :  ${event.numberOfPlayer}
    ORGANIZER:mailto:${process.env.SENDGRID_EMAIL}
    BEGIN:VALARM
    ACTION:DISPLAY
    TRIGGER:PT18H
    DESCRIPTION:Reminder
    END:VALARM
    ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;CN="Attendee Name":mailto:${event.email}
    END:VEVENT
    END:VCALENDAR  
    `
    .trim()
    .replace(/\n\s*/g, "\n");
  return content;
};

export default createICS;
