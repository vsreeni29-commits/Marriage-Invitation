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
 * Demo persistence: everything stays in this browser.
 *
 * Good enough to share the invitation today, and structurally identical to a
 * real backend adapter — same async signatures, same error type — so
 * `createSupabaseBlessingService()` (or Firebase, or `fetch`) can replace it
 * without the components noticing.
 */

const BLESSINGS_KEY = 'rs:blessings:v1';
const RSVP_KEY = 'rs:rsvp:v1';

/** localStorage is unavailable in private modes and sandboxed frames. */
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — the session still works, it just won't persist.
  }
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** A touch of latency so loading states are real rather than theoretical. */
const settle = <T>(value: T, ms = 420): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(value), ms));

export function createLocalBlessingService(): BlessingService {
  return {
    async list() {
      const stored = safeRead<Blessing[]>(BLESSINGS_KEY, []);
      // Nothing is shared in this mode, so every read is a degraded one.
      return settle({ blessings: stored, degraded: true }, 260);
    },
    async add(draft: BlessingDraft) {
      const message = draft.message.trim();
      if (!message) throw new ServiceError('Please write a message before sending.');

      const blessing: Blessing = {
        id: newId(),
        name: draft.name.trim() || 'A well-wisher',
        message,
        createdAt: new Date().toISOString(),
      };
      const stored = safeRead<Blessing[]>(BLESSINGS_KEY, []);
      safeWrite(BLESSINGS_KEY, [...stored, blessing]);
      return settle(blessing);
    },
  };
}

export function createLocalRsvpService(): RsvpService {
  return {
    async submit(draft: RsvpDraft) {
      const name = draft.name.trim();
      if (!name) throw new ServiceError('Please tell us your name.');

      const rsvp: Rsvp = {
        id: newId(),
        name,
        attending: draft.attending,
        guests: draft.attending ? Math.min(20, Math.max(1, Math.round(draft.guests))) : 0,
        note: draft.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      safeWrite(RSVP_KEY, rsvp);
      return settle(rsvp, 620);
    },
    async mine() {
      return safeRead<Rsvp | null>(RSVP_KEY, null);
    },
  };
}
