import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { Mankolam, PaperTear, SilkBorder } from '../ornaments/Ornaments';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: ReactNode;
  children: ReactNode;
  /** Adds the warm cream wash used to separate neighbouring sections. */
  tinted?: boolean;
  /** Tears the top and bottom edges, as though the card stock were torn. */
  torn?: boolean;
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
  torn = false,
  className,
  headingLevel = 2,
}: SectionProps) {
  const { ref, isVisible } = useReveal<HTMLElement>();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  // One seed per section id, so every tear on the page is a different tear.
  const seed = (id ?? 'section').length * 7 + (id?.charCodeAt(0) ?? 3);

  return (
    <section
      id={id}
      ref={ref}
      className={[
        'section',
        tinted ? 'section--tint' : '',
        torn ? 'section--torn' : '',
        'reveal',
        isVisible ? 'is-visible' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={title && id ? `${id}-title` : undefined}
    >
      {torn && <PaperTear className="section__tear section__tear--top" seed={seed} />}
      {/* A torn edge and a woven band on the same line fight each other. */}
      {tinted && !torn && <SilkBorder className="section__edge section__edge--top" />}

      <div className="shell">
        {(eyebrow || title) && (
          <header className="section__head">
            {eyebrow && <p className="section__eyebrow">{eyebrow}</p>}
            {title && (
              <Heading className="section__title" id={id ? `${id}-title` : undefined}>
                {title}
              </Heading>
            )}
            <span className="section__flourish" aria-hidden="true">
              <Mankolam className="section__mango section__mango--left" />
              <span className="section__flourish-rule" />
              <Mankolam className="section__mango section__mango--right" />
            </span>
            {lead && <p className="section__lead">{lead}</p>}
          </header>
        )}
        {children}
      </div>

      {tinted && !torn && <SilkBorder className="section__edge section__edge--bottom" flip />}
      {torn && <PaperTear className="section__tear section__tear--bottom" seed={seed + 5} flip />}
    </section>
  );
}
