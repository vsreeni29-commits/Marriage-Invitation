import { useState } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Section } from './ui/Section';

/**
 * Where We Celebrate.
 *
 * The map card is drawn rather than embedded — an embedded map would load a
 * third-party frame and its cookies onto every guest's phone for a picture
 * they will tap away from anyway. The tap target goes straight to Google Maps,
 * which is what a guest standing on Velachery Main Road actually needs.
 */
export function Venue() {
  const reducedMotion = useReducedMotion();
  const { venue } = weddingConfig;
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');

  const copyAddress = async () => {
    const text = `${venue.name}, ${venue.address}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    window.setTimeout(() => setCopied('idle'), 4000);
  };

  return (
    <Section id="venue" eyebrow="Getting there" title="Where We Celebrate" tinted>
      <div className="venue">
        <div className="venue__map card" aria-hidden="true">
          <svg viewBox="0 0 400 260" fill="none" focusable="false" role="presentation">
            <rect width="400" height="260" rx="12" fill="#f3ead9" />

            {/* Blocks */}
            <g fill="#e7d8c1" fillOpacity="0.85">
              <rect x="24" y="26" width="96" height="62" rx="5" />
              <rect x="150" y="18" width="84" height="48" rx="5" />
              <rect x="286" y="34" width="92" height="70" rx="5" />
              <rect x="30" y="150" width="80" height="80" rx="5" />
              <rect x="300" y="160" width="76" height="70" rx="5" />
            </g>

            {/* Greens */}
            <g fill="#6d8b74" fillOpacity="0.28">
              <circle cx="146" cy="196" r="30" />
              <circle cx="184" cy="214" r="18" />
              <circle cx="352" cy="132" r="16" />
            </g>

            {/* Velachery Main Road and its side streets */}
            <path d="M0 122 C 90 118 150 132 400 116" stroke="#dcc4a2" strokeWidth="16" strokeLinecap="round" />
            <path d="M0 122 C 90 118 150 132 400 116" stroke="#fdf8ef" strokeWidth="3" strokeDasharray="10 12" />
            <path d="M134 0 L 128 260" stroke="#e7d8c1" strokeWidth="9" strokeLinecap="round" />
            <path d="M272 0 L 282 260" stroke="#e7d8c1" strokeWidth="7" strokeLinecap="round" />

            {/* Route to the door */}
            <path
              className={`venue__route ${reducedMotion ? 'is-still' : ''}`}
              d="M16 214 C 90 210 104 128 168 124 C 214 121 226 108 246 104"
              stroke="#a9854b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="7 9"
              fill="none"
            />

            {/* The pin */}
            <g transform="translate(246 104)">
              <circle className={`venue__pulse ${reducedMotion ? 'is-still' : ''}`} r="24" fill="#6d2b33" fillOpacity="0.16" />
              <path
                d="M0 -34 C 11 -34 20 -25 20 -14 C 20 -1 6 12 0 20 C -6 12 -20 -1 -20 -14 C -20 -25 -11 -34 0 -34 Z"
                fill="#6d2b33"
              />
              <circle cy="-15" r="6.5" fill="#f6eee1" />
            </g>
          </svg>

          <p className="venue__map-label">
            <span>Velachery Main Road</span>
            <span>Gowriwakkam, Chennai</span>
          </p>
        </div>

        <div className="venue__details">
          <h3 className="venue__name">{venue.name}</h3>
          <address className="venue__address">{venue.address}</address>

          <p className="venue__hint">
            Parking is on site, and the hall is a short walk from the main road. Come early if
            you’d like to find us before the room fills.
          </p>

          <div className="venue__actions">
            <a
              className="btn btn--gold venue__cta"
              href={venue.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="btn btn--quiet" onClick={copyAddress}>
              Copy address
            </button>
          </div>

          <p className="form-status" role="status">
            {copied === 'done' && 'Address copied.'}
            {copied === 'failed' && 'Couldn’t copy — the address is written above.'}
          </p>
        </div>
      </div>
    </Section>
  );
}
