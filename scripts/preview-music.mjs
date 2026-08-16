/**
 * Renders the generated piece to a WAV so it can be listened to outside a
 * browser.
 *
 *   node scripts/preview-music.mjs [outfile.wav]
 *   PREVIEW_RATE=44100 node scripts/preview-music.mjs preview.wav
 *
 * The score is read directly out of `src/services/composition.ts`, so the notes
 * can never drift apart from the site. The synthesis here mirrors
 * `src/services/audioEngine.ts` — same waveforms, envelopes and filters.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/* --- read the score -------------------------------------------------- */

const source = readFileSync(resolve(here, '../src/services/composition.ts'), 'utf8');

function literal(name) {
  // Nested arrays end in "]," so requiring "];" finds the outer one.
  const match = source.match(new RegExp(`${name}[^=]*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`could not read ${name} from composition.ts`);
  return eval(match[1].replace(/\/\/.*$/gm, ''));
}

const VEENA = literal('VEENA');
const FLUTE = literal('FLUTE');
const CHORDS = literal('CHORDS');
const DRUM_PATTERN = literal('DRUM_PATTERN');
const DRUM_FILL = literal('DRUM_FILL');

const number = (name) => Number(source.match(new RegExp(`${name} = ([\\d.]+)`))[1]);

const ROOT = number('ROOT');
const BEAT = number('BEAT');
const BEATS_PER_BAR = number('BEATS_PER_BAR');
const DRUM_FIRST_BAR = number('DRUM_FIRST_BAR');
const DRUM_LAST_BAR = number('DRUM_LAST_BAR');

const TOTAL_BEATS = VEENA.reduce((sum, [, beats]) => sum + beats, 0);
const TOTAL_BARS = TOTAL_BEATS / BEATS_PER_BAR;

const semitone = (steps) => ROOT * Math.pow(2, steps / 12);

// Everything is lowpassed well below 10 kHz, so 22.05 kHz is ample for a
// shareable preview. Override with PREVIEW_RATE=44100 for a full render.
const SAMPLE_RATE = Number(process.env.PREVIEW_RATE ?? 22050);

/* --- signal helpers --------------------------------------------------- */

const sine = (phase) => Math.sin(2 * Math.PI * phase);
const triangle = (phase) => 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;

/**
 * The veena's harmonic series, matching the PeriodicWave in the engine.
 *
 * Built once into a lookup table and scaled so its peak is 1 — which is what
 * `createPeriodicWave` does by default, and the reason this render lines up
 * with what the browser produces instead of coming out quieter.
 */
const HARMONICS = [0, 1, 0.5, 0.34, 0.22, 0.16, 0.1, 0.07, 0.04, 0.03];
const TABLE_SIZE = 4096;

const PLUCK_TABLE = (() => {
  const table = new Float32Array(TABLE_SIZE);
  let max = 0;
  for (let i = 0; i < TABLE_SIZE; i += 1) {
    let value = 0;
    for (let n = 1; n < HARMONICS.length; n += 1) {
      if (HARMONICS[n] !== 0) value += HARMONICS[n] * sine((i / TABLE_SIZE) * n);
    }
    table[i] = value;
    max = Math.max(max, Math.abs(value));
  }
  for (let i = 0; i < TABLE_SIZE; i += 1) table[i] /= max || 1;
  return table;
})();

function pluckWave(phase) {
  const position = (phase - Math.floor(phase)) * TABLE_SIZE;
  const index = Math.floor(position);
  const frac = position - index;
  const a = PLUCK_TABLE[index % TABLE_SIZE];
  const b = PLUCK_TABLE[(index + 1) % TABLE_SIZE];
  return a + (b - a) * frac;
}

function expRamp(t, t0, v0, t1, v1) {
  if (t <= t0) return v0;
  if (t >= t1) return v1;
  return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
}

function makeLowpass() {
  let previous = 0;
  return (input, cutoff) => {
    const a = 1 - Math.exp((-2 * Math.PI * Math.min(cutoff, SAMPLE_RATE / 2.2)) / SAMPLE_RATE);
    previous += a * (input - previous);
    return previous;
  };
}

function makeBandpass(centre, q) {
  // Two-pole state-variable filter, plenty for a drum tap.
  let low = 0;
  let band = 0;
  const f = (2 * Math.sin(Math.PI * Math.min(centre, SAMPLE_RATE / 2.2))) / SAMPLE_RATE;
  const damp = 1 / q;
  return (input) => {
    const high = input - low - damp * band;
    band += f * high;
    low += f * band;
    return band;
  };
}

/* --- voices ----------------------------------------------------------- */

function addVeena(buffer, freq, at, duration, level, slideFrom) {
  const ring = Math.max(1.1, duration * 2.4);
  const start = Math.floor(at * SAMPLE_RATE);
  const end = Math.min(buffer.length, Math.floor((at + ring + 0.05) * SAMPLE_RATE));
  const lowpass = makeLowpass();
  let phase = 0;

  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    if (t < 0) continue;

    const f = slideFrom
      ? expRamp(t, 0, slideFrom, Math.min(0.09, duration * 0.4), freq)
      : expRamp(t, 0, freq * 1.008, 0.05, freq);

    const env =
      t < 0.006 ? expRamp(t, 0, 0.0001, 0.006, level) : expRamp(t, 0.006, level, ring, 0.0001);
    const cutoff = expRamp(t, 0, 4600, ring * 0.8, 760);

    phase += f / SAMPLE_RATE;
    buffer[i] += lowpass(pluckWave(phase) * env, cutoff);
  }
}

function addFlute(buffer, freq, at, duration, level) {
  const start = Math.floor(at * SAMPLE_RATE);
  const end = Math.min(buffer.length, Math.floor((at + duration + 0.6) * SAMPLE_RATE));
  const vibratoRamp = Math.min(0.9, duration * 0.6);
  const lowpass = makeLowpass();
  let phase = 0;
  let airPhase = 0;

  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    if (t < 0) continue;

    let env;
    if (t < 0.22) env = expRamp(t, 0, 0.0001, 0.22, level);
    else if (t < duration * 0.7) env = level;
    else env = expRamp(t, duration * 0.7, level, duration + 0.45, 0.0001);

    const detune = 6 * Math.min(1, t / vibratoRamp) * Math.sin(2 * Math.PI * 4.8 * t);
    const f = freq * Math.pow(2, detune / 1200);

    phase += f / SAMPLE_RATE;
    airPhase += (f * 2) / SAMPLE_RATE;

    const raw = triangle(phase) * env + sine(airPhase) * level * 0.12 * (env / level);
    buffer[i] += lowpass(raw, 2300);
  }
}

function addDrum(buffer, stroke, at) {
  if (stroke === 'low') {
    const start = Math.floor(at * SAMPLE_RATE);
    const end = Math.min(buffer.length, Math.floor((at + 0.46) * SAMPLE_RATE));
    let phase = 0;
    for (let i = start; i < end; i += 1) {
      const t = i / SAMPLE_RATE - at;
      if (t < 0) continue;
      const f = expRamp(t, 0, 132, 0.09, 64);
      const env =
        t < 0.006 ? expRamp(t, 0, 0.0001, 0.006, 0.09) : expRamp(t, 0.006, 0.09, 0.42, 0.0001);
      phase += f / SAMPLE_RATE;
      buffer[i] += sine(phase) * env;
    }
    return;
  }

  const level = stroke === 'mid' ? 0.05 : 0.028;
  const length = stroke === 'mid' ? 0.14 : 0.06;
  const band = makeBandpass(stroke === 'mid' ? 1400 : 2600, stroke === 'mid' ? 1.6 : 3.2);
  const start = Math.floor(at * SAMPLE_RATE);
  const end = Math.min(buffer.length, Math.floor((at + length + 0.05) * SAMPLE_RATE));

  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    if (t < 0) continue;
    const env =
      t < 0.004 ? expRamp(t, 0, 0.0001, 0.004, level) : expRamp(t, 0.004, level, length, 0.0001);
    buffer[i] += band(Math.random() * 2 - 1) * env;
  }
}

function addDrone(buffer, seconds) {
  [ROOT / 2, ROOT / 4].forEach((freq, index) => {
    let phase = 0;
    const end = Math.min(buffer.length, Math.floor(seconds * SAMPLE_RATE));
    for (let i = 0; i < end; i += 1) {
      const t = i / SAMPLE_RATE;
      const detune = 0.9 * Math.sin(2 * Math.PI * (0.05 + index * 0.017) * t);
      phase += (freq * Math.pow(2, detune / 1200)) / SAMPLE_RATE;
      buffer[i] += sine(phase) * 0.028;
    }
  });
}

/* --- arrangement ------------------------------------------------------ */

const loopSeconds = TOTAL_BEATS * BEAT;
const LOOPS = Number(process.env.PREVIEW_LOOPS ?? 2);
const seconds = loopSeconds * LOOPS + 3;
const buffer = new Float32Array(Math.ceil(seconds * SAMPLE_RATE));

addDrone(buffer, seconds);

const ORIGIN = 0.25;
const timeAt = (beat) => ORIGIN + beat * BEAT;

// Veena
{
  let beat = 0;
  let last = null;
  for (let i = 0; beat < TOTAL_BEATS * LOOPS; i += 1) {
    const [pitch, beats] = VEENA[i % VEENA.length];
    if (pitch !== null) {
      const leap = last !== null && Math.abs(pitch - last) >= 3;
      addVeena(
        buffer,
        semitone(pitch),
        timeAt(beat),
        beats * BEAT,
        0.105,
        leap ? semitone(last) : undefined,
      );
      last = pitch;
    } else {
      last = null;
    }
    beat += beats;
  }
}

// Flute
{
  let beat = 0;
  for (let i = 0; beat < TOTAL_BEATS * LOOPS; i += 1) {
    const [pitch, beats] = FLUTE[i % FLUTE.length];
    if (pitch !== null) addFlute(buffer, semitone(pitch), timeAt(beat), beats * BEAT * 0.94, 0.062);
    beat += beats;
  }
}

// Chords and percussion
for (let bar = 0; bar < TOTAL_BARS * LOOPS; bar += 1) {
  const barStart = timeAt(bar * BEATS_PER_BAR);
  const barInPiece = bar % TOTAL_BARS;

  CHORDS[barInPiece].forEach((offset, voice) => {
    addVeena(buffer, semitone(offset - 12), barStart + voice * 0.075, 0.9, 0.028);
  });

  if (barInPiece >= DRUM_FIRST_BAR && barInPiece <= DRUM_LAST_BAR) {
    const strokes = barInPiece % 4 === 3 ? [...DRUM_PATTERN, ...DRUM_FILL] : DRUM_PATTERN;
    strokes.forEach(({ at, stroke }) => addDrum(buffer, stroke, barStart + at * BEAT));
  }
}

/* --- master + write --------------------------------------------------- */

const masterFilter = makeLowpass();
let peak = 0;
let sumSquares = 0;

for (let i = 0; i < buffer.length; i += 1) {
  const fadeIn = Math.min(1, i / SAMPLE_RATE / 1.6);
  const value = masterFilter(buffer[i], 3200) * 0.68 * fadeIn;
  buffer[i] = value;
  peak = Math.max(peak, Math.abs(value));
  sumSquares += value * value;
}

const pcm = Buffer.alloc(buffer.length * 2);
for (let i = 0; i < buffer.length; i += 1) {
  const clamped = Math.max(-1, Math.min(1, buffer[i]));
  pcm.writeInt16LE(Math.round(clamped * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const out = process.argv[2] ?? 'ambience-preview.wav';
writeFileSync(out, Buffer.concat([header, pcm]));

console.log(`wrote ${out}`);
console.log(`  loop      ${loopSeconds.toFixed(1)}s (${TOTAL_BEATS} beats, ${TOTAL_BARS} bars)`);
console.log(`  veena     ${VEENA.length} notes`);
console.log(`  rendered  ${seconds.toFixed(1)}s at ${SAMPLE_RATE} Hz`);
console.log(`  peak      ${peak.toFixed(3)}`);
console.log(`  rms       ${Math.sqrt(sumSquares / buffer.length).toFixed(4)}`);
