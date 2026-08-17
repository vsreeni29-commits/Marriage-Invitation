/**
 * Single source of truth for every piece of event information on the site.
 *
 * Nothing in `src/components` should hardcode a name, date, time or address —
 * everything reads from here so the invitation can be updated in one place.
 */

/** One line of the evening's running order. */
export interface ScheduleItem {
  /** Display time, exactly as guests should read it. */
  time: string;
  title: string;
  detail?: string;
}

export interface WeddingConfig {
  couple: {
    bride: string;
    groom: string;
    brideOrigin: string;
    groomOrigin: string;
    initials: string;
  };
  event: {
    name: string;
    /** ISO calendar date, YYYY-MM-DD */
    date: string;
    /** 24h local (IST) start time, HH:MM */
    startTime: string;
    /** 24h local (IST) end time, HH:MM */
    endTime: string;
    timezone: string;
    /** Fixed UTC offset for the event timezone, used to build absolute instants. */
    utcOffset: string;
  };
  venue: {
    name: string;
    address: string;
    city: string;
    googleMapsUrl: string;
    /** Approximate coordinates, used for the drawn map card and the live embed. */
    coordinates: { lat: number; lng: number };
  };
  /** The running order shown on the timeline. Edit freely — order is respected. */
  schedule: ScheduleItem[];
  dressCode: {
    /** What to wear, in one sentence. */
    note: string;
    /** Swatches guests can actually look at. Any number; four or five reads best. */
    palette: { name: string; hex: string }[];
    /** Anything to steer away from. Leave empty to hide the line. */
    avoid?: string;
  };
  gifts: {
    title: string;
    note: string;
  };
  site: {
    /** Canonical URL — update once a custom domain is connected. */
    url: string;
    title: string;
    description: string;
    shareMessage: string;
    themeColor: string;
  };
}

export const weddingConfig: WeddingConfig = {
  couple: {
    bride: 'Rinsha',
    groom: 'Sreeni',
    brideOrigin: 'Kerala',
    groomOrigin: 'Tamil Nadu',
    initials: 'R + S',
  },
  event: {
    name: 'Wedding Reception',
    date: '2026-09-17',
    startTime: '18:00',
    endTime: '22:00',
    timezone: 'Asia/Kolkata',
    utcOffset: '+05:30',
  },
  venue: {
    name: 'Sree Gupta Bhavan – SgB',
    address: '175, Velachery Main Road, Gowriwakkam, Chennai, Tamil Nadu – 600073',
    city: 'Chennai',
    googleMapsUrl: 'https://maps.app.goo.gl/qxPLmU2nv74WX3Rw8',
    coordinates: { lat: 12.9165, lng: 80.1918 },
  },
  // TODO (Rinsha & Sreeni): these five lines are a sensible reception shape,
  // not your actual running order — replace the titles and times with what the
  // hall has planned. The timeline renders however many entries are here.
  schedule: [
    { time: '6:00 PM', title: 'Guests arrive', detail: 'Welcome drinks and a room slowly filling up.' },
    { time: '6:30 PM', title: 'The couple enter', detail: 'The only moment we ask you to be seated.' },
    { time: '7:00 PM', title: 'Blessings & photographs', detail: 'Come up, say hello, be in the picture.' },
    { time: '8:00 PM', title: 'Dinner is served', detail: 'Kerala and Tamil kitchens, one buffet.' },
    { time: '9:30 PM', title: 'Music & farewell', detail: 'Stay as long as you like.' },
  ],
  dressCode: {
    note: 'South Indian festive. Silk if you have it, comfort if you don’t — the hall is warm and the evening is long.',
    palette: [
      { name: 'Kasavu cream', hex: '#f1e4cd' },
      { name: 'Temple gold', hex: '#b8934a' },
      { name: 'Forest green', hex: '#35594a' },
      { name: 'Terracotta', hex: '#a85535' },
    ],
    avoid: 'We’d gently ask you to leave pure white and deep black for another evening.',
  },
  gifts: {
    title: 'Gift preference',
    note: 'Your presence is genuinely the whole gift. If you’d still like to mark the day, a note in your own handwriting will outlast anything boxed.',
  },
  site: {
    url: 'https://vsreeni29-commits.github.io/Marriage-Invitation/',
    title: 'Rinsha & Sreeni | Wedding Reception · 17 September 2026',
    description:
      'Join Rinsha & Sreeni as they celebrate two traditions, two cultures and one beautiful beginning on 17 September 2026 in Chennai.',
    shareMessage:
      'Rinsha & Sreeni are celebrating their new beginning on 17 September 2026. We’d love for you to join us.',
    themeColor: '#1f3a32',
  },
};

/** Absolute instant of the celebration's start, independent of the visitor's timezone. */
export const eventStart = new Date(
  `${weddingConfig.event.date}T${weddingConfig.event.startTime}:00${weddingConfig.event.utcOffset}`,
);

/** Absolute instant of the celebration's end. */
export const eventEnd = new Date(
  `${weddingConfig.event.date}T${weddingConfig.event.endTime}:00${weddingConfig.event.utcOffset}`,
);

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: weddingConfig.event.timezone,
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: weddingConfig.event.timezone,
});

const parts = dateFormatter.formatToParts(eventStart);
const part = (type: Intl.DateTimeFormatPartTypes) =>
  parts.find((p) => p.type === type)?.value ?? '';

/** Pre-formatted, IST-correct strings used across the invitation. */
export const formattedEvent = {
  weekday: part('weekday'),
  day: part('day'),
  month: part('month'),
  year: part('year'),
  /** e.g. "17 September 2026" */
  longDate: `${part('day')} ${part('month')} ${part('year')}`,
  /** e.g. "Thursday, 17 September 2026" */
  fullDate: `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`,
  /** e.g. "17 · 09 · 2026" */
  numericDate: weddingConfig.event.date.split('-').reverse().join(' · '),
  /** e.g. "6:00 pm" */
  startTime: timeFormatter.format(eventStart).toUpperCase(),
  endTime: timeFormatter.format(eventEnd).toUpperCase(),
  timeRange: `${timeFormatter.format(eventStart).toUpperCase()} – ${timeFormatter
    .format(eventEnd)
    .toUpperCase()}`,
};
