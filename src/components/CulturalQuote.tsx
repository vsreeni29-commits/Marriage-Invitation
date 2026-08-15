import { useReveal } from '../hooks/useReveal';
import { Divider } from './ornaments/Ornaments';

/**
 * A breath between the practical sections and the personal ones.
 */
export function CulturalQuote() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <aside
      className={`quote reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
      aria-label="A note from the couple"
    >
      <div className="shell shell--narrow">
        <Divider />
        <blockquote className="quote__text">
          <p>
            We were raised on different prayers, different festivals and very different ideas
            about how much coconut belongs in food.
          </p>
          <p>
            What we share is simpler — the people who raised us, and the way they taught us to
            welcome someone in.
          </p>
        </blockquote>
        <p className="quote__attribution">
          <span className="script-ta" lang="ta">
            அன்புடன்
          </span>
          <span aria-hidden="true">·</span>
          <span className="script-ml" lang="ml">
            സ്നേഹത്തോടെ
          </span>
          <span aria-hidden="true">·</span>
          <span>With love</span>
        </p>
        <Divider />
      </div>
    </aside>
  );
}
