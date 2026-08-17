import { useEffect, useRef, useState } from 'react';
import { MusicPlayer } from './MusicPlayer';

const LINKS = [
  { id: 'story', label: 'Our Story' },
  { id: 'date', label: 'The Date' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'venue', label: 'Venue' },
  { id: 'notes', label: 'Dress & Gifts' },
  { id: 'blessings', label: 'Blessings' },
  { id: 'rsvp', label: 'RSVP' },
];

/**
 * Navigation, kept out of the way.
 *
 * A hairline progress rule at the top edge, and a small pair of controls at
 * the bottom corner — no navbar competing with the invitation. The menu
 * closes on Escape, on outside click, and after a jump, returning focus to
 * the trigger each time.
 */
export function FloatingNav() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0);
    };
    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    LINKS.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (clickEvent: MouseEvent) => {
      if (!rootRef.current?.contains(clickEvent.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

  return (
    <>
      <div className="scroll-rule" aria-hidden="true">
        <span className="scroll-rule__fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="floating-nav" ref={rootRef}>
        <nav
          className={`floating-nav__panel ${open ? 'is-open' : ''}`}
          aria-label="Invitation sections"
          hidden={!open}
        >
          <ul>
            {LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={active === link.id ? 'is-active' : ''}
                  aria-current={active === link.id ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="floating-nav__controls">
          <MusicPlayer />
          <button
            ref={triggerRef}
            type="button"
            className={`floating-nav__trigger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
