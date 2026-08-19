/**
 * Persistence contracts.
 *
 * The UI talks to these interfaces and nothing else. Swapping the local
 * demo store for Supabase, Firebase, a REST endpoint or a serverless
 * function means writing one new adapter — no component changes.
 */

export interface Blessing {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export type BlessingDraft = Omit<Blessing, 'id' | 'createdAt'> & {
  /** Hidden field. If a real guest ever fills this in, they are a robot. */
  honeypot?: string;
};

/**
 * What a read of the guest book returned.
 *
 * `degraded` is the important half: it means the shared book could not be
 * reached and these are only what this device happens to remember. Without it
 * a broken backend looks exactly like an empty garden, which is precisely how
 * you end up with guests unable to see each other's blessings and nobody able
 * to tell why.
 */
export interface BlessingList {
  blessings: Blessing[];
  degraded: boolean;
}

export interface BlessingService {
  list(): Promise<BlessingList>;
  add(draft: BlessingDraft): Promise<Blessing>;
}

export interface Rsvp {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  note?: string;
  createdAt: string;
  /** Held on this device because the guest book couldn't be reached yet. */
  pending?: boolean;
}

export type RsvpDraft = Omit<Rsvp, 'id' | 'createdAt'> & {
  /** Hidden field. If a real guest ever fills this in, they are a robot. */
  honeypot?: string;
};

export interface RsvpService {
  submit(draft: RsvpDraft): Promise<Rsvp>;
  /** Returns the response already sent from this device, if any. */
  mine(): Promise<Rsvp | null>;
}

export class ServiceError extends Error {
  /**
   * True when the request never got an answer — offline, blocked, timed out,
   * or the endpoint returned an error status. Worth trying again later.
   * False when the backend answered and refused: retrying changes nothing.
   */
  readonly transport: boolean;

  constructor(message: string, transport = false) {
    super(message);
    this.name = 'ServiceError';
    this.transport = transport;
  }
}
