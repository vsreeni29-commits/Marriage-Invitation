/**
 * The score.
 *
 * Kept apart from the synthesis so the tune can be edited without touching the
 * audio graph — and so `scripts/preview-music.mjs` can render exactly the same
 * arrangement offline.
 *
 * Original, written for this invitation. The scale is Mohanam / Bhoopali —
 * the same five notes in Carnatic and Hindustani music, which is about as close
 * to shared cultural ground as a scale gets. Numbers are semitones from the
 * root (D); durations are in beats; `null` is a rest.
 *
 * Everything is barred in three beats, and every voice sums to the same 84
 * beats, so the parts can never drift out of alignment however long it loops.
 */

export type Note = [number | null, number];

export const ROOT = 293.66; // D4
export const BEAT = 0.56; // seconds — background pace, not performance pace
export const BEATS_PER_BAR = 3;

export const semitone = (steps: number) => ROOT * Math.pow(2, steps / 12);

/**
 * The veena carries the tune: a continuous line that keeps moving, with the
 * phrase turning back on itself the way a South Indian melody does rather than
 * marching up and down a scale.
 */
export const VEENA: Note[] = [
  // — A, bars 1–14 —
  [7, 0.5], [9, 0.5], [7, 0.5], [4, 0.5], [7, 1],
  [9, 0.5], [12, 0.5], [9, 0.5], [7, 0.5], [4, 1],
  [2, 0.5], [4, 0.5], [7, 0.5], [4, 0.5], [2, 1],
  [0, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [9, 1],
  [7, 0.5], [9, 0.5], [12, 0.5], [14, 0.5], [12, 1],
  [9, 0.5], [7, 0.5], [9, 0.5], [4, 0.5], [7, 1],
  [4, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [9, 1],
  [12, 1], [9, 0.5], [7, 0.5], [4, 1],
  [7, 0.5], [9, 0.5], [12, 1], [14, 1],
  [16, 1], [14, 0.5], [12, 0.5], [9, 1],
  [12, 0.5], [9, 0.5], [7, 0.5], [9, 0.5], [7, 1],
  [4, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [0, 1],
  [2, 0.5], [4, 0.5], [7, 0.5], [9, 0.5], [7, 1],
  [4, 1], [2, 0.5], [0, 0.5], [null, 1],

  // — B, bars 15–28: lower, then climbing home —
  [0, 0.5], [2, 0.5], [4, 0.5], [2, 0.5], [0, 1],
  [-3, 0.5], [0, 0.5], [2, 0.5], [4, 0.5], [7, 1],
  [4, 0.5], [2, 0.5], [0, 0.5], [2, 0.5], [4, 1],
  [7, 0.5], [9, 0.5], [7, 0.5], [4, 0.5], [2, 1],
  [4, 0.5], [7, 0.5], [9, 0.5], [12, 0.5], [9, 1],
  [7, 0.5], [4, 0.5], [7, 0.5], [9, 0.5], [7, 1],
  [9, 0.5], [12, 0.5], [14, 0.5], [12, 0.5], [9, 1],
  [7, 1], [9, 0.5], [7, 0.5], [4, 1],
  [2, 0.5], [4, 0.5], [7, 0.5], [9, 0.5], [12, 1],
  [14, 1], [12, 0.5], [9, 0.5], [7, 1],
  [9, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [4, 1],
  [7, 0.5], [4, 0.5], [2, 0.5], [0, 0.5], [2, 1],
  [4, 0.5], [2, 0.5], [0, 0.5], [-3, 0.5], [0, 1],
  [0, 1.5], [null, 1.5],
];

/**
 * The flute floats above in long tones, entering after the veena has settled
 * and dropping out at the ends of phrases so the line can breathe.
 */
export const FLUTE: Note[] = [
  [null, 6],
  [16, 3], [14, 3],
  [12, 4.5], [14, 1.5],
  [16, 3], [null, 3],
  [19, 3], [16, 3],
  [14, 3], [12, 3],
  [null, 6],

  [null, 6],
  [12, 3], [9, 3],
  [16, 4.5], [14, 1.5],
  [12, 3], [null, 3],
  [19, 3], [16, 3],
  [12, 3], [14, 3],
  [12, 3], [null, 3],
];

/** One chord per bar, as offsets from the root — twenty-eight bars. */
export const CHORDS: number[][] = [
  [0, 7, 16], [0, 7, 16], [-3, 4, 12], [-3, 4, 12],
  [-5, 2, 9], [-5, 2, 9], [0, 7, 16], [0, 7, 16],
  [-3, 4, 12], [-3, 4, 12], [-5, 2, 9], [-5, 2, 9],
  [2, 9, 14], [0, 7, 12],
  [-5, 2, 9], [-5, 2, 9], [0, 7, 12], [0, 7, 12],
  [-3, 4, 12], [-3, 4, 12], [-5, 2, 9], [-5, 2, 9],
  [0, 7, 16], [0, 7, 16], [2, 9, 14], [2, 9, 14],
  [0, 7, 12], [0, 7, 12],
];

export type DrumStroke = 'low' | 'mid' | 'tap';

/** Hand percussion, one bar's worth. Offsets are beats within the bar. */
export const DRUM_PATTERN: { at: number; stroke: DrumStroke }[] = [
  { at: 0, stroke: 'low' },
  { at: 1, stroke: 'tap' },
  { at: 2, stroke: 'mid' },
  { at: 2.5, stroke: 'tap' },
];

/** A light extra stroke every fourth bar, so the pulse never sits perfectly still. */
export const DRUM_FILL: { at: number; stroke: DrumStroke }[] = [{ at: 1.5, stroke: 'tap' }];

/** Percussion joins once the tune is established, and steps back at the close. */
export const DRUM_FIRST_BAR = 4;
export const DRUM_LAST_BAR = 26;

export const TOTAL_BEATS = VEENA.reduce((sum, [, beats]) => sum + beats, 0);
export const TOTAL_BARS = TOTAL_BEATS / BEATS_PER_BAR;
