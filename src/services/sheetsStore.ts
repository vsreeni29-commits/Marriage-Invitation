import { backend } from '../config/backend';
import type {
  Blessing,
  BlessingDraft,
  BlessingList,
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
const LOCAL_OUTBOX = 'rs:outbox:v1';

/** Enough to hold a large family's worth of answers if the endpoint is down. */
const OUTBOX_LIMIT = 50;

interface SheetResponse {
  ok: boolean;
  error?: string;
  /** The spam trap was tripped, so the row was thrown away rather than saved. */
  ignored?: boolean;
  /** The endpoint was unreachable; this is held on the device for later. */
  queued?: boolean;
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

function toIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function post(payload: Record<string, unknown>): Promise<SheetResponse> {
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
      throw new ServiceError('We couldn’t reach the guest book just now.', true);
    }

    const data = (await response.json()) as SheetResponse;
    if (!data.ok) {
      // The endpoint answered and refused. Retrying will refuse again.
      throw new ServiceError(data.error ?? 'That didn’t save. Please try again.');
    }
    return data;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ServiceError('That took too long. Please check your connection.', true);
    }
    // Offline, blocked, CORS, DNS — nothing was answered, so this can be retried.
    throw new ServiceError('We couldn’t send that just now. Please try again in a moment.', true);
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Sends a row to the sheet, and refuses to fail silently.
 *
 * The Apps Script drops anything that trips the spam trap and answers `ok`, so
 * a bot learns nothing. That is the right answer for a bot and the worst
 * possible answer for a guest: the page says "thank you", the row never lands,
 * and nobody finds out until the day. A browser that fills the hidden field on
 * a guest's behalf — password managers and mobile autofill both do — used to
 * end exactly there.
 *
 * So a discarded submission is sent once more with the trap explicitly empty.
 * Our own page is the only thing that ever retries; a direct POST with the
 * field set is still dropped and still told nothing. If the second attempt is
 * discarded too, the guest is told plainly instead of thanked.
 */
async function send(payload: Record<string, unknown>): Promise<SheetResponse> {
  const first = await post(payload);
  if (!first.ignored) return first;

  const second = await post({ ...payload, website: '' });
  if (second.ignored) {
    throw new ServiceError('That didn’t save. Please try again.');
  }
  return second;
}

/* ------------------------------------------------------------------ *
 * The outbox
 * ------------------------------------------------------------------ */

/**
 * Nothing a guest writes is thrown away because a server was having a bad day.
 *
 * If the endpoint cannot be reached — offline on the train, a deployment being
 * re-authorised, a Google hiccup — the submission is kept on the device and
 * sent again the next time the site is opened. The alternative is an error
 * message and a guest who does not come back to try again, which for an
 * invitation means an answer that is simply never counted.
 *
 * A refusal is different from a failure: if the endpoint answers and says no,
 * the queue would only ask it forever, so that error is passed straight to the
 * guest instead.
 */
function enqueue(payload: Record<string, unknown>): void {
  const queue = readLocal<Record<string, unknown>[]>(LOCAL_OUTBOX, []);
  if (queue.length >= OUTBOX_LIMIT) return;
  writeLocal(LOCAL_OUTBOX, [...queue, payload]);
}

let flushing = false;

export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  const queue = readLocal<Record<string, unknown>[]>(LOCAL_OUTBOX, []);
  if (queue.length === 0) return;

  flushing = true;
  const stuck: Record<string, unknown>[] = [];

  try {
    for (let index = 0; index < queue.length; index += 1) {
      try {
        await send(queue[index]);
      } catch (error) {
        if (error instanceof ServiceError && error.transport) {
          // Still unreachable. The rest would only wait out the same timeout,
          // so keep them all and try again on the next visit.
          stuck.push(...queue.slice(index));
          break;
        }
        // Refused outright. Asking again tomorrow will not help.
      }
    }
  } finally {
    writeLocal(LOCAL_OUTBOX, stuck);
    flushing = false;
  }
}

async function call(payload: Record<string, unknown>): Promise<SheetResponse> {
  try {
    return await send(payload);
  } catch (error) {
    if (error instanceof ServiceError && error.transport) {
      enqueue(payload);
      return { ok: true, queued: true };
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */

/**
 * Reads the guest book with a <script> tag instead of fetch.
 *
 * An Apps Script Web App answers a GET with a 302 to script.googleusercontent.com,
 * and whether the CORS header survives that hop depends on the browser and on how
 * the deployment was configured. When it does not, `fetch` fails and every guest
 * sees only their own blessing — the shared garden quietly becomes a private one.
 *
 * A script tag is not subject to CORS at all, so this works wherever the endpoint
 * is reachable. The payload is public data (the blessings are shown on the page),
 * so nothing sensitive rides on it.
 */
function jsonp(url: string, timeoutMs: number): Promise<SheetResponse> {
  return new Promise((resolve, reject) => {
    const name = `rsBlessings${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');

    const cleanUp = () => {
      window.clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[name];
      script.remove();
    };

    const timer = window.setTimeout(() => {
      cleanUp();
      reject(new Error('jsonp timeout'));
    }, timeoutMs);

    (window as unknown as Record<string, unknown>)[name] = (data: SheetResponse) => {
      cleanUp();
      resolve(data);
    };

    script.src = `${url}&callback=${name}`;
    script.onerror = () => {
      cleanUp();
      reject(new Error('jsonp failed'));
    };
    document.head.appendChild(script);
  });
}

export function createSheetsBlessingService(): BlessingService {
  return {
    async list(): Promise<BlessingList> {
      const mine = readLocal<Blessing[]>(LOCAL_MIRROR, []);
      const endpoint = backend.sheetsEndpoint;
      if (!endpoint) return { blessings: mine, degraded: true };

      // Anything this device is still holding gets another go first, in the
      // background — a guest who wrote a blessing while the endpoint was down
      // delivers it simply by coming back.
      void flushOutbox();

      const url = `${endpoint}?secret=${encodeURIComponent(backend.sharedSecret)}`;

      // Two ways in. Fetch is cleaner; JSONP is the one that survives the
      // redirect Apps Script answers a GET with.
      let data: SheetResponse | null = null;
      try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) throw new Error(`status ${response.status}`);
        data = (await response.json()) as SheetResponse;
      } catch {
        try {
          // Shorter than a write's patience: nobody should watch an empty
          // garden for twelve seconds before being told it couldn't be read.
          data = await jsonp(url, 7000);
        } catch {
          data = null;
        }
      }

      if (!data?.ok || !data.blessings) {
        // Show what this device knows, but say so rather than pretending.
        return { blessings: mine, degraded: true };
      }

      // A spreadsheet cell comes back as whatever Sheets decided it was —
      // "2026-08-18 19:04:11" if it stayed text, "Tue Aug 18 2026 …" once it
      // was read as a date. Sorting is a string compare, so both are pinned to
      // ISO here rather than trusting the shape of the cell.
      const shared = data.blessings.map((item) => ({ ...item, createdAt: toIso(item.createdAt) }));

      // Anything of ours the sheet hasn't returned yet still gets shown.
      const seen = new Set(shared.map((item) => item.message));
      return {
        blessings: [...shared, ...mine.filter((item) => !seen.has(item.message))],
        degraded: false,
      };
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

      const response = await call({
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
        pending: response.queued === true,
      };
      writeLocal(LOCAL_RSVP, rsvp);
      return rsvp;
    },

    async mine() {
      // Coming back to the page is what delivers anything still waiting.
      void flushOutbox();
      const saved = readLocal<Rsvp | null>(LOCAL_RSVP, null);
      if (saved?.pending && readLocal<unknown[]>(LOCAL_OUTBOX, []).length === 0) {
        // The queue drained on an earlier visit; the answer is on its way.
        const settled = { ...saved, pending: false };
        writeLocal(LOCAL_RSVP, settled);
        return settled;
      }
      return saved;
    },
  };
}
