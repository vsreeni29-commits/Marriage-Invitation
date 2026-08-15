import { useCallback, useEffect, useRef, useState } from 'react';
import { formattedEvent, weddingConfig } from '../config/weddingConfig';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Section } from './ui/Section';
import { Jasmine } from './ornaments/Ornaments';

/** Reveal completes automatically once this much of the foil is gone. */
const COMPLETE_AT = 0.55;
const BRUSH = 26;

/**
 * Scratch to reveal the date.
 *
 * The date lives in the DOM underneath the canvas, not inside it — so it is
 * readable by screen readers, selectable, and present even if the canvas
 * never initialises. Scratching is a delight, never a gate: the "Reveal date"
 * button does the same job in one tap.
 */
export function DateScratchReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const moveCount = useRef(0);
  const reducedMotion = useReducedMotion();

  const [revealed, setRevealed] = useState(false);
  const [foilGone, setFoilGone] = useState(false);
  const [supported, setSupported] = useState(true);
  const [started, setStarted] = useState(false);

  // Let the foil fade out before it leaves the DOM.
  useEffect(() => {
    if (!revealed) return;
    const id = window.setTimeout(() => setFoilGone(true), reducedMotion ? 0 : 700);
    return () => window.clearTimeout(id);
  }, [revealed, reducedMotion]);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (!canvas || !surface) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setSupported(false);
      return;
    }

    const { width, height } = surface.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);

    // Kasavu-gold foil
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e0cba4');
    gradient.addColorStop(0.4, '#c9a96a');
    gradient.addColorStop(0.62, '#dfc79c');
    gradient.addColorStop(1, '#b8944f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Fine woven thread, the way a kasavu border catches light
    ctx.strokeStyle = 'rgba(255, 251, 240, 0.32)';
    ctx.lineWidth = 1;
    for (let x = -height; x < width; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }

    // Kolam dots
    ctx.fillStyle = 'rgba(109, 43, 51, 0.18)';
    for (let y = 16; y < height; y += 26) {
      for (let x = 16; x < width; x += 26) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255, 252, 245, 0.55)';
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(9, 9, width - 18, height - 18);
    ctx.setLineDash([]);

    ctx.globalCompositeOperation = 'destination-out';
  }, []);

  useEffect(() => {
    paintFoil();
    let frame = 0;
    const onResize = () => {
      if (revealed) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(paintFoil);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
    };
  }, [paintFoil, revealed]);

  const clearedFraction = useCallback((): number => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return 0;
    try {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0;
      let total = 0;
      // Sample every 16th pixel — plenty accurate, and cheap enough for a phone.
      for (let i = 3; i < data.length; i += 4 * 16) {
        total += 1;
        if (data[i] < 120) clear += 1;
      }
      return total === 0 ? 0 : clear / total;
    } catch {
      return 0;
    }
  }, []);

  const scratchAt = useCallback((x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const previous = lastPoint.current;
    ctx.beginPath();
    if (previous) {
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    lastPoint.current = { x, y };
  }, []);

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    drawing.current = true;
    setStarted(true);
    lastPoint.current = null;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const { x, y } = pointerPosition(event);
    scratchAt(x, y);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || revealed) return;
    event.preventDefault();
    const { x, y } = pointerPosition(event);
    scratchAt(x, y);

    moveCount.current += 1;
    if (moveCount.current % 8 === 0 && clearedFraction() >= COMPLETE_AT) {
      setRevealed(true);
    }
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (clearedFraction() >= COMPLETE_AT) setRevealed(true);
  };

  const { event } = weddingConfig;

  return (
    <Section
      id="date"
      eyebrow="Save the day"
      title="A Date Worth Remembering"
      lead={supported && !revealed ? 'Scratch the gold to reveal our day.' : undefined}
    >
      <div className={`scratch ${revealed ? 'is-revealed' : ''}`}>
        <div className="scratch__surface card" ref={surfaceRef}>
          <div className="scratch__content">
            <Jasmine className="scratch__bloom" size={26} />
            <p className="scratch__weekday">{formattedEvent.weekday}</p>
            <p className="scratch__date">
              <time dateTime={event.date}>
                <span className="scratch__day">{formattedEvent.day}</span>
                <span className="scratch__month">{formattedEvent.month}</span>
                <span className="scratch__year">{formattedEvent.year}</span>
              </time>
            </p>
            <p className="scratch__time">{formattedEvent.startTime} onwards</p>
          </div>

          {supported && !foilGone && (
            <>
              <canvas
                ref={canvasRef}
                className="scratch__canvas"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                onPointerLeave={endStroke}
                aria-hidden="true"
              />
              {!started && !revealed && (
                <p className="scratch__prompt" aria-hidden="true">
                  <span>Scratch to reveal our day</span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="scratch__actions">
          {!revealed && supported ? (
            <button type="button" className="btn btn--ghost" onClick={() => setRevealed(true)}>
              Reveal Date
            </button>
          ) : (
            <p className="scratch__confirmed" role="status">
              {reducedMotion ? '' : '✦ '}
              Marked. We’ll be counting down with you.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
