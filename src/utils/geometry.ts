/**
 * Small helpers for generating the ornamental line-work.
 * Everything the invitation draws is computed here rather than hand-authored,
 * so the motifs stay perfectly symmetrical at any size.
 */

export interface Point {
  x: number;
  y: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Point on a circle. Angles are in degrees, 0° pointing up. */
export const polar = (cx: number, cy: number, radius: number, deg: number): Point => ({
  x: cx + radius * Math.sin(toRad(deg)),
  y: cy - radius * Math.cos(toRad(deg)),
});

const fmt = (n: number) => Number(n.toFixed(2));

const pt = (p: Point) => `${fmt(p.x)} ${fmt(p.y)}`;

/**
 * A regular star polygon — the basis of the Islamic geometric layer.
 * `points` tips, alternating between `radius` and `innerRadius`.
 */
export const starPath = (
  cx: number,
  cy: number,
  radius: number,
  innerRadius: number,
  points = 8,
  rotation = 0,
): string => {
  const step = 360 / (points * 2);
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? radius : innerRadius;
    coords.push(pt(polar(cx, cy, r, rotation + i * step)));
  }
  return `M ${coords.join(' L ')} Z`;
};

/** Regular polygon outline — two of these, offset, read as an eight-point star. */
export const polygonPath = (
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = 0,
): string => {
  const step = 360 / sides;
  const coords: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    coords.push(pt(polar(cx, cy, radius, rotation + i * step)));
  }
  return `M ${coords.join(' L ')} Z`;
};

/**
 * A rosette of leaf-shaped petals radiating from the centre — the botanical
 * layer where jasmine and lotus abstractions meet.
 */
export const petalRosettePath = (
  cx: number,
  cy: number,
  radius: number,
  petals = 8,
  rotation = 0,
  width = 20,
): string => {
  const step = 360 / petals;
  let d = '';
  for (let i = 0; i < petals; i += 1) {
    const a = rotation + i * step;
    const tip = polar(cx, cy, radius, a);
    const c1 = polar(cx, cy, radius * 0.42, a - width);
    const c2 = polar(cx, cy, radius * 0.86, a - width * 0.55);
    const c3 = polar(cx, cy, radius * 0.86, a + width * 0.55);
    const c4 = polar(cx, cy, radius * 0.42, a + width);
    d += `M ${fmt(cx)} ${fmt(cy)} C ${pt(c1)} ${pt(c2)} ${pt(tip)} C ${pt(c3)} ${pt(c4)} ${fmt(
      cx,
    )} ${fmt(cy)} `;
  }
  return d.trim();
};

/**
 * A continuous chain of loops around a circle — the kolam layer.
 * Traditional kolam is drawn as one unbroken line looping around a grid of
 * dots, and that is exactly what this produces.
 */
export const loopRingPath = (
  cx: number,
  cy: number,
  radius: number,
  loops = 8,
  loopSize = 0.46,
  rotation = 0,
): string => {
  const step = 360 / loops;
  const r = radius * loopSize;
  const start = polar(cx, cy, radius, rotation);
  let d = `M ${pt(start)}`;
  for (let i = 1; i <= loops; i += 1) {
    const next = polar(cx, cy, radius, rotation + i * step);
    d += ` A ${fmt(r)} ${fmt(r)} 0 1 1 ${pt(next)}`;
  }
  return `${d} Z`;
};

/** The dots a kolam is drawn around. */
export const dotRing = (
  cx: number,
  cy: number,
  radius: number,
  count = 8,
  rotation = 0,
): Point[] =>
  Array.from({ length: count }, (_, i) => polar(cx, cy, radius, rotation + (360 / count) * i));

/**
 * A pointed arch — Kerala mosque and South Indian temple doorways share this
 * silhouette, which is why it frames so much of the invitation.
 */
export const archPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  peak = 0.42,
): string => {
  const half = width / 2;
  const springLine = y + height * (1 - peak);
  return [
    `M ${fmt(x)} ${fmt(y + height)}`,
    `L ${fmt(x)} ${fmt(springLine)}`,
    `Q ${fmt(x)} ${fmt(y)} ${fmt(x + half)} ${fmt(y)}`,
    `Q ${fmt(x + width)} ${fmt(y)} ${fmt(x + width)} ${fmt(springLine)}`,
    `L ${fmt(x + width)} ${fmt(y + height)}`,
  ].join(' ');
};

/**
 * A closed, softly irregular circle — the edge of a pressed wax seal, where the
 * wax spread a little differently all the way round. Smooth (quadratic through
 * midpoints) rather than scalloped, so it reads as poured, not cut.
 */
export const waxEdgePath = (
  cx: number,
  cy: number,
  radius: number,
  points = 26,
  jitter = 0.05,
  seed = 7,
): string => {
  const rand = seeded(seed);
  const ring = Array.from({ length: points }, (_, i) =>
    polar(cx, cy, radius * (1 + (rand() - 0.5) * jitter * 2), (360 / points) * i),
  );
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  let d = `M ${pt(mid(ring[points - 1], ring[0]))}`;
  for (let i = 0; i < points; i += 1) {
    d += ` Q ${pt(ring[i])} ${pt(mid(ring[i], ring[(i + 1) % points]))}`;
  }
  return `${d} Z`;
};

/**
 * The deckled edge of hand-torn paper, as a closed shape filling everything
 * above the tear. Drawn into a `preserveAspectRatio="none"` viewBox so one
 * path stretches across any screen width.
 */
export const tornEdgePath = (width: number, height: number, steps = 26, seed = 11): string => {
  const rand = seeded(seed);
  const step = width / steps;
  // A random walk, not an alternation: a strict zigzag reads as pinking shears.
  let y = 0.5;
  let d = `M ${fmt(width)} 0 L 0 0 L 0 ${fmt(height * 0.5)}`;
  for (let i = 0; i <= steps; i += 1) {
    y = clamp(y + (rand() - 0.5) * 0.44, 0.2, 0.84);
    d += ` L ${fmt(step * i)} ${fmt(height * y)}`;
  }
  return `${d} L ${fmt(width)} ${fmt(height * 0.5)} Z`;
};

/** Deterministic pseudo-random, so petals and stars land identically every load. */
export const seeded = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
