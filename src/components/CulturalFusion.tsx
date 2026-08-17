import type { CSSProperties } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { clamp, dotRing, loopRingPath, petalRosettePath, polygonPath, starPath } from '../utils/geometry';
import { Emblem } from './ornaments/Ornaments';

/** Maps scroll progress onto a 0–1 window, with soft ends. */
const stage = (p: number, from: number, to: number) => clamp((p - from) / (to - from), 0, 1);

const CAPTIONS = [
  {
    title: 'A line is drawn',
    body: 'A kolam begins the morning at a Tamil doorstep — one unbroken line, looping around its dots.',
  },
  {
    title: 'A pattern answers',
    body: 'A geometric star, the ornament of Kerala’s Muslim craftsmen, folds itself around the same centre.',
  },
  {
    title: 'Something grows',
    body: 'Jasmine finds the gaps between them, the way it grows through every gate in the south.',
  },
  {
    title: 'One motif',
    body: 'The three become a single mark — not one tradition beside another, but a pattern that only exists because both are here.',
  },
];

/**
 * The signature morph.
 *
 * Scroll-linked rather than scroll-jacked: the guest scrolls normally and the
 * motif transforms as the section passes. The resulting emblem is used
 * throughout the rest of the invitation as Rinsha and Sreeni's own mark.
 */
export function CulturalFusion() {
  const reducedMotion = useReducedMotion();
  // The morph is measured against the art itself, and finishes while the art is
  // still high on screen rather than as it leaves — on a phone the old window
  // put the final emblem above the fold, so the motif never appeared to finish.
  // One comfortable swipe now carries it from first line to finished mark.
  const { ref, progress } = useScrollProgress<HTMLDivElement>(!reducedMotion, {
    from: 1,
    to: 0.42,
  });

  const p = reducedMotion ? 1 : progress;

  const kolamDraw = stage(p, 0.03, 0.26);
  const geometryDraw = stage(p, 0.22, 0.48);
  // Each layer has its say and then gets out of the way. They used to bottom
  // out around a third visible, so the emblem landed on top of three other
  // motifs and the "one motif" beat read as four overlapping ones.
  const kolamFade = 1 - stage(p, 0.36, 0.8) * 0.94;
  const geometryFade = stage(p, 0.22, 0.36) - stage(p, 0.45, 0.82) * 0.92;
  const bloom = stage(p, 0.44, 0.7) * (1 - stage(p, 0.62, 0.84) * 0.9);
  const unify = stage(p, 0.6, 0.86);
  const rotation = (1 - unify) * -14;

  const activeCaption = Math.min(
    CAPTIONS.length - 1,
    Math.floor(clamp(p - 0.05, 0, 0.999) * CAPTIONS.length),
  );

  return (
    <section
      className={`fusion ${reducedMotion ? 'fusion--still' : ''}`}
      id="fusion"
      aria-labelledby="fusion-title"
    >
      <div className="shell">
        <p className="section__eyebrow">Two visual languages</p>
        <h2 className="section__title" id="fusion-title">
          Where the Patterns Meet
        </h2>

        <div className="fusion__stage">
          {/* The box itself never transforms — the layers inside it rotate — so
              measuring it against the viewport stays stable as the morph runs. */}
          <div
            className="fusion__art"
            ref={ref}
            aria-hidden="true"
            style={
              {
                '--unify': unify,
                '--rotation': `${rotation}deg`,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 320 320" fill="none" focusable="false">
              <defs>
                <radialGradient id="fusion-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c9a96a" stopOpacity="0.55" />
                  <stop offset="70%" stopColor="#c9a96a" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#c9a96a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Brass-lamp glow, arriving as the motifs resolve */}
              <circle cx="160" cy="160" r="130" fill="url(#fusion-glow)" opacity={unify * 0.9} />

              {/* Layer 1 — kolam */}
              <g
                opacity={kolamFade}
                style={{ transform: `rotate(${(1 - unify) * 12}deg)`, transformOrigin: '160px 160px' }}
              >
                <path
                  d={loopRingPath(160, 160, 88, 12, 1.5)}
                  pathLength={1}
                  stroke="#b26644"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - kolamDraw}
                />
                <path
                  d={loopRingPath(160, 160, 52, 8, 1.7)}
                  pathLength={1}
                  stroke="#b26644"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - kolamDraw}
                />
                {dotRing(160, 160, 118, 12, 15).map((dot, i) => (
                  <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r="1.8"
                    fill="#b26644"
                    fillOpacity={0.55 * kolamDraw}
                  />
                ))}
              </g>

              {/* Layer 2 — geometry */}
              <g
                opacity={Math.max(0, geometryFade)}
                style={{ transform: `rotate(${(1 - unify) * -10}deg)`, transformOrigin: '160px 160px' }}
              >
                <path
                  d={starPath(160, 160, 122, 80, 8, 0)}
                  pathLength={1}
                  stroke="#35594a"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - geometryDraw}
                />
                <path
                  d={polygonPath(160, 160, 88, 8, 22.5)}
                  pathLength={1}
                  stroke="#35594a"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - geometryDraw}
                />
                <path
                  d={polygonPath(160, 160, 62, 4, 0)}
                  pathLength={1}
                  stroke="#35594a"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - geometryDraw}
                />
                <path
                  d={polygonPath(160, 160, 62, 4, 45)}
                  pathLength={1}
                  stroke="#35594a"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - geometryDraw}
                />
              </g>

              {/* Layer 3 — the bloom between them */}
              <g
                opacity={bloom}
                style={{
                  transform: `scale(${0.72 + bloom * 0.28})`,
                  transformOrigin: '160px 160px',
                }}
              >
                <path
                  d={petalRosettePath(160, 160, 74, 8, 22.5, 18)}
                  fill="#c3a570"
                  fillOpacity={0.18 * bloom}
                  stroke="#6d8b74"
                  strokeOpacity="0.6"
                  strokeWidth="0.9"
                />
              </g>
            </svg>

            {/* Layer 4 — the emblem the three resolve into */}
            <Emblem className="fusion__emblem" />
          </div>

          <div className="fusion__captions">
            {CAPTIONS.map((caption, index) => (
              <div
                key={caption.title}
                className={`fusion__caption ${index === activeCaption ? 'is-active' : ''}`}
              >
                <h3 className="fusion__caption-title">{caption.title}</h3>
                <p className="fusion__caption-body">{caption.body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="fusion__note">
          Neither pattern gives anything up. They simply make room, and the shape that appears
          belongs to both.
        </p>
      </div>
    </section>
  );
}
