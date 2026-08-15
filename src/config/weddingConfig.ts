/**
 * Single source of truth for every piece of event information on the site.
 *
 * Nothing in `src/components` should hardcode a name, date, time or address —
 * everything reads from here so the invitation can be updated in one place.
 */

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
    /** Approximate coordinates, used only for the decorative map card. */
    coordinates: { lat: number; lng: number };
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
