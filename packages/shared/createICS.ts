interface Event {
    startDate: Date;
    endDate: Date;
    summary: string;
    location: string;
  }
  
  const createICS = (event: Event): string => {
    const { summary, location } = event;
  
    // Get tomorrow's date at 5:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
  
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').replace(/T/g, '');
    };
  
    const content = `
      BEGIN:VCALENDAR
      VERSION:2.0
      BEGIN:VEVENT
      UID:${new Date().getTime()}
      DTSTAMP:${formatDate(new Date())}
      DTSTART:${formatDate(tomorrow)}
      DTEND:${formatDate(new Date(tomorrow.getTime() + 60 * 60 * 1000))}
      SUMMARY:${summary}
      LOCATION:${location}
      END:VEVENT
      END:VCALENDAR
    `.trim().replace(/\n\s*/g, '\n');
  
    console.log(content);
    return content;
  };
  
  export default createICS;
  