import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { Section } from './ui/Section';
import { AddToCalendar } from './AddToCalendar';
import { Divider, Jasmine } from './ornaments/Ornaments';

/**
 * What is actually happening, in plain words: one evening, dinner, and the
 * people who matter in one room.
 */
export function ReceptionDetails() {
  const { event, venue } = weddingConfig;

  return (
    <Section id="reception" eyebrow="The evening" title="Wedding Reception">
      <div className="reception">
        <div className="reception__card card card--arch">
          <Jasmine className="reception__bloom" size={28} />

          <dl className="reception__list">
            <div className="reception__row">
              <dt>Date</dt>
              <dd>
                <time dateTime={event.date}>{formattedEvent.fullDate}</time>
              </dd>
            </div>
            <div className="reception__row">
              <dt>Time</dt>
              <dd>
                <time dateTime={`${event.date}T${event.startTime}+05:30`}>
                  {formattedEvent.timeRange}
                </time>
              </dd>
            </div>
            <div className="reception__row">
              <dt>Venue</dt>
              <dd>
                {venue.name}
                <span className="reception__address">{venue.address}</span>
              </dd>
            </div>
          </dl>

          <Divider />

          <p className="reception__note">
            Dinner, long conversations, too many photographs, and the start of something —
            we’d love you there for all of it.
          </p>

          <AddToCalendar className="reception__calendar" />
        </div>
      </div>
    </Section>
  );
}
