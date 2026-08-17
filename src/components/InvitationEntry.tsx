import { useCallback, useEffect, useRef, useState } from 'react';
import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { useMusic } from '../context/MusicContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Emblem, JaaliBackdrop, WaxSeal } from './ornaments/Ornaments';

interface InvitationEntryProps {
  onEnter: () => void;
}

/** How long the envelope takes to open before the invitation takes over. */
const OPEN_MS = 1750;

/**
 * The opening.
 *
 * A sealed envelope, addressed and pressed with wax. Break the seal and the
 * flap falls open, light spills out of the pocket, and the card rises out of it
 * into the invitation itself.
 *
 * The music choice lives here because starting music at somebody uninvited is
 * rude. It also starts *inside* the tap handler rather than when the animation
 * ends: mobile Safari only unlocks audio during a real gesture, and a second of
 * envelope animation is long enough for that window to close — which is exactly
 * how you end up with a silent invitation on an iPhone.
 *
 * Either way it is one tap: the guest never has to sit through the animation,
 * and a guest who asks for reduced motion skips it entirely.
 */
export function InvitationEntry({ onEnter }: InvitationEntryProps) {
  const reducedMotion = useReducedMotion();
  const { setPlaying } = useMusic();
  const openButton = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const [opening, setOpening] = useState(false);
  const { couple, event } = weddingConfig;

  const open = useCallback(
    (withMusic: boolean) => {
      if (opening) return;
      // Synchronously, while the browser still counts this as the user's tap.
      if (withMusic) setPlaying(true);
      if (reducedMotion) {
        onEnter();
        return;
      }
      setOpening(true);
      timer.current = window.setTimeout(onEnter, OPEN_MS);
    },
    [onEnter, opening, reducedMotion, setPlaying],
  );

  useEffect(() => {
    // Focus the primary action so keyboard and screen-reader guests start here.
    const id = window.setTimeout(() => openButton.current?.focus(), reducedMotion ? 60 : 700);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

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
      className={`entry ${reducedMotion ? 'entry--still' : ''} ${opening ? 'is-opening' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-names"
      aria-describedby="entry-tagline"
    >
      <div className="entry__light" aria-hidden="true" />

      <div className="entry__inner">
        <div className="envelope">
          {/* The card inside, which rises out of the pocket as the flap falls. */}
          <div className="envelope__card">
            <span className="envelope__card-edge" aria-hidden="true" />
            <p className="entry__initials">{couple.initials}</p>
            <h1 className="entry__names script-name foil" id="entry-names">
              {couple.bride} <span className="amp">&amp;</span> {couple.groom}
            </h1>
            <Emblem className="entry__emblem" />
            <p className="entry__date">
              <time dateTime={event.date}>{formattedEvent.numericDate}</time>
            </p>
          </div>

          {/* The pocket: front panel and the two side folds. */}
          <div className="envelope__pocket" aria-hidden="true">
            <span className="envelope__fold envelope__fold--left" />
            <span className="envelope__fold envelope__fold--right" />
            <span className="envelope__front" />
            {/* Paper texture, painted over the folds rather than under them. */}
            <JaaliBackdrop className="envelope__weave" />
          </div>

          {/* The flap, and the wax holding it shut. */}
          <div className="envelope__flap" aria-hidden="true">
            <span className="envelope__flap-face" />
          </div>
          <span className="envelope__seal" aria-hidden="true">
            <WaxSeal label={couple.initials} />
          </span>
        </div>

        <p className="entry__tagline" id="entry-tagline">
          Two traditions. Two cultures.
          <br />
          One beautiful beginning.
        </p>

        <div className="entry__actions">
          <button
            ref={openButton}
            type="button"
            className="btn btn--gold entry__open"
            onClick={() => open(true)}
            disabled={opening}
          >
            Tap to Open <span aria-hidden="true">♪</span>
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => open(false)}
            disabled={opening}
          >
            Open Quietly
          </button>
        </div>

        <p className="entry__hint">Music is optional, and can be turned off at any time.</p>
      </div>
    </div>
  );
}
