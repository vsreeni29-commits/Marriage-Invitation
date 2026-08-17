import { useEffect, useRef, useState } from 'react';

export interface ScrollProgressOptions {
  /**
   * Where the travel begins, as a fraction of the viewport height measured to
   * the element's centre. `1` is the bottom edge of the screen. Omit to start
   * the moment the element's top edge appears.
   */
  from?: number;
  /**
   * Where the travel finishes, in the same units. `0.4` finishes while the
   * element still sits comfortably on screen. Omit to finish only once the
   * element's bottom edge has passed the top of the screen.
   */
  to?: number;
}

/**
 * Progress of an element through the viewport, 0 → 1.
 *
 * By default: 0 when the element's top edge reaches the bottom of the viewport,
 * 1 once its bottom edge has passed the top. Pass `from`/`to` to finish the
 * travel earlier — a motif that has to *be seen* completing needs to reach 1
 * while it is still on screen, not as it leaves.
 *
 * Used to drive the cultural morph without any scroll-jacking: the guest stays
 * in full control of the page.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  enabled = true,
  { from, to }: ScrollProgressOptions = {},
) {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProgress(1);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      frame.current = null;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      if (viewport <= 0) return;
      const centre = rect.top + rect.height / 2;
      const start = from === undefined ? viewport + rect.height / 2 : viewport * from;
      const end = to === undefined ? -rect.height / 2 : viewport * to;
      const span = start - end;
      if (span <= 0) return;
      const raw = Math.min(1, Math.max(0, (start - centre) / span));
      // Ignore sub-pixel changes so scrolling doesn't re-render on every frame.
      setProgress((current) => (Math.abs(current - raw) < 0.004 ? current : raw));
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [enabled, from, to]);

  return { ref, progress };
}
