import { memo } from 'react';
import {
  archPath,
  dotRing,
  loopRingPath,
  petalRosettePath,
  polygonPath,
  seeded,
  starPath,
  tornEdgePath,
  waxEdgePath,
} from '../../utils/geometry';

/**
 * The invitation's ornamental vocabulary.
 *
 * Three languages live here — kolam line-work (Tamil Nadu), geometric star
 * ornament (Muslim heritage) and botanical jasmine/palm (Kerala) — plus the
 * Emblem, where all three resolve into one motif that belongs to nobody but
 * Rinsha and Sreeni.
 *
 * Everything is decorative: each root SVG is `aria-hidden`.
 */

interface OrnamentProps {
  className?: string;
  /** Stroke width multiplier for fine-tuning at large sizes. */
  weight?: number;
}

/* ------------------------------------------------------------------ *
 * The signature emblem — kolam + geometry + bloom, woven together.
 * ------------------------------------------------------------------ */

export const Emblem = memo(function Emblem({ className, weight = 1 }: OrnamentProps) {
  const c = 100;
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="emblem-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9a96a" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#c9a96a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#c9a96a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emblem-petal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c3a570" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#35594a" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <circle cx={c} cy={c} r="58" fill="url(#emblem-glow)" />

      {/*
         Four bands, each with air around it, reading inward: the kasavu thread,
         the kolam line looping around its dots, the eight-point star, and the
         bloom at the centre. Every radius here is chosen so that no two bands
         touch — the previous version stacked all four in the same annulus and
         the motifs simply collided.
      */}

      {/* Kasavu thread — the outermost hairline */}
      <circle cx={c} cy={c} r="90" stroke="#a9854b" strokeOpacity="0.3" strokeWidth={0.7 * weight} />

      {/* Kolam: one unbroken line, curling around eight dots */}
      <path
        d={loopRingPath(c, c, 60, 8, 1.7)}
        stroke="#a9854b"
        strokeOpacity="0.9"
        strokeWidth={1.15 * weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dotRing(c, c, 60, 8, 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.9} fill="#a9854b" fillOpacity="0.85" />
      ))}

      {/* Eight-point star: two offset squares, well inside the kolam */}
      <path d={polygonPath(c, c, 52, 4, 0)} stroke="#35594a" strokeOpacity="0.85" strokeWidth={1.15 * weight} strokeLinejoin="round" />
      <path d={polygonPath(c, c, 52, 4, 45)} stroke="#35594a" strokeOpacity="0.85" strokeWidth={1.15 * weight} strokeLinejoin="round" />

      {/* Bloom — smallest, so the eye lands here last and stays */}
      <path
        d={petalRosettePath(c, c, 26, 8, 22.5, 22)}
        fill="url(#emblem-petal)"
        stroke="#6d8b74"
        strokeOpacity="0.7"
        strokeWidth={0.8 * weight}
      />
      <circle cx={c} cy={c} r="4.2" fill="#a9854b" />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Kolam line-work — Tamil Nadu.
 * ------------------------------------------------------------------ */

export const KolamMotif = memo(function KolamMotif({ className, weight = 1 }: OrnamentProps) {
  const c = 100;
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      {dotRing(c, c, 78, 12, 15).map((p, i) => (
        <circle key={`o${i}`} cx={p.x} cy={p.y} r={1.6} fill="currentColor" fillOpacity="0.55" />
      ))}
      {dotRing(c, c, 40, 8, 22.5).map((p, i) => (
        <circle key={`i${i}`} cx={p.x} cy={p.y} r={1.4} fill="currentColor" fillOpacity="0.45" />
      ))}
      <path d={loopRingPath(c, c, 58, 12, 1.5)} stroke="currentColor" strokeWidth={1.1 * weight} strokeLinecap="round" strokeLinejoin="round" />
      <path d={loopRingPath(c, c, 26, 6, 1.55)} stroke="currentColor" strokeWidth={1 * weight} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={c} cy={c} r="6" stroke="currentColor" strokeWidth={1 * weight} />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Geometric star ornament — Muslim heritage.
 * ------------------------------------------------------------------ */

export const GeometricMotif = memo(function GeometricMotif({ className, weight = 1 }: OrnamentProps) {
  const c = 100;
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      <path d={starPath(c, c, 82, 46, 8, 0)} stroke="currentColor" strokeWidth={1.1 * weight} strokeLinejoin="round" />
      <path d={polygonPath(c, c, 62, 8, 22.5)} stroke="currentColor" strokeWidth={0.95 * weight} strokeLinejoin="round" />
      <path d={polygonPath(c, c, 46, 4, 0)} stroke="currentColor" strokeWidth={0.9 * weight} strokeLinejoin="round" />
      <path d={polygonPath(c, c, 46, 4, 45)} stroke="currentColor" strokeWidth={0.9 * weight} strokeLinejoin="round" />
      <path d={starPath(c, c, 26, 12, 8, 22.5)} stroke="currentColor" strokeWidth={0.85 * weight} strokeLinejoin="round" />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Jasmine — Tamil malligai, and every Kerala doorway in August.
 * ------------------------------------------------------------------ */

interface JasmineProps extends OrnamentProps {
  size?: number;
}

export const Jasmine = memo(function Jasmine({ className, size = 24 }: JasmineProps) {
  // Six rounded petals on a short stem of their own — jasmine, not a starburst.
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="11.5"
          rx="5.1"
          ry="8.2"
          fill="currentColor"
          fillOpacity="0.78"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.1" fill="#c3a570" />
      <circle cx="20" cy="20" r="1.3" fill="#8f6f38" fillOpacity="0.7" />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Garden flowers — one per blessing, growing on a stem.
 *
 * Drawn standing on the bottom edge of the viewBox so they plant on the
 * bed's ground line however they are scaled. Three kinds, so a full
 * garden reads as planted rather than stamped.
 * ------------------------------------------------------------------ */

interface GardenFlowerProps {
  className?: string;
  /** 0 jasmine · 1 open bloom · 2 bud — anything else wraps round. */
  kind?: number;
  /** Mirrors the stem so neighbours don't all lean the same way. */
  flip?: boolean;
}

export const GardenFlower = memo(function GardenFlower({
  className,
  kind = 0,
  flip = false,
}: GardenFlowerProps) {
  const type = ((kind % 3) + 3) % 3;
  const petals = type === 1 ? 5 : 6;
  const headY = 26;

  return (
    <svg
      className={`flower flower--${type} ${className ?? ''}`}
      viewBox="0 0 44 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* Stem, drawn from the soil up to the head. */}
      <path
        className="flower__stem"
        d={`M 22 100 C ${flip ? 15 : 29} 78 ${flip ? 27 : 17} 54 22 ${headY + 6}`}
        stroke="#6d8b74"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        className="flower__leaf"
        d={`M 22 72 C 10 68 6 60 8 52 C 16 54 21 62 22 72 Z`}
        fill="#6d8b74"
        fillOpacity="0.55"
      />

      <g className="flower__head" style={{ transformOrigin: `22px ${headY}px` }}>
        {type === 2 ? (
          // A bud: still closed, for the newest and the furthest away.
          <>
            <path
              d={`M 22 ${headY - 9} C 28 ${headY - 6} 28 ${headY + 5} 22 ${headY + 8} C 16 ${headY + 5} 16 ${headY - 6} 22 ${headY - 9} Z`}
              fill="#f6ecd8"
              stroke="#c3a570"
              strokeOpacity="0.7"
              strokeWidth="0.9"
            />
            <path d={`M 22 ${headY + 8} l 0 4`} stroke="#6d8b74" strokeWidth="1.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            {Array.from({ length: petals }, (_, i) => (
              <ellipse
                key={i}
                cx="22"
                cy={headY - 7.5}
                rx={type === 1 ? 5.6 : 4.4}
                ry={type === 1 ? 7.6 : 8.4}
                fill={type === 1 ? '#f7e3d6' : '#fdf7ea'}
                stroke="#c3a570"
                strokeOpacity="0.45"
                strokeWidth="0.6"
                transform={`rotate(${(360 / petals) * i} 22 ${headY})`}
              />
            ))}
            <circle cx="22" cy={headY} r="3.1" fill="#c9a05a" />
            <circle cx="22" cy={headY} r="1.2" fill="#8f6f38" fillOpacity="0.75" />
          </>
        )}
      </g>
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * The garden the invitation opens onto — a still lake, a pair of swans
 * facing each other, and their reflections.
 *
 * Drawn rather than photographed: the reference this was designed from
 * uses licensed imagery, and line-work in our own palette belongs to
 * this invitation in a way a stock photograph never could.
 * ------------------------------------------------------------------ */

/**
 * One swan, facing right, standing on the waterline at y = 96.
 *
 * The neck traces half a heart — up and outward from the breast, over the top
 * of the lobe, then down and inward — so that mirrored about the centre the
 * two necks close the figure and the bills meet.
 */
const SWAN_BODY =
  'M 30 60 C 44 68 42 78 52 86 C 64 94 86 96 102 93 ' +
  'C 116 90 121 82 114 74 C 103 61 74 57 56 61 C 46 63 38 58 30 60 Z';

const SWAN_NECK = 'M 114 74 C 102 56 108 30 122 30 C 133 30 137 39 131 47';

const SWAN_WING =
  'M 56 72 C 70 65 88 65 101 71 C 90 73 82 78 77 85 C 71 78 65 74 56 72 Z';

export const SwanLake = memo(function SwanLake({ className }: OrnamentProps) {
  const swan = (
    <g>
      {/* Body, then the wing folded over it. */}
      <path d={SWAN_BODY} fill="#fffdf7" stroke="#c3a570" strokeOpacity="0.5" strokeWidth="0.9" />
      <path d={SWAN_WING} fill="#f6ecd9" fillOpacity="0.85" stroke="#c3a570" strokeOpacity="0.4" strokeWidth="0.7" />

      {/* Neck: white over a hairline, so it reads as a form and not a stroke. */}
      <path d={SWAN_NECK} fill="none" stroke="#fffdf7" strokeWidth="5.1" strokeLinecap="round" />
      <path d={SWAN_NECK} fill="none" stroke="#c3a570" strokeOpacity="0.42" strokeWidth="0.75" strokeLinecap="round" />

      {/* Bill angled down and in, to meet its partner's at the centre. */}
      <path d="M 132 48.5 L 137.5 54 L 129.5 52.5 Z" fill="#c98a63" />
      <path d="M 133 49.8 L 135 51.8" stroke="#8a5a3c" strokeOpacity="0.45" strokeWidth="0.5" />
      <circle cx="127.5" cy="41.5" r="1" fill="#3f382f" />
    </g>
  );

  return (
    <svg
      className={`swans ${className ?? ''}`}
      viewBox="0 0 460 150"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/*
         A wide, shallow band rather than a square: the water has to run the
         width of the screen while staying a strip along the bottom, or the
         birds grow tall enough to sit on top of the date and the button.
      */}
      <defs>
        <linearGradient id="lake-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6eee6" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#dfe8de" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#e9e4cf" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="lake-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lake-mirror" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id="lake-mirror-mask">
          <rect x="0" y="94" width="460" height="56" fill="url(#lake-mirror)" />
        </mask>
      </defs>

      {/* The water, and the light lying along it. */}
      <ellipse cx="230" cy="112" rx="228" ry="36" fill="url(#lake-water)" />
      <ellipse cx="230" cy="98" rx="150" ry="6" fill="url(#lake-fade)" />

      {/* Reflections first, so the birds sit on top of them. */}
      <g mask="url(#lake-mirror-mask)" opacity="0.45">
        <g transform="translate(90 190) scale(1 -1)">{swan}</g>
        <g transform="translate(370 190) scale(-1 -1)">{swan}</g>
      </g>

      {/* Ripples spreading from where each bird meets the water. */}
      <g stroke="#8fa892" strokeOpacity="0.26" fill="none" strokeLinecap="round">
        <path d="M 118 102 C 148 106 200 106 226 102" strokeWidth="0.8" />
        <path d="M 234 102 C 260 106 312 106 342 102" strokeWidth="0.8" />
        <path d="M 96 112 C 140 117 196 117 232 112" strokeWidth="0.7" strokeOpacity="0.2" />
        <path d="M 228 122 C 268 127 320 126 356 121" strokeWidth="0.7" strokeOpacity="0.15" />
        <path d="M 30 118 H 104" strokeWidth="0.7" strokeOpacity="0.16" />
        <path d="M 352 128 H 430" strokeWidth="0.7" strokeOpacity="0.14" />
      </g>

      {/* The pair, meeting on the centre line. */}
      <g transform="translate(90 0)">{swan}</g>
      <g transform="translate(370 0) scale(-1 1)">{swan}</g>

      {/* Petals resting on the water, because a garden lake is never bare. */}
      <g fill="#f6e3d6" fillOpacity="0.9" stroke="#c3a570" strokeOpacity="0.35" strokeWidth="0.4">
        <ellipse cx="58" cy="110" rx="4" ry="2.2" transform="rotate(-12 58 110)" />
        <ellipse cx="404" cy="116" rx="3.6" ry="2" transform="rotate(14 404 116)" />
        <ellipse cx="262" cy="132" rx="3.2" ry="1.8" transform="rotate(-6 262 132)" />
        <ellipse cx="150" cy="128" rx="3" ry="1.7" transform="rotate(9 150 128)" />
      </g>
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * A bough of leaves and small blooms, for the corners of the arch.
 * ------------------------------------------------------------------ */

export const GardenBough = memo(function GardenBough({ className }: OrnamentProps) {
  const rand = seeded(31);
  const leaves = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const x = 6 + t * 104;
    const y = 96 - t * 78 - Math.sin(t * Math.PI) * 12;
    const side = i % 2 === 0 ? 1 : -1;
    const size = 7 + rand() * 5;
    const tilt = -34 * side + (rand() * 18 - 9);
    return { x, y, side, size, tilt, bloom: i % 4 === 1 };
  });

  return (
    <svg
      className={`bough ${className ?? ''}`}
      viewBox="0 0 120 104"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M 4 100 C 34 92 66 66 84 40 C 96 23 106 12 116 6"
        stroke="#6d8b74"
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {leaves.map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.tilt.toFixed(1)})`}>
          <ellipse
            rx={(leaf.size * 0.42).toFixed(1)}
            ry={leaf.size.toFixed(1)}
            fill="#6d8b74"
            fillOpacity={leaf.bloom ? 0.3 : 0.42}
          />
        </g>
      ))}
      {leaves
        .filter((leaf) => leaf.bloom)
        .map((leaf, i) => (
          <g key={`b${i}`} transform={`translate(${(leaf.x + leaf.side * 7).toFixed(1)} ${(leaf.y - 5).toFixed(1)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cy="-2.6" rx="1.6" ry="2.8" fill="#fdf7ea" stroke="#c3a570" strokeOpacity="0.5" strokeWidth="0.4" transform={`rotate(${a})`} />
            ))}
            <circle r="1.1" fill="#c9a05a" />
          </g>
        ))}
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Palm frond — Kerala.
 * ------------------------------------------------------------------ */

export const PalmFrond = memo(function PalmFrond({ className }: OrnamentProps) {
  // Quadratic midrib, with tapered leaflets swept back along it.
  const P0 = { x: 6, y: 82 };
  const P1 = { x: 52, y: 66 };
  const P2 = { x: 116, y: 12 };

  const at = (t: number) => ({
    x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
    y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
  });
  const tangentAt = (t: number) => {
    const dx = 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
    const dy = 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };

  const leaflet = (t: number, side: 1 | -1) => {
    const base = at(t);
    const tan = tangentAt(t);
    const nrm = { x: -tan.y * side, y: tan.x * side };
    // Longest in the middle of the frond, short at both ends.
    const len = 30 * Math.sin(Math.PI * (0.12 + t * 0.8));
    const sweep = len * 0.42;
    const tip = {
      x: base.x + nrm.x * len + tan.x * sweep,
      y: base.y + nrm.y * len + tan.y * sweep,
    };
    const belly = len * 0.2;
    const c1 = {
      x: base.x + nrm.x * len * 0.42 + tan.x * (sweep * 0.2 + belly),
      y: base.y + nrm.y * len * 0.42 + tan.y * (sweep * 0.2 + belly),
    };
    const c2 = {
      x: base.x + nrm.x * len * 0.6 + tan.x * (sweep * 0.5 - belly),
      y: base.y + nrm.y * len * 0.6 + tan.y * (sweep * 0.5 - belly),
    };
    const f = (n: number) => n.toFixed(1);
    return `M ${f(base.x)} ${f(base.y)} Q ${f(c1.x)} ${f(c1.y)} ${f(tip.x)} ${f(tip.y)} Q ${f(
      c2.x,
    )} ${f(c2.y)} ${f(base.x)} ${f(base.y)} Z`;
  };

  const steps = Array.from({ length: 15 }, (_, i) => 0.04 + (i / 14) * 0.94);

  return (
    <svg className={className} viewBox="0 0 130 100" fill="none" aria-hidden="true" focusable="false">
      {steps.map((t, i) => (
        <g key={i} opacity={0.5 + Math.sin(Math.PI * t) * 0.45}>
          <path d={leaflet(t, 1)} fill="currentColor" />
          <path d={leaflet(t, -1)} fill="currentColor" />
        </g>
      ))}
      <path
        d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Arch — the shared silhouette of Kerala mosque and Tamil temple doorways.
 * ------------------------------------------------------------------ */

export const ArchOutline = memo(function ArchOutline({ className, weight = 1 }: OrnamentProps) {
  return (
    <svg className={className} viewBox="0 0 200 260" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path d={archPath(4, 4, 192, 252, 0.3)} stroke="currentColor" strokeWidth={1.2 * weight} />
      <path d={archPath(13, 13, 174, 243, 0.3)} stroke="currentColor" strokeWidth={0.7 * weight} strokeOpacity="0.6" strokeDasharray="2 6" />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Wax seal — the thing a guest breaks to open the envelope, and the
 * thing they press to answer. Poured maroon wax, a pressed rim, and a
 * kolam ring around whatever is stamped into it.
 * ------------------------------------------------------------------ */

interface WaxSealProps {
  className?: string;
  /** Stamped into the wax — initials on the envelope, a word on a button. */
  label: string;
  /** Small labels get the display face; two or three letters get the script. */
  variant?: 'monogram' | 'word';
}

export const WaxSeal = memo(function WaxSeal({
  className,
  label,
  variant = 'monogram',
}: WaxSealProps) {
  return (
    <svg
      className={`wax ${className ?? ''}`}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="wax-body" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#8c3038" />
          <stop offset="55%" stopColor="#5e1f27" />
          <stop offset="100%" stopColor="#3b1015" />
        </radialGradient>
      </defs>

      {/* The wax itself, poured a little unevenly. */}
      <path d={waxEdgePath(60, 60, 52, 20, 0.03, 9)} fill="url(#wax-body)" />
      {/* Pressed rim: the stamp squeezes the wax up at the edge. */}
      <path
        d={waxEdgePath(60, 60, 45, 20, 0.025, 3)}
        stroke="#330d12"
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <path d={waxEdgePath(60, 60, 41, 18, 0.02, 21)} stroke="#c9a96a" strokeOpacity="0.34" strokeWidth="0.8" />

      {/* A kolam loop ring, pressed into the wax by the stamp. */}
      <path
        d={loopRingPath(60, 60, 30, 8, 1.6)}
        stroke="#e9cf9c"
        strokeOpacity="0.34"
        strokeWidth="0.9"
      />

      <text
        className={`wax__label wax__label--${variant}`}
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f0d9a8"
        fillOpacity="0.92"
      >
        {label}
      </text>
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Torn paper edge — the invitation is card stock, and card stock tears.
 * ------------------------------------------------------------------ */

interface PaperTearProps {
  className?: string;
  /** Point the fibres downward for the bottom edge of a section. */
  flip?: boolean;
  /** Vary the tear so no two edges on the page are identical. */
  seed?: number;
}

export const PaperTear = memo(function PaperTear({ className, flip = false, seed = 11 }: PaperTearProps) {
  return (
    <svg
      className={`tear ${flip ? 'tear--flip' : ''} ${className ?? ''}`}
      viewBox="0 0 1200 26"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={tornEdgePath(1200, 26, 44, seed)} fill="currentColor" />
      {/* The pale crushed fibres along the tear line. */}
      <path
        d={tornEdgePath(1200, 26, 44, seed)}
        fill="none"
        stroke="#c9a96a"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Ornamental divider — kasavu border meeting geometric stars.
 * ------------------------------------------------------------------ */

export const Divider = memo(function Divider({ className }: OrnamentProps) {
  return (
    <div className={`divider ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 320 32" fill="none" focusable="false">
        <path d="M0 16 H108" stroke="#a9854b" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M212 16 H320" stroke="#a9854b" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M92 16 q 12 -9 24 0 q 12 9 24 0" stroke="#6d8b74" strokeOpacity="0.65" strokeWidth="1" fill="none" />
        <path d="M180 16 q 12 -9 24 0 q 12 9 24 0" stroke="#6d8b74" strokeOpacity="0.65" strokeWidth="1" fill="none" />
        <g transform="translate(160 16)">
          <path d={starPath(0, 0, 11, 5.5, 8, 0)} stroke="#a9854b" strokeOpacity="0.85" strokeWidth="1" strokeLinejoin="round" />
          <circle r="2.4" fill="#a9854b" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Silk border — the kasavu/Kanchipuram band, with the two traditions
 * alternating along it.
 *
 * A row of temple triangles (kumbam) is the single most recognisable
 * edge in South Indian textile, from a Kerala kasavu mundu to a
 * Kanchipuram sari. Setting an eight-point star between every pair puts
 * both heritages into one woven band rather than side by side.
 * ------------------------------------------------------------------ */

interface SilkBorderProps {
  className?: string;
  /** Flip for the bottom edge of a section. */
  flip?: boolean;
  tone?: 'gold' | 'light';
}

export const SilkBorder = memo(function SilkBorder({
  className,
  flip = false,
  tone = 'gold',
}: SilkBorderProps) {
  const id = `silk-${tone}`;
  const ink = tone === 'gold' ? '#96742f' : '#ddc79a';
  const accent = tone === 'gold' ? '#5e1f27' : '#c9a96a';

  return (
    <div
      className={`silk-border ${flip ? 'silk-border--flip' : ''} ${className ?? ''}`}
      aria-hidden="true"
    >
      {/*
        No viewBox: the band must tile at its true size across any width,
        not scale up to fill it.
      */}
      <svg width="100%" height="26" fill="none">
        <defs>
          <pattern id={id} width="48" height="26" patternUnits="userSpaceOnUse">
            {/* woven ground threads */}
            <path d="M0 2.5 H48 M0 23.5 H48" stroke={ink} strokeOpacity="0.85" strokeWidth="1" />
            <path d="M0 5.5 H48" stroke={ink} strokeOpacity="0.4" strokeWidth="0.7" strokeDasharray="2 3" />

            {/* temple triangles — kumbam */}
            <path d="M4 8 L12 8 L8 18 Z" fill={ink} fillOpacity="0.8" />
            <path d="M28 8 L36 8 L32 18 Z" fill={ink} fillOpacity="0.8" />
            <circle cx="8" cy="20.5" r="1.1" fill={accent} fillOpacity="0.75" />
            <circle cx="32" cy="20.5" r="1.1" fill={accent} fillOpacity="0.75" />

            {/* geometric star between them */}
            <g transform="translate(20 13)">
              <path d={starPath(0, 0, 5.4, 2.6, 8, 0)} stroke={ink} strokeOpacity="0.9" strokeWidth="0.9" strokeLinejoin="round" />
            </g>
            <g transform="translate(44 13)">
              <path d={starPath(0, 0, 5.4, 2.6, 8, 0)} stroke={ink} strokeOpacity="0.9" strokeWidth="0.9" strokeLinejoin="round" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="26" fill={`url(#${id})`} />
      </svg>
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Mankolam — the mango/paisley of every South Indian loom.
 * ------------------------------------------------------------------ */

export const Mankolam = memo(function Mankolam({ className, weight = 1 }: OrnamentProps) {
  return (
    <svg className={className} viewBox="0 0 60 80" fill="none" aria-hidden="true" focusable="false">
      {/* the mango outline, with its hooked tip */}
      <path
        d="M30 4 C 8 20 4 44 16 62 C 24 74 42 76 50 66 C 58 56 56 38 44 28 C 38 23 33 16 30 4 Z"
        stroke="currentColor"
        strokeWidth={1.3 * weight}
        strokeLinejoin="round"
      />
      <path
        d="M30 16 C 16 28 13 46 22 59 C 28 67 40 68 45 61 C 50 54 48 42 40 35"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth={0.9 * weight}
      />
      {/* seed of petals inside */}
      <path d={petalRosettePath(32, 48, 12, 6, 0, 20)} stroke="currentColor" strokeOpacity="0.75" strokeWidth={0.8 * weight} />
      <circle cx="32" cy="48" r="2.2" fill="currentColor" fillOpacity="0.7" />
      {dotRing(32, 48, 20, 8, 22.5).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="0.9" fill="currentColor" fillOpacity="0.5" />
      ))}
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Hanging brass lamp — light, kept symbolic rather than devotional.
 * ------------------------------------------------------------------ */

export const BrassLamp = memo(function BrassLamp({ className }: OrnamentProps) {
  return (
    <svg className={className} viewBox="0 0 80 150" fill="none" aria-hidden="true" focusable="false">
      {/* chain */}
      <path d="M40 0 V34" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
      {/* canopy */}
      <path d="M28 38 Q40 28 52 38 Z" fill="currentColor" fillOpacity="0.55" />
      <path d="M22 42 H58" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* body */}
      <path
        d="M26 44 C 26 60 32 68 40 74 C 48 68 54 60 54 44 Z"
        fill="currentColor"
        fillOpacity="0.32"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      {/* tiers */}
      <path d="M18 78 Q40 62 62 78 Q40 92 18 78 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
      <path d="M24 94 Q40 82 56 94 Q40 106 24 94 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      {/* wick and glow */}
      <path d="M40 106 V116" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="40" cy="124" rx="5" ry="8" fill="#e8c877" fillOpacity="0.9" />
      <ellipse cx="40" cy="126" rx="11" ry="15" fill="#e8c877" fillOpacity="0.16" />
    </svg>
  );
});

/* ------------------------------------------------------------------ *
 * Corner flourish — the ornate corners of a printed invitation card.
 * ------------------------------------------------------------------ */

export const CornerFlourish = memo(function CornerFlourish({ className }: OrnamentProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <path d="M2 2 H24 M2 2 V24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 8 H16 M8 2 V16" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.8" />
      <path
        d="M6 30 C 6 16 16 6 30 6 C 22 12 18 18 16 26 C 24 22 30 20 38 20 C 26 26 18 34 14 44 C 12 38 10 33 6 30 Z"
        fill="currentColor"
        fillOpacity="0.42"
      />
      <path d="M30 12 q 10 -4 18 2" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.9" />
      <path d="M12 30 q -4 10 2 18" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.9" />
      <circle cx="34" cy="34" r="2" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
});

/** The four ornate corners of a printed card. Drop inside any `.card`. */
export const CardCorners = memo(function CardCorners() {
  return (
    <span className="card__corners" aria-hidden="true">
      <CornerFlourish className="card__corner card__corner--tl" />
      <CornerFlourish className="card__corner card__corner--tr" />
      <CornerFlourish className="card__corner card__corner--bl" />
      <CornerFlourish className="card__corner card__corner--br" />
    </span>
  );
});

/* ------------------------------------------------------------------ *
 * Jaali — the pierced lattice screen, used as a page-wide ground.
 * ------------------------------------------------------------------ */

export const JaaliBackdrop = memo(function JaaliBackdrop({ className }: OrnamentProps) {
  return (
    <div className={`jaali ${className ?? ''}`} aria-hidden="true">
      <svg width="100%" height="100%" fill="none">
        <defs>
          <pattern id="jaali-tile" width="72" height="72" patternUnits="userSpaceOnUse">
            <g stroke="#96742f" strokeOpacity="0.5" strokeWidth="0.8">
              <path d={starPath(36, 36, 24, 13, 8, 0)} strokeLinejoin="round" />
              <path d={polygonPath(36, 36, 13, 8, 22.5)} strokeLinejoin="round" />
              <path d={starPath(0, 0, 24, 13, 8, 0)} strokeLinejoin="round" />
              <path d={starPath(72, 0, 24, 13, 8, 0)} strokeLinejoin="round" />
              <path d={starPath(0, 72, 24, 13, 8, 0)} strokeLinejoin="round" />
              <path d={starPath(72, 72, 24, 13, 8, 0)} strokeLinejoin="round" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jaali-tile)" />
      </svg>
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Drifting jasmine petals and fine gold specks.
 * ------------------------------------------------------------------ */

interface PetalFieldProps {
  count?: number;
  className?: string;
}

export const PetalField = memo(function PetalField({ count = 14, className }: PetalFieldProps) {
  const random = seeded(1709);
  const petals = Array.from({ length: count }, (_, i) => {
    const r = random();
    const r2 = random();
    const r3 = random();
    return {
      key: i,
      left: `${(r * 100).toFixed(2)}%`,
      size: 8 + r2 * 14,
      delay: `${(-r3 * 26).toFixed(2)}s`,
      duration: `${(22 + r2 * 20).toFixed(2)}s`,
      drift: `${(r3 * 60 - 30).toFixed(1)}px`,
      opacity: 0.18 + r2 * 0.3,
    };
  });

  return (
    <div className={`petal-field ${className ?? ''}`} aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.key}
          className="petal-field__petal"
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: p.opacity,
              '--drift': p.drift,
            } as React.CSSProperties
          }
        >
          <Jasmine size={p.size} />
        </span>
      ))}
    </div>
  );
});
