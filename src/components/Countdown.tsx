import { eventEnd, eventStart, formattedEvent, weddingConfig } from '../config/weddingConfig';
import { useCountdown } from '../hooks/useCountdown';
import { Section } from './ui/Section';
import { Emblem } from './ornaments/Ornaments';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Counts down to 6:00 PM IST on the day, wherever the guest happens to be.
 * At zero it hands over to a celebration message rather than showing negative
 * numbers, and afterwards it becomes a quiet keepsake line.
 */
export function Countdown() {
  const { days, hours, minutes, seconds, phase } = useCountdown(eventStart, eventEnd);
  const { couple } = weddingConfig;

  if (phase !== 'before') {
    return (
      <Section id="countdown" eyebrow="The day" tinted>
        <div className="countdown countdown--done">
          <Emblem className="countdown__emblem" />
          <p className="countdown__headline">
            {phase === 'during' ? (
              <>
                The Celebration Has Begun <span aria-hidden="true">♡</span>
              </>
            ) : (
              'Our New Chapter Has Begun.'
            )}
          </p>
          <p className="countdown__sub">
            {phase === 'during'
              ? `Come find us at ${weddingConfig.venue.name}.`
              : `Thank you for being part of our beginning. — ${couple.bride} & ${couple.groom}`}
          </p>
        </div>
      </Section>
    );
  }

  const units = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];

  return (
    <Section
      id="countdown"
      eyebrow="Counting the days"
      title="Until We Celebrate Together"
      tinted
    >
      <div className="countdown">
        <p className="visually-hidden" aria-live="off">
          {days} days, {hours} hours, {minutes} minutes and {seconds} seconds until the
          reception on {formattedEvent.fullDate} at {formattedEvent.startTime} India time.
        </p>

        <ol className="countdown__grid" aria-hidden="true">
          {units.map((unit) => (
            <li className="countdown__unit" key={unit.label}>
              <span className="countdown__value">{pad(unit.value)}</span>
              <span className="countdown__label">{unit.label}</span>
            </li>
          ))}
        </ol>

        <p className="countdown__foot">
          {formattedEvent.fullDate} <span aria-hidden="true">·</span> {formattedEvent.startTime}{' '}
          IST
        </p>
      </div>
    </Section>
  );
}
