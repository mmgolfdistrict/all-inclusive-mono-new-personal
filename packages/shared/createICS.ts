export interface Event {
  startDate: String;
  endDate: String;
  email?:string;
  // summary: string;
  // location: string;
}

const createICS = (event: Event): string => {
  // const { summary, location } = event;

  const formatDate = (isoDateTime: string, addMinutes: number = 0): string => {
    const date = new Date(isoDateTime);
    
    // Add minutes to the date
    date.setMinutes(date.getMinutes() + addMinutes);
  
    const year = date.getUTCFullYear().toString().padStart(4, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

  
  const convertToCustomFormat = (isoDateTime: string): string => {
    const date = new Date(isoDateTime);
  
    const year = date.getUTCFullYear().toString().padStart(4, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };
  

  const content = `
    BEGIN:VCALENDAR
    PRODID:${new Date().getTime()}
    VERSION:2.0
    METHOD:REQUEST
    BEGIN:VEVENT
    UID:unique-id@example.com
    DTSTAMP:${convertToCustomFormat(new Date().toISOString())}
    DTSTART:${formatDate(`${event.startDate}`)}
    DTEND:${formatDate(`${event.startDate}`,10)}
    SUMMARY:Google Meet Meeting
    LOCATION:Google Meet
    ORGANIZER;CN="Golf district":mailto:nara@golfdistrict.com
    ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;CN="Attendee Name":mailto:${event.email}
    END:VEVENT
    END:VCALENDAR  
    `.trim()
    .replace(/\n\s*/g, "\n");
  return content;
};

export default createICS;
