/**
 * Renders the generated ambience to a WAV file so it can be listened to
 * outside a browser.
 *
 *   node scripts/preview-music.mjs [outfile.wav]
 *
 * This is an offline reimplementation of `src/services/audioEngine.ts` — the
 * same melody, chords, envelopes and filters — so what you hear here is what
 * the site plays. It is a preview tool only; nothing imports it at runtime.
 */

import { writeFileSync } from 'node:fs';

// Everything is lowpassed at 2.4 kHz, so 22.05 kHz is ample for a shareable
// preview. Override with PREVIEW_RATE=44100 for a full-quality render.
const SAMPLE_RATE = Number(process.env.PREVIEW_RATE ?? 22050);
const ROOT = 293.66; // D4
const BEAT = 0.46;

const MELODY = [
  // — A —
  [7, 1.5], [9, 0.75], [7, 0.75], [4, 1.5], [2, 1.5],
  [4, 0.75], [7, 0.75], [4, 1.5], [null, 1.5],
  [4, 1.5], [7, 0.75], [9, 0.75], [12, 1.5], [9, 1.5],
  [7, 0.75], [4, 0.75], [2, 1.5], [null, 1.5],
  [9, 1.5], [12, 0.75], [14, 0.75], [16, 2.25], [14, 0.75],
  [12, 1.5], [9, 1.5], [7, 1.5], [null, 0.75],
  [7, 0.75], [9, 0.75], [7, 0.75], [4, 1.5], [2, 0.75], [0, 2.25],
  [null, 3],
  // — B —
  [0, 1.5], [2, 0.75], [4, 0.75], [7, 1.5],
  [4, 1.5], [2, 0.75], [0, 0.75], [null, 1.5],
  [2, 1.5], [4, 0.75], [7, 0.75], [9, 1.5],
  [7, 1.5], [4, 0.75], [2, 0.75], [null, 1.5],
  [4, 1.5], [7, 0.75], [9, 0.75], [12, 1.5],
  [9, 1.5], [7, 0.75], [4, 0.75], [null, 1.5],
  [2, 1.5], [4, 1.5], [7, 1.5],
  [9, 2.25], [7, 0.75], [4, 1.5],
  [2, 0.75], [0, 1.5], [null, 2.25],
  [null, 1.5],
];

const CHORDS = [
  // — A —
  [0, 7, 16], [0, 7, 16], [-3, 4, 12], [-3, 4, 12],
  [-5, 2, 9], [-5, 2, 9], [0, 7, 16], [0, 7, 16],
  [-3, 4, 12], [-3, 4, 12], [-5, 2, 9], [-5, 2, 9],
  [2, 9, 14], [0, 7, 12],
  // — B —
  [-5, 2, 9], [-5, 2, 9], [0, 7, 12], [0, 7, 12],
  [-3, 4, 12], [-3, 4, 12], [-5, 2, 9], [-5, 2, 9],
  [0, 7, 16], [0, 7, 16], [2, 9, 14], [2, 9, 14],
  [0, 7, 12], [0, 7, 12],
];

/** Beats in one full pass — used to know when a variation should begin. */
const CYCLE_BEATS = MELODY.reduce((sum, [, beats]) => sum + beats, 0);

const semitone = (steps) => ROOT * Math.pow(2, steps / 12);

/* --- signal helpers ------------------------------------------------- */

const triangle = (phase) => 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
const sine = (phase) => Math.sin(2 * Math.PI * phase);

/** Matches WebAudio's exponentialRampToValueAtTime between two anchors. */
function expRamp(t, t0, v0, t1, v1) {
  if (t <= t0) return v0;
  if (t >= t1) return v1;
  return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
}

/** One-pole lowpass, applied per sample. */
function makeLowpass() {
  let previous = 0;
  return (input, cutoff) => {
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);
    previous += a * (input - previous);
    return previous;
  };
}

/* --- voices --------------------------------------------------------- */

function addFlute(buffer, freq, at, duration, level) {
  const start = Math.floor(at * SAMPLE_RATE);
  const end = Math.min(buffer.length, Math.floor((at + duration + 0.5) * SAMPLE_RATE));
  const vibratoRamp = Math.min(0.6, duration * 0.7);
  const lowpass = makeLowpass();
  let phase = 0;
  let airPhase = 0;

  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    if (t < 0) continue;

    // Envelope: soft attack, held, long release.
    let env;
    if (t < 0.14) env = expRamp(t, 0, 0.0001, 0.14, level);
    else if (t < duration * 0.55) env = level;
    else env = expRamp(t, duration * 0.55, level, duration + 0.5, 0.0001);

    // Vibrato in cents, fading in.
    const depth = 5 * Math.min(1, t / vibratoRamp);
    const detune = depth * Math.sin(2 * Math.PI * 4.6 * t);
    const f = freq * Math.pow(2, detune / 1200);

    phase += f / SAMPLE_RATE;
    airPhase += (f * 2) / SAMPLE_RATE;

    const raw = triangle(phase) * env + sine(airPhase) * level * 0.13 * (env / level);
    buffer[i] += lowpass(raw, 2400);
  }
}

function addPluck(buffer, freq, at, level) {
  const start = Math.floor(at * SAMPLE_RATE);
  const end = Math.min(buffer.length, Math.floor((at + 2.6) * SAMPLE_RATE));
  const lowpass = makeLowpass();
  let phase = 0;

  for (let i = start; i < end; i += 1) {
    const t = i / SAMPLE_RATE - at;
    if (t < 0) continue;

    const env = t < 0.02 ? expRamp(t, 0, 0.0001, 0.02, level) : expRamp(t, 0.02, level, 2.6, 0.0001);
    const cutoff = expRamp(t, 0, 2200, 2.2, 520);

    phase += freq / SAMPLE_RATE;
    buffer[i] += lowpass(triangle(phase) * env, cutoff);
  }
}

function addDrone(buffer, seconds) {
  [ROOT / 2, ROOT / 4].forEach((freq, index) => {
    let phase = 0;
    for (let i = 0; i < Math.min(buffer.length, seconds * SAMPLE_RATE); i += 1) {
      const t = i / SAMPLE_RATE;
      const detune = 0.9 * Math.sin(2 * Math.PI * (0.05 + index * 0.017) * t);
      const f = freq * Math.pow(2, detune / 1200);
      phase += f / SAMPLE_RATE;
      // Fade the drone in with the master, so it never thumps at t=0.
      const fade = Math.min(1, t / 1.6);
      buffer[i] += sine(phase) * 0.03 * fade;
    }
  });
}

/* --- arrangement ---------------------------------------------------- */

const totalBeats = MELODY.reduce((sum, [, beats]) => sum + beats, 0);
const loopSeconds = totalBeats * BEAT;
const LOOPS = 2;
const seconds = loopSeconds * LOOPS + 2;

const buffer = new Float32Array(Math.ceil(seconds * SAMPLE_RATE));

addDrone(buffer, seconds);

let cursor = 0.2;
let beat = 0;
for (let loop = 0; loop < LOOPS; loop += 1) {
  for (const [pitch, beats] of MELODY) {
    const span = beats * BEAT;

    const secondPass = Math.floor(beat / CYCLE_BEATS) % 2 === 1;

    if (pitch !== null) {
      const sounded = secondPass && pitch >= 12 ? pitch - 12 : pitch;
      addFlute(buffer, semitone(sounded), cursor, span * 0.92, 0.13);
    }

    if (Math.floor(beat) % 3 === 0) {
      const bar = Math.floor((beat % CYCLE_BEATS) / 3) % CHORDS.length;
      CHORDS[bar].forEach((offset, voice) => {
        addPluck(buffer, semitone(offset - 12), cursor + voice * 0.09, 0.055);
      });
    }

    cursor += span;
    beat += beats;
  }
}

/* --- master + write -------------------------------------------------- */

const masterFilter = makeLowpass();
let peak = 0;
let sumSquares = 0;

for (let i = 0; i < buffer.length; i += 1) {
  const fadeIn = Math.min(1, i / SAMPLE_RATE / 1.6);
  const value = masterFilter(buffer[i], 2600) * 0.72 * fadeIn;
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
console.log(`  loop      ${loopSeconds.toFixed(1)}s (${totalBeats} beats)`);
console.log(`  rendered  ${seconds.toFixed(1)}s`);
console.log(`  peak      ${peak.toFixed(3)}`);
console.log(`  rms       ${Math.sqrt(sumSquares / buffer.length).toFixed(4)}`);
