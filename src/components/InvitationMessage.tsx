import { media } from '../config/media';
import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { Section } from './ui/Section';
import { Divider, Jasmine } from './ornaments/Ornaments';

/**
 * The invitation itself — the words a guest would have found inside a folded
 * card, set with the same restraint.
 */
export function InvitationMessage() {
  const { couple } = weddingConfig;
  const portrait = media.couple;

  return (
    <Section id="invitation" eyebrow="You are invited" title="With grateful hearts">
      <div className="invitation">
        <div className="invitation__card card card--arch">
          <Jasmine className="invitation__bloom" size={30} />

          <p className="invitation__body">
            With grateful hearts, and the blessings of the people who shaped our lives, we
            invite you to celebrate the beginning of our journey together.
          </p>

          <p className="invitation__body">
            One journey began in {couple.brideOrigin}. Another in {couple.groomOrigin}. On{' '}
            {formattedEvent.day} {formattedEvent.month}, they become one.
          </p>

          <Divider />

          <p className="invitation__families">
            Together with our families
            <span className="invitation__names">
              {couple.bride} &amp; {couple.groom}
            </span>
          </p>
        </div>

        {portrait && (
          <figure className="invitation__portrait">
            <img
              src={portrait.src}
              alt={portrait.alt}
              style={{ objectPosition: portrait.position }}
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}
      </div>
    </Section>
  );
}
