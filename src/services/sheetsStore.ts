import { backend } from '../config/backend';
import type {
  Blessing,
  BlessingDraft,
  BlessingService,
  Rsvp,
  RsvpDraft,
  RsvpService,
} from './types';
import { ServiceError } from './types';

/**
 * Google Sheets adapter.
 *
 * Posts to an Apps Script Web App, which appends a row to the spreadsheet.
 * The sheet *is* the database — no vendor SDK in the bundle, nothing to keep
 * alive, and the couple can open it on a phone or download it as .xlsx.
 *
 * Two deliberate details:
 *
 *  - Requests are sent as `text/plain`, which keeps them "simple" by CORS
 *    rules and so avoids a preflight that Apps Script cannot answer.
 *  - A local copy of everything sent from this device is kept, so a guest
 *    still sees their own blessing appear even if the read-back is slow, and
 *    their RSVP is remembered on return.
 */

const LOCAL_MIRROR = 'rs:sheet-mirror:v1';
const LOCAL_RSVP = 'rs:rsvp:v1';

interface SheetResponse {
  ok: boolean;
  error?: string;
  blessings?: Blessing[];
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing, or storage full — not worth failing a submission over.
  }
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function call(payload: Record<string, unknown>): Promise<SheetResponse> {
  const endpoint = backend.sheetsEndpoint;
  if (!endpoint) throw new ServiceError('No endpoint configured.');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), backend.timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      // text/plain keeps this a "simple request" — no CORS preflight.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, secret: backend.sharedSecret }),
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ServiceError('We couldn’t reach the guest book just now.');
    }

    const data = (await response.json()) as SheetResponse;
    if (!data.ok) {
      throw new ServiceError(data.error ?? 'That didn’t save. Please try again.');
    }
    return data;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ServiceError('That took too long. Please check your connection and try again.');
    }
    throw new ServiceError('We couldn’t send that just now. Please try again in a moment.');
  } finally {
    window.clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */

export function createSheetsBlessingService(): BlessingService {
  return {
    async list() {
      const mine = readLocal<Blessing[]>(LOCAL_MIRROR, []);
      const endpoint = backend.sheetsEndpoint;
      if (!endpoint) return mine;

      try {
        const url = `${endpoint}?secret=${encodeURIComponent(backend.sharedSecret)}`;
        const response = await fetch(url, { redirect: 'follow' });
        const data = (await response.json()) as SheetResponse;
        if (!data.ok || !data.blessings) return mine;

        // Anything of ours the sheet hasn't returned yet still gets shown.
        const seen = new Set(data.blessings.map((item) => item.message));
        return [...data.blessings, ...mine.filter((item) => !seen.has(item.message))];
      } catch {
        // Offline or blocked — show what this device knows rather than nothing.
        return mine;
      }
    },

    async add(draft: BlessingDraft) {
      const message = draft.message.trim();
      if (!message) throw new ServiceError('Please write a message before sending.');

      await call({
        type: 'blessing',
        name: draft.name.trim(),
        message,
        website: draft.honeypot ?? '',
      });

      const blessing: Blessing = {
        id: newId(),
        name: draft.name.trim() || 'A well-wisher',
        message,
        createdAt: new Date().toISOString(),
      };
      writeLocal(LOCAL_MIRROR, [...readLocal<Blessing[]>(LOCAL_MIRROR, []), blessing]);
      return blessing;
    },
  };
}

export function createSheetsRsvpService(): RsvpService {
  return {
    async submit(draft: RsvpDraft) {
      const name = draft.name.trim();
      if (!name) throw new ServiceError('Please tell us your name.');

      const guests = draft.attending ? Math.min(20, Math.max(1, Math.round(draft.guests))) : 0;

      await call({
        type: 'rsvp',
        name,
        attending: draft.attending,
        guests,
        note: draft.note?.trim() ?? '',
        website: draft.honeypot ?? '',
      });

      const rsvp: Rsvp = {
        id: newId(),
        name,
        attending: draft.attending,
        guests,
        note: draft.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      writeLocal(LOCAL_RSVP, rsvp);
      return rsvp;
    },

    async mine() {
      return readLocal<Rsvp | null>(LOCAL_RSVP, null);
    },
  };
}
