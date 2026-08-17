import { media } from '../config/media';
import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ArchOutline, Emblem, PalmFrond, PetalField } from './ornaments/Ornaments';

/**
 * The hero.
 *
 * An arch — the shape shared by a Kerala mosque doorway and a Tamil temple
 * gopuram entrance — frames the couple's names. Jasmine drifts, very slowly,
 * and stops entirely for guests who prefer reduced motion.
 */
export function Hero() {
  const reducedMotion = useReducedMotion();
  const { couple, event } = weddingConfig;
  const photo = media.hero;

  return (
    <header className="hero" id="top">
      <div className="hero__backdrop" aria-hidden="true">
        <PalmFrond className="hero__frond hero__frond--left" />
        <PalmFrond className="hero__frond hero__frond--right" />
        {!reducedMotion && <PetalField count={12} />}
      </div>

      {photo && (
        <div className="hero__photo" aria-hidden={photo.alt ? undefined : true}>
          <img
            src={photo.src}
            alt={photo.alt}
            style={{ objectPosition: photo.position }}
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      <div className="hero__frame">
        <ArchOutline className="hero__arch" />
        <div className="hero__content">
          <p className="hero__eyebrow">
            {couple.brideOrigin} <span aria-hidden="true">·</span> {couple.groomOrigin}
          </p>

          <h1 className="hero__names script-name">
            <span className="hero__name foil">{couple.bride}</span>
            <span className="hero__amp" aria-hidden="true">
              &amp;
            </span>
            <span className="visually-hidden">and</span>
            <span className="hero__name foil">{couple.groom}</span>
          </h1>

          <Emblem className="hero__emblem" />

          <p className="hero__line">
            Kerala meets Tamil Nadu — and somewhere between the two, we found home.
          </p>

          <p className="hero__date">
            <time dateTime={event.date}>{formattedEvent.numericDate}</time>
          </p>

          <a className="btn btn--gold hero__cta" href="#invitation">
            Celebrate With Us
          </a>
        </div>
      </div>

      <a className="hero__scroll" href="#invitation" aria-label="Scroll to the invitation">
        <span className="hero__scroll-line" aria-hidden="true" />
        <span className="hero__scroll-text">Scroll</span>
      </a>
    </header>
  );
}
