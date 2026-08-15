import { useEffect, useRef } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { dotRing, loopRingPath, polygonPath, starPath } from '../utils/geometry';
import { Emblem } from './ornaments/Ornaments';

interface InvitationEntryProps {
  onEnter: (withMusic: boolean) => void;
}

/**
 * The opening.
 *
 * A kolam line begins drawing from one side, a geometric star from the other.
 * They travel toward each other, meet, and resolve into a single emblem —
 * the whole idea of the wedding, told in about three seconds, before a single
 * word is read.
 *
 * It is short by design, and the entry buttons appear early: nobody should
 * have to wait through an animation to reach an invitation.
 */
export function InvitationEntry({ onEnter }: InvitationEntryProps) {
  const reducedMotion = useReducedMotion();
  const musicButton = useRef<HTMLButtonElement>(null);
  const { couple } = weddingConfig;

  useEffect(() => {
    // Focus the primary action so keyboard and screen-reader guests start here.
    const id = window.setTimeout(() => musicButton.current?.focus(), reducedMotion ? 60 : 900);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  useEffect(() => {
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previous;
    };
  }, []);

  return (
    <div
      className={`entry ${reducedMotion ? 'entry--still' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-names"
      aria-describedby="entry-tagline"
    >
      <div className="entry__inner">
        <div className="entry__stage" aria-hidden="true">
          <svg viewBox="0 0 320 200" fill="none" focusable="false">
            {/* Tamil Nadu: an unbroken kolam line, drawn around its dots. */}
            <g className="entry__motif entry__motif--kolam">
              <path
                d={loopRingPath(100, 100, 46, 8, 0.46)}
                pathLength={1}
                stroke="#b26644"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <path
                d={loopRingPath(100, 100, 24, 6, 0.55)}
                pathLength={1}
                stroke="#b26644"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {dotRing(100, 100, 60, 8, 22.5).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#b26644" fillOpacity="0.6" />
              ))}
            </g>

            {/* Kerala, Muslim heritage: an eight-point geometric star. */}
            <g className="entry__motif entry__motif--geometry">
              <path
                d={starPath(220, 100, 58, 32, 8, 0)}
                pathLength={1}
                stroke="#35594a"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d={polygonPath(220, 100, 40, 8, 22.5)}
                pathLength={1}
                stroke="#35594a"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path
                d={polygonPath(220, 100, 26, 4, 0)}
                pathLength={1}
                stroke="#35594a"
                strokeWidth="0.9"
                strokeLinejoin="round"
              />
            </g>
          </svg>

          <div className="entry__emblem">
            <Emblem className="entry__emblem-mark" />
          </div>
        </div>

        <p className="entry__initials">{couple.initials}</p>
        <h1 className="entry__names" id="entry-names">
          {couple.bride} <span className="entry__amp">&amp;</span> {couple.groom}
        </h1>
        <p className="entry__tagline" id="entry-tagline">
          Two traditions. Two cultures.
          <br />
          One beautiful beginning.
        </p>

        <div className="entry__actions">
          <button
            ref={musicButton}
            type="button"
            className="btn btn--gold"
            onClick={() => onEnter(true)}
          >
            Enter With Music <span aria-hidden="true">♪</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onEnter(false)}>
            Enter Quietly
          </button>
        </div>

        <p className="entry__hint">Music is optional, and can be turned off at any time.</p>
      </div>
    </div>
  );
}
