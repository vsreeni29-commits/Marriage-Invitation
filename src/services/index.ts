import { backend } from '../config/backend';
import { createLocalBlessingService, createLocalRsvpService } from './localStore';
import { createSheetsBlessingService, createSheetsRsvpService } from './sheetsStore';
import type { BlessingService, RsvpService } from './types';

/**
 * The single place where the invitation chooses its backend.
 *
 * With a Google Sheet endpoint configured in `src/config/backend.ts`, RSVPs
 * and blessings append rows to the spreadsheet. Without one, everything stays
 * in the guest's own browser so the site still works — locally, in a preview,
 * or if the sheet is taken down after the wedding.
 *
 * Any other backend is one more adapter satisfying the same interfaces:
 *
 *   export const rsvpService = createRestRsvpService('/api/rsvp');
 */

const useSheet = Boolean(backend.sheetsEndpoint);

export const blessingService: BlessingService = useSheet
  ? createSheetsBlessingService()
  : createLocalBlessingService();

export const rsvpService: RsvpService = useSheet
  ? createSheetsRsvpService()
  : createLocalRsvpService();

export * from './types';
