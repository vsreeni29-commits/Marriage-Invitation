import { weddingConfig } from '../config/weddingConfig';
import { song } from '../config/media';
import { useReveal } from '../hooks/useReveal';
import { CardCorners, Mankolam } from './ornaments/Ornaments';

/**
 * Our Song.
 *
 * The track plays from the rights holder's own page rather than from this
 * site — which is why there is a link here and not an audio file. Guests get
 * the song the couple actually mean, and the invitation stays clean.
 *
 * Renders nothing at all if no song is configured.
 */
export function OurSong() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  if (!song) return null;

  return (
    <section
      className={`our-song reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
      aria-labelledby="our-song-title"
    >
      <div className="shell shell--narrow">
        <div className="our-song__card card">
          <CardCorners />

          <p className="section__eyebrow">Our song</p>
          <h2 className="our-song__title" id="our-song-title">
            {song.title}
          </h2>
          <p className="our-song__meta">
            {song.artist}
            {song.film ? (
              <>
                {' '}
                <span aria-hidden="true">·</span> {song.film}
              </>
            ) : null}
          </p>

          <span className="our-song__flourish" aria-hidden="true">
            <Mankolam className="section__mango section__mango--left" />
            <span className="section__flourish-rule" />
            <Mankolam className="section__mango section__mango--right" />
          </span>

          {song.note && <p className="our-song__note">{song.note}</p>}

          <a className="btn btn--ghost" href={song.url} target="_blank" rel="noopener noreferrer">
            Listen <span aria-hidden="true">↗</span>
          </a>

          <p className="our-song__credit">
            Opens on {song.platform}. {weddingConfig.couple.bride} picked it.
          </p>
        </div>
      </div>
    </section>
  );
}
