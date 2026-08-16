import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useReveal } from '../hooks/useReveal';
import { Emblem, PetalField } from './ornaments/Ornaments';
import { ShareInvitation } from './ShareInvitation';

/** The last page of the folded card. */
export function ClosingMessage() {
  const reducedMotion = useReducedMotion();
  const { ref, isVisible } = useReveal<HTMLElement>();
  const { couple, event, venue } = weddingConfig;

  return (
    <section
      className={`closing reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
      aria-labelledby="closing-title"
    >
      {!reducedMotion && <PetalField count={8} className="closing__petals" />}

      <div className="shell shell--narrow">
        <Emblem className="closing__emblem" />

        <h2 className="closing__title" id="closing-title">
          From {couple.brideOrigin} to {couple.groomOrigin}, from two traditions to one journey —
          thank you for being part of ours.
        </h2>

        <p className="closing__names script-name foil">
          {couple.bride} <span className="amp" aria-hidden="true">&amp;</span>
          <span className="visually-hidden">and</span> {couple.groom}
        </p>

        <p className="closing__date">
          <time dateTime={event.date}>{formattedEvent.numericDate}</time>
        </p>

        <p className="multilingual closing__love">
          <span className="script-ta" lang="ta">
            அன்புடன்
          </span>
          <span className="script-ml" lang="ml">
            സ്നേഹത്തോടെ
          </span>
          <span>With Love</span>
        </p>

        <p className="closing__signoff">
          See you in {venue.city} <span aria-hidden="true">♡</span>
        </p>

        <ShareInvitation className="closing__share" label="Share Invitation" variant="ghost" />
      </div>
    </section>
  );
}
