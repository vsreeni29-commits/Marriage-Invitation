import { useState } from 'react';
import { downloadIcs, googleCalendarUrl } from '../utils/calendar';

/**
 * Downloads a standards-compliant .ics, with a Google Calendar link beside it
 * for phones that refuse file downloads. Failure is reported to the guest
 * rather than swallowed.
 */
export function AddToCalendar({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`calendar ${className ?? ''}`}>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setFailed(downloadIcs() === 'failed')}
      >
        Add to Calendar
      </button>

      <a className="calendar__alt" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">
        Google Calendar <span aria-hidden="true">↗</span>
      </a>

      <p className="form-status" role="status">
        {failed ? 'The download didn’t start — the Google Calendar link works too.' : ''}
      </p>
    </div>
  );
}
