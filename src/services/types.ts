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

export interface BlessingService {
  list(): Promise<Blessing[]>;
  add(draft: BlessingDraft): Promise<Blessing>;
}

export interface Rsvp {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  note?: string;
  createdAt: string;
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
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}
