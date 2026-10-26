/**
 * DocClear Smart Calendar Integration Utility
 * Generates 1-click links for Google Calendar, Outlook, and Apple / Device (.ics) calendars.
 */

export interface CalendarEventPayload {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  location?: string;
}

/**
 * Parses natural language dates and durations into concrete Date objects
 */
export function parseEventDateTime(
  dateOrDuration: string,
  contextText: string = ""
): { startDate: Date; endDate: Date; allDay: boolean } {
  const combined = `${dateOrDuration} ${contextText}`.toLowerCase();
  const now = new Date();

  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();
  let targetDay = now.getDate();
  let targetHours = 9;
  let targetMinutes = 0;
  let allDay = false;

  // 1. Look for explicit year (e.g. 2026, 2027)
  const yearMatch = combined.match(/\b(202\d)\b/);
  if (yearMatch) {
    targetYear = parseInt(yearMatch[1], 10);
  }

  // 2. Look for Month Name (e.g. November, Nov)
  const monthNames = [
    { name: "january", short: "jan", idx: 0 },
    { name: "february", short: "feb", idx: 1 },
    { name: "march", short: "mar", idx: 2 },
    { name: "april", short: "apr", idx: 3 },
    { name: "may", short: "may", idx: 4 },
    { name: "june", short: "jun", idx: 5 },
    { name: "july", short: "jul", idx: 6 },
    { name: "august", short: "aug", idx: 7 },
    { name: "september", short: "sep", idx: 8 },
    { name: "october", short: "oct", idx: 9 },
    { name: "november", short: "nov", idx: 10 },
    { name: "december", short: "dec", idx: 11 },
  ];

  let foundMonth: number | null = null;
  for (const m of monthNames) {
    const regex = new RegExp(`\\b(${m.name}|${m.short})\\b`, "i");
    if (regex.test(combined)) {
      foundMonth = m.idx;
      break;
    }
  }

  if (foundMonth !== null) {
    targetMonth = foundMonth;
    // Look for day number near month or in string (e.g. "12 November", "November 12", "12th")
    const dayMatch = combined.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) ||
                     combined.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
    if (dayMatch) {
      targetDay = parseInt(dayMatch[1], 10);
    }
  }

  // 3. Look for explicit Time (e.g. 10:30 AM, 2:00 PM)
  const timeMatch = combined.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridian = timeMatch[3]?.toLowerCase();

    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;

    targetHours = hours;
    targetMinutes = minutes;
  } else {
    // If no explicit time was specified, treat as morning or all-day
    allDay = true;
  }

  // 4. Handle relative offsets: "20 minutes before 10:30 AM"
  if (/20\s*min(?:utes?)?\s*before/i.test(combined)) {
    targetMinutes -= 20;
    if (targetMinutes < 0) {
      targetMinutes += 60;
      targetHours -= 1;
    }
    allDay = false;
  }

  // 5. Handle relative offsets: "24 hours before" / "1 day before"
  if (/24\s*hours?\s*before|1\s*day\s*before/i.test(combined)) {
    targetDay -= 1;
    allDay = false;
  }

  // 6. Handle "within X days"
  const withinDaysMatch = combined.match(/within\s+(\d+)\s*(?:calendar\s*)?days/i);
  if (withinDaysMatch) {
    const daysToAdd = parseInt(withinDaysMatch[1], 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    targetYear = futureDate.getFullYear();
    targetMonth = futureDate.getMonth();
    targetDay = futureDate.getDate();
  }

  const startDate = new Date(targetYear, targetMonth, targetDay, targetHours, targetMinutes, 0);
  const endDate = new Date(startDate.getTime() + (allDay ? 24 * 60 * 60 * 1000 : 45 * 60 * 1000)); // Default 45 min duration

  return { startDate, endDate, allDay };
}

/**
 * Format a Date to UTC string for Google / iCal (YYYYMMDDTHHmmssZ)
 */
function formatUtcDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Format a Date to YYYYMMDD for all-day events
 */
function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * 1. Generates 1-Click Google Calendar Web Intent URL
 */
export function getGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const { title, description, startDate, endDate, allDay, location } = payload;
  const baseUrl = "https://calendar.google.com/calendar/render";

  const datesParam = allDay
    ? `${formatUtcDateOnly(startDate)}/${formatUtcDateOnly(endDate)}`
    : `${formatUtcDateTime(startDate)}/${formatUtcDateTime(endDate)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: datesParam,
  });

  if (location) {
    params.set("location", location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 2. Generates 1-Click Outlook / Office 365 Web URL
 */
export function getOutlookCalendarUrl(payload: CalendarEventPayload): string {
  const { title, description, startDate, endDate, allDay, location } = payload;
  const baseUrl = "https://outlook.live.com/calendar/0/deeplink/compose";

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    body: description,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    allday: allDay ? "true" : "false",
  });

  if (location) {
    params.set("location", location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 3. Generates standard iCalendar (.ics) content for Apple & Device Calendar
 */
export function generateIcsContent(payload: CalendarEventPayload, id: string = "docclear"): string {
  const { title, description, startDate, endDate, allDay, location } = payload;
  const nowStr = formatUtcDateTime(new Date());

  const dtStart = allDay
    ? `DTSTART;VALUE=DATE:${formatUtcDateOnly(startDate)}`
    : `DTSTART:${formatUtcDateTime(startDate)}`;
  const dtEnd = allDay
    ? `DTEND;VALUE=DATE:${formatUtcDateOnly(endDate)}`
    : `DTEND:${formatUtcDateTime(endDate)}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DocClear//Smart Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}-${id}@docclear.app`,
    `DTSTAMP:${nowStr}`,
    dtStart,
    dtEnd,
    `SUMMARY:${title.replace(/\n/g, " ").trim()}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n").trim()}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location.replace(/\n/g, " ").trim()}`);
  }

  // 15-minute alarm reminder
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${title.replace(/\n/g, " ").trim()}`,
    "END:VALARM"
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Triggers standard browser .ics download (Prompts iOS/Android/Windows/Mac native calendar)
 */
export function downloadIcsFile(payload: CalendarEventPayload, filename: string = "event.ics"): void {
  const icsText = generateIcsContent(payload);
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
