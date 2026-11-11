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

const MONTHS = [
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

const MONTH_PATTERN =
  "january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec";

function monthIndexFromToken(token: string): number | null {
  const norm = token.toLowerCase();
  const normalized = norm === "sept" ? "sep" : norm;
  const found = MONTHS.find((m) => m.name === normalized || m.short === normalized);
  return found ? found.idx : null;
}

/**
 * Extracts an explicit calendar date (year/month/day) from text while avoiding
 * false positives on the English modal verb "may".
 */
function findExplicitDate(source: string): {
  year?: number;
  month?: number;
  day?: number;
  hasDate: boolean;
} {
  if (!source) return { hasDate: false };

  // Pattern A: "12 November 2026" or "12th of Nov"
  const dayFirstRe = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})(?:[.,]?\\s+(202\\d))?\\b`,
    "i"
  );
  const m1 = source.match(dayFirstRe);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const month = monthIndexFromToken(m1[2]);
    const year = m1[3] ? parseInt(m1[3], 10) : undefined;
    if (month !== null && day >= 1 && day <= 31) {
      return { year, month, day, hasDate: true };
    }
  }

  // Pattern B: "November 12, 2026" or "Nov 12th"
  const monthFirstRe = new RegExp(
    `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[.,]?\\s+(202\\d))?\\b`,
    "i"
  );
  const m2 = source.match(monthFirstRe);
  if (m2) {
    const month = monthIndexFromToken(m2[1]);
    const day = parseInt(m2[2], 10);
    const year = m2[3] ? parseInt(m2[3], 10) : undefined;
    if (month !== null && day >= 1 && day <= 31) {
      return { year, month, day, hasDate: true };
    }
  }

  // Pattern C: Capitalized "May 2026" (never matches lowercase modal verb "may")
  const mayYearRe = /\bMay\s+(202\d)\b/;
  const mMay = source.match(mayYearRe);
  if (mMay) {
    return { year: parseInt(mMay[1], 10), month: 4, hasDate: true };
  }

  // Pattern D: Explicit standalone year only (e.g. "2026") paired with unambiguous month
  const yearMatch = source.match(/\b(202\d)\b/);
  for (const m of MONTHS) {
    if (m.name === "may") continue; // Skip bare "may" without numeric day/year to avoid matching verb "may"
    const bareRe = new RegExp(`\\b(${m.name}|${m.short})\\b`, "i");
    if (bareRe.test(source)) {
      return {
        year: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
        month: m.idx,
        hasDate: true,
      };
    }
  }

  return {
    year: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
    hasDate: false,
  };
}

/**
 * Extracts clock time (hours/minutes) from text; returns null if not present.
 */
function findExplicitTime(source: string): { hours: number; minutes: number } | null {
  if (!source) return null;
  const timeMatch = source.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const meridian = timeMatch[3]?.toLowerCase();

  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Parses natural language dates and durations into concrete Date objects
 */
export function parseEventDateTime(
  dateOrDuration: string,
  contextText: string = ""
): { startDate: Date; endDate: Date; allDay: boolean; hasExplicitDate: boolean } {
  const timingLower = (dateOrDuration || "").toLowerCase();
  const combinedLower = `${dateOrDuration || ""} ${contextText || ""}`.toLowerCase();
  const now = new Date();

  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();
  let targetDay = now.getDate();
  let targetHours = 9;
  let targetMinutes = 0;
  let allDay = false;
  let hasExplicitDate = false;

  // 1. Prioritize explicit date found in the event's own timing label, else scan document context
  const primaryDate = findExplicitDate(dateOrDuration || "");
  const contextDate = primaryDate.hasDate ? primaryDate : findExplicitDate(contextText || "");

  if (contextDate.hasDate) {
    hasExplicitDate = true;
    if (contextDate.year !== undefined) targetYear = contextDate.year;
    if (contextDate.month !== undefined) targetMonth = contextDate.month;
    if (contextDate.day !== undefined) targetDay = contextDate.day;
  } else if (primaryDate.year !== undefined || contextDate.year !== undefined) {
    targetYear = (primaryDate.year ?? contextDate.year) as number;
  }

  // 2. Prioritize explicit time in the event's timing string before context fallback
  const parsedTime = findExplicitTime(dateOrDuration || "") ?? findExplicitTime(contextText || "");
  if (parsedTime) {
    targetHours = parsedTime.hours;
    targetMinutes = parsedTime.minutes;
  } else {
    allDay = true;
  }

  // 3. Handle relative offsets: "20 minutes before 10:30 AM"
  if (/20\s*min(?:utes?)?\s*before/i.test(timingLower) || /20\s*min(?:utes?)?\s*before/i.test(combinedLower)) {
    const minutesBeforeMatch = combinedLower.match(/(\d+)\s*min(?:utes?)?\s*before/i);
    const offsetMins = minutesBeforeMatch ? parseInt(minutesBeforeMatch[1], 10) : 20;
    const totalMins = targetHours * 60 + targetMinutes - offsetMins;
    if (totalMins < 0) {
      targetDay -= 1;
      const wrapped = 24 * 60 + totalMins;
      targetHours = Math.floor(wrapped / 60);
      targetMinutes = wrapped % 60;
    } else {
      targetHours = Math.floor(totalMins / 60);
      targetMinutes = totalMins % 60;
    }
    allDay = false;
  }

  // 4. Handle relative offsets: "24 hours before" / "1 day before"
  if (/24\s*hours?\s*before|1\s*day\s*before/i.test(timingLower)) {
    const shifted = new Date(targetYear, targetMonth, targetDay - 1);
    targetYear = shifted.getFullYear();
    targetMonth = shifted.getMonth();
    targetDay = shifted.getDate();
    if (parsedTime) {
      allDay = false;
    }
  }

  // 5. Handle "within X days"
  const withinDaysMatch = timingLower.match(/within\s+(\d+)\s*(?:calendar\s*|working\s*)?days/i) ||
                          combinedLower.match(/within\s+(\d+)\s*(?:calendar\s*|working\s*)?days/i);
  if (withinDaysMatch) {
    const daysToAdd = parseInt(withinDaysMatch[1], 10);
    const baseDate = hasExplicitDate ? new Date(targetYear, targetMonth, targetDay) : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    targetYear = baseDate.getFullYear();
    targetMonth = baseDate.getMonth();
    targetDay = baseDate.getDate();
    hasExplicitDate = true;
  }

  const startDate = new Date(targetYear, targetMonth, targetDay, targetHours, targetMinutes, 0);
  const endDate = new Date(startDate.getTime() + (allDay ? 24 * 60 * 60 * 1000 : 45 * 60 * 1000)); // Default 45 min duration

  return { startDate, endDate, allDay, hasExplicitDate };
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
