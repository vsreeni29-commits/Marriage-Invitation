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
