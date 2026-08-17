import { weddingConfig } from '../config/weddingConfig';
import { Section } from './ui/Section';
import { CardCorners, Jasmine, PalmFrond } from './ornaments/Ornaments';

/**
 * The two things guests always text to ask: what do I wear, and what do I
 * bring. Answered here so nobody has to ask.
 */
export function GuestNotes() {
  const { dressCode, gifts } = weddingConfig;

  return (
    <Section id="notes" eyebrow="Two small things" title="Before You Come" torn tinted>
      <div className="notes">
        <article className="notes__card card card--arch">
          <CardCorners />
          <PalmFrond className="notes__frond" />
          <h3 className="notes__title">Dress code</h3>
          <p className="notes__body">{dressCode.note}</p>

          <ul className="notes__palette">
            {dressCode.palette.map((swatch) => (
              <li className="notes__swatch" key={swatch.hex}>
                <span
                  className="notes__chip"
                  style={{ background: swatch.hex }}
                  aria-hidden="true"
                />
                <span className="notes__swatch-name">{swatch.name}</span>
              </li>
            ))}
          </ul>

          {dressCode.avoid && <p className="notes__aside">{dressCode.avoid}</p>}
        </article>

        <article className="notes__card card card--arch">
          <CardCorners />
          <Jasmine className="notes__bloom" size={30} />
          <h3 className="notes__title">{gifts.title}</h3>
          <p className="notes__body">{gifts.note}</p>
        </article>
      </div>
    </Section>
  );
}
