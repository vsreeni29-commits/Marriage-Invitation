import type { CSSProperties } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { Section } from './ui/Section';
import { Jasmine } from './ornaments/Ornaments';

/**
 * The evening, hour by hour.
 *
 * A single thread runs down the middle with the hours hung off it. As the guest
 * scrolls, a jasmine bud travels down that thread and lights each hour as it
 * passes — so the running order is read the way the evening is lived, in order.
 */
export function EventTimeline() {
  const reducedMotion = useReducedMotion();
  const { schedule } = weddingConfig;
  // Finish the walk while the list is still on screen, not as it leaves.
  const { ref, progress } = useScrollProgress<HTMLOListElement>(!reducedMotion, {
    from: 0.92,
    to: 0.3,
  });

  // The bud leads the highlight slightly, so an hour lights as the bud reaches it.
  const lit = Math.round(progress * schedule.length + 0.18);

  return (
    <Section
      id="schedule"
      eyebrow="How the evening runs"
      title="Schedule of Events"
      lead="Nothing here is compulsory except the food."
      torn
    >
      <ol
        className={`timeline ${reducedMotion ? 'timeline--still' : ''}`}
        ref={ref}
        style={{ '--travel': progress } as CSSProperties}
      >
        <span className="timeline__thread" aria-hidden="true" />
        {!reducedMotion && (
          <span className="timeline__bud" aria-hidden="true">
            <Jasmine size={34} />
          </span>
        )}

        {schedule.map((item, index) => (
          <li
            className={`timeline__item ${index < lit ? 'is-lit' : ''}`}
            key={`${item.time}-${item.title}`}
          >
            <p className="timeline__time">{item.time}</p>
            <span className="timeline__node" aria-hidden="true" />
            <div className="timeline__body">
              <h3 className="timeline__title">{item.title}</h3>
              {item.detail && <p className="timeline__detail">{item.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
