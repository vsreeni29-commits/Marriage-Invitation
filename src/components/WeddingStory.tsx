import type { CSSProperties } from 'react';
import { media } from '../config/media';
import { weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { Section } from './ui/Section';
import { GeometricMotif, Jasmine, KolamMotif, PalmFrond } from './ornaments/Ornaments';

/**
 * Two Roots. One Story.
 *
 * Rinsha's side and Sreeni's side begin as two separate cards. As the guest
 * scrolls, an ornamental thread grows between them and joins them — the
 * section is about connection, so nothing here is framed as a comparison.
 */
export function WeddingStory() {
  const reducedMotion = useReducedMotion();
  const { ref, progress } = useScrollProgress<HTMLDivElement>(!reducedMotion);
  const { couple } = weddingConfig;

  // The thread grows through the middle of the section's travel.
  const growth = Math.min(1, Math.max(0, (progress - 0.24) / 0.42));
  const joined = growth > 0.82;

  return (
    <Section
      id="story"
      eyebrow="Where it began"
      title="Two Roots. One Story."
      lead="Two coastlines, two languages, two kitchens that season things differently — and one home being built between them."
      tinted
    >
      <div
        className={`story ${joined ? 'is-joined' : ''}`}
        ref={ref}
        style={{ '--growth': growth } as CSSProperties}
      >
        <article className="story__root story__root--bride">
          <div className="story__ornament" aria-hidden="true">
            <GeometricMotif className="story__motif story__motif--geometry" />
            <PalmFrond className="story__frond" />
          </div>

          {media.story.bride && (
            <img
              className="story__photo"
              src={media.story.bride.src}
              alt={media.story.bride.alt}
              loading="lazy"
              decoding="async"
            />
          )}

          <h3 className="story__name">{couple.bride}</h3>
          <p className="story__origin">
            {couple.brideOrigin}
            <span className="story__origin-script script-ml" lang="ml">
              കേരളം
            </span>
          </p>
          <p className="story__text">
            Kasavu borders and coconut palms, the quiet of a Malabar evening, and a family
            whose faith taught her generosity before anything else.
          </p>
        </article>

        <div className="story__link" aria-hidden="true">
          <svg className="story__thread story__thread--h" viewBox="0 0 400 80" fill="none" focusable="false">
            <path
              className="story__thread-path"
              d="M0 40 C 70 6 130 74 200 40 C 270 6 330 74 400 40"
              pathLength={1}
              stroke="#a9854b"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              className="story__thread-path story__thread-path--offset"
              d="M0 40 C 70 74 130 6 200 40 C 270 74 330 6 400 40"
              pathLength={1}
              stroke="#6d8b74"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>

          <svg className="story__thread story__thread--v" viewBox="0 0 80 320" fill="none" focusable="false">
            <path
              className="story__thread-path"
              d="M40 0 C 6 60 74 110 40 160 C 6 210 74 260 40 320"
              pathLength={1}
              stroke="#a9854b"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              className="story__thread-path story__thread-path--offset"
              d="M40 0 C 74 60 6 110 40 160 C 74 210 6 260 40 320"
              pathLength={1}
              stroke="#6d8b74"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>

          <span className="story__knot">
            <Jasmine size={28} />
          </span>
        </div>

        <article className="story__root story__root--groom">
          <div className="story__ornament" aria-hidden="true">
            <KolamMotif className="story__motif story__motif--kolam" />
            <Jasmine className="story__sprig" size={34} />
          </div>

          {media.story.groom && (
            <img
              className="story__photo"
              src={media.story.groom.src}
              alt={media.story.groom.alt}
              loading="lazy"
              decoding="async"
            />
          )}

          <h3 className="story__name">{couple.groom}</h3>
          <p className="story__origin">
            {couple.groomOrigin}
            <span className="story__origin-script script-ta" lang="ta">
              தமிழ்நாடு
            </span>
          </p>
          <p className="story__text">
            Kolam drawn at the doorstep before sunrise, jasmine bought by the arm's length,
            and a family whose faith taught him to keep the door open.
          </p>
        </article>
      </div>

      <p className="story__union">
        <span className="story__union-names">
          {couple.bride} <span className="story__heart" aria-hidden="true">♡</span>{' '}
          <span className="visually-hidden">and</span> {couple.groom}
        </span>
        <span className="story__union-line">Two roots. One story.</span>
      </p>
    </Section>
  );
}
