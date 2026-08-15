import { createLocalBlessingService, createLocalRsvpService } from './localStore';
import type { BlessingService, RsvpService } from './types';

/**
 * The single place where the invitation chooses its backend.
 *
 * Today both services keep data in the guest's browser. To go live with a real
 * store, write an adapter that satisfies `BlessingService` / `RsvpService` and
 * swap the two lines below — for example:
 *
 *   export const blessingService = createSupabaseBlessingService(supabase);
 *   export const rsvpService = createRestRsvpService('/api/rsvp');
 *
 * Keep credentials out of the client: use a serverless function or a
 * publishable, row-level-secured key.
 */

export const blessingService: BlessingService = createLocalBlessingService();
export const rsvpService: RsvpService = createLocalRsvpService();

export * from './types';
