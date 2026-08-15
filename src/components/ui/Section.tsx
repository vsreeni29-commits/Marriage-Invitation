import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: ReactNode;
  children: ReactNode;
  /** Adds the warm cream wash used to separate neighbouring sections. */
  tinted?: boolean;
  className?: string;
  /** Heading level, so the document outline stays correct. */
  headingLevel?: 2 | 3;
}

/**
 * Shared section shell: consistent rhythm, an ornamented eyebrow, and a single
 * fade-up on first view. Sections without a title still get the reveal.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tinted = false,
  className,
  headingLevel = 2,
}: SectionProps) {
  const { ref, isVisible } = useReveal<HTMLElement>();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section
      id={id}
      ref={ref}
      className={[
        'section',
        tinted ? 'section--tint' : '',
        'reveal',
        isVisible ? 'is-visible' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={title && id ? `${id}-title` : undefined}
    >
      <div className="shell">
        {(eyebrow || title) && (
          <header className="section__head">
            {eyebrow && <p className="section__eyebrow">{eyebrow}</p>}
            {title && (
              <Heading className="section__title" id={id ? `${id}-title` : undefined}>
                {title}
              </Heading>
            )}
            {lead && <p className="section__lead">{lead}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
