import { useEffect, useRef, useState } from 'react';

/**
 * Progress of an element through the viewport, 0 → 1.
 *
 * 0 when the element's top edge reaches the bottom of the viewport, 1 once its
 * bottom edge has passed the top. Used to drive the cultural morph without any
 * scroll-jacking: the guest stays in full control of the page.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(enabled = true) {
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
      const span = rect.height + viewport;
      if (span <= 0) return;
      const raw = Math.min(1, Math.max(0, (viewport - rect.top) / span));
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
  }, [enabled]);

  return { ref, progress };
}
