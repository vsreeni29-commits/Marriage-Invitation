import { eventEnd, eventStart, weddingConfig } from '../config/weddingConfig';

/**
 * Calendar export.
 *
 * Times are written in UTC (the `Z` form), which every calendar client
 * converts back to the guest's own zone correctly — the 6:00 PM IST start
 * stays 6:00 PM IST for someone in Chennai and shows as 8:30 PM for someone in
 * Singapore, which is exactly right.
 */

const { couple, event, venue } = weddingConfig;

export const calendarTitle = `${couple.bride} & ${couple.groom} — ${event.name}`;

const location = `${venue.name}, ${venue.address}`;

const description = [
  `${couple.bride} & ${couple.groom} — ${event.name}.`,
  '',
  `Venue: ${venue.name}`,
  venue.address,
  `Directions: ${venue.googleMapsUrl}`,
].join('\n');

const toUtcStamp = (date: Date): string =>
  `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

/** RFC 5545 requires long lines to be folded at 75 octets. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const chunks: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    chunks.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  if (rest.length) chunks.push(` ${rest}`);
  return chunks.join('\r\n');
}

const escape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function buildIcs(): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rinsha and Sreeni//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${event.timezone}`,
    'BEGIN:VEVENT',
    `UID:reception-${event.date}@rinsha-sreeni`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(eventStart)}`,
    `DTEND:${toUtcStamp(eventEnd)}`,
    `SUMMARY:${escape(calendarTitle)}`,
    `DESCRIPTION:${escape(description)}`,
    `LOCATION:${escape(location)}`,
    `URL:${weddingConfig.site.url}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(`${calendarTitle} is tomorrow`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n');
}

/** Google Calendar's "add event" URL — a reliable fallback on locked-down phones. */
export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calendarTitle,
    dates: `${toUtcStamp(eventStart)}/${toUtcStamp(eventEnd)}`,
    details: description,
    location,
    ctz: event.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export type CalendarResult = 'downloaded' | 'failed';

export function downloadIcs(): CalendarResult {
  try {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rinsha-and-sreeni-reception.ics';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
