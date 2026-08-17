/**
 * Background music.
 *
 * Background is the operative word: this plays under an invitation being read,
 * so it is paced and mixed to sit behind the page rather than in front of it —
 * slow, sustained, percussion barely there.
 *
 * Two sources, one interface:
 *
 *  1. A real audio file, if `media.audio.src` points at one. Drop a
 *     royalty-free instrumental into `public/audio/` and set the slot.
 *  2. Otherwise the piece is generated in the browser with the Web Audio API:
 *     a plucked veena carrying the tune, a soft flute above it, gentle hand
 *     percussion keeping the pulse, and a tanpura-style drone underneath.
 *     Original, weightless, and it loops without a seam.
 *
 * The score lives in `./composition.ts`. This file only makes the sound.
 *
 * Either way the controller fades in and out — audio never snaps on.
 */

import {
  BEAT,
  BEATS_PER_BAR,
  CHORDS,
  DRUM_FILL,
  DRUM_FIRST_BAR,
  DRUM_LAST_BAR,
  DRUM_PATTERN,
  FLUTE,
  ROOT,
  TOTAL_BARS,
  TOTAL_BEATS,
  VEENA,
  semitone,
  type DrumStroke,
} from './composition';

export interface AmbientController {
  play(): Promise<void>;
  pause(): void;
  dispose(): void;
  /** True when the generated piece is being used instead of a file. */
  usingFallback(): boolean;
}

const FADE_SECONDS = 1.6;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/* ------------------------------------------------------------------ *
 * The generated piece
 * ------------------------------------------------------------------ */

/** Where each voice has got to, in beats since the piece began. */
interface VoiceCursor {
  index: number;
  beat: number;
}

class GeneratedAmbience {
  private ctx: AudioContext;
  private master: GainNode;
  private reverb: GainNode;

  private veenaWave: PeriodicWave;
  private noise: AudioBuffer;

  private drone: GainNode | null = null;
  private timer: number | null = null;
  private disposed = false;

  /** Audio-clock time of beat zero. */
  private origin = 0;
  private veenaAt: VoiceCursor = { index: 0, beat: 0 };
  private fluteAt: VoiceCursor = { index: 0, beat: 0 };
  private barAt = 0;
  private lastVeenaPitch: number | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 3200;
    warmth.Q.value = 0.4;

    this.master.connect(warmth);
    warmth.connect(ctx.destination);

    // A short tail so plucks bloom into the room instead of stopping dead.
    this.reverb = ctx.createGain();
    this.reverb.gain.value = 0.24;
    const tail = ctx.createConvolver();
    tail.buffer = this.buildTail();
    this.reverb.connect(tail);
    tail.connect(this.master);

    this.veenaWave = this.buildVeenaWave();
    this.noise = this.buildNoise();
  }

  /**
   * A plucked string's harmonics, baked into one oscillator: far cheaper than
   * stacking six of them per note, and it is what gives the veena its bite.
   */
  private buildVeenaWave(): PeriodicWave {
    const harmonics = [0, 1, 0.5, 0.34, 0.22, 0.16, 0.1, 0.07, 0.04, 0.03];
    const real = new Float32Array(harmonics.length);
    const imag = new Float32Array(harmonics);
    return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  /** Exponentially decaying noise — a small, cheap room. */
  private buildTail(): AudioBuffer {
    const length = Math.floor(this.ctx.sampleRate * 1.6);
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
      }
    }
    return buffer;
  }

  private buildNoise(): AudioBuffer {
    const length = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private startDrone() {
    if (this.drone) return;
    const bed = this.ctx.createGain();
    bed.gain.value = 0.028;
    bed.connect(this.master);

    [ROOT / 2, ROOT / 4].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // A slow, breathing detune keeps the drone from sounding synthetic.
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + index * 0.017;
      const depth = this.ctx.createGain();
      depth.gain.value = 0.9;
      lfo.connect(depth);
      depth.connect(osc.detune);

      osc.connect(bed);
      osc.start();
      lfo.start();
    });

    this.drone = bed;
  }

  /**
   * The veena: a hard pluck whose harmonics die away faster than its
   * fundamental, so the tone darkens as it rings. `slideFrom` produces the
   * short glide between notes that makes a veena sound like a veena rather
   * than a harp.
   */
  private veena(freq: number, at: number, duration: number, level: number, slideFrom?: number) {
    const osc = this.ctx.createOscillator();
    osc.setPeriodicWave(this.veenaWave);

    if (slideFrom && slideFrom > 0) {
      osc.frequency.setValueAtTime(slideFrom, at);
      osc.frequency.exponentialRampToValueAtTime(freq, at + Math.min(0.09, duration * 0.4));
    } else {
      // Even a straight note starts a shade sharp: the string is stretched.
      osc.frequency.setValueAtTime(freq * 1.008, at);
      osc.frequency.exponentialRampToValueAtTime(freq, at + 0.05);
    }

    // Strings ring on past the note they are written as.
    const ring = Math.max(1.1, duration * 2.4);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, at + ring);

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(4600, at);
    tone.frequency.exponentialRampToValueAtTime(760, at + ring * 0.8);
    tone.Q.value = 0.6;

    osc.connect(env);
    env.connect(tone);
    tone.connect(this.master);
    tone.connect(this.reverb);

    osc.start(at);
    osc.stop(at + ring + 0.05);
  }

  /** The flute: breathy, slow to speak, with vibrato that arrives late. */
  private flute(freq: number, at: number, duration: number, level: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const air = this.ctx.createOscillator();
    air.type = 'sine';
    air.frequency.value = freq * 2;
    const airGain = this.ctx.createGain();
    airGain.gain.value = level * 0.12;

    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 4.8;
    const vibratoDepth = this.ctx.createGain();
    vibratoDepth.gain.setValueAtTime(0, at);
    vibratoDepth.gain.linearRampToValueAtTime(6, at + Math.min(0.9, duration * 0.6));
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(osc.detune);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.22);
    env.gain.setValueAtTime(level, at + duration * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.45);

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2300;

    osc.connect(env);
    air.connect(airGain);
    airGain.connect(env);
    env.connect(tone);
    tone.connect(this.master);
    tone.connect(this.reverb);

    const stopAt = at + duration + 0.6;
    osc.start(at);
    air.start(at);
    vibrato.start(at);
    osc.stop(stopAt);
    air.stop(stopAt);
    vibrato.stop(stopAt);
  }

  /** A quiet plucked chord tone, filling the space under the melody. */
  private accompany(freq: number, at: number, level: number) {
    this.veena(freq, at, 0.9, level);
  }

  /**
   * Hand percussion. The low stroke is a pitched thump — the way a palm on a
   * drum head bends the pitch downward — and the taps are short filtered
   * noise, kept well back in the mix.
   */
  private drum(stroke: DrumStroke, at: number) {
    if (stroke === 'low') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(132, at);
      osc.frequency.exponentialRampToValueAtTime(64, at + 0.09);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(0.09, at + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);

      osc.connect(env);
      env.connect(this.master);
      osc.start(at);
      osc.stop(at + 0.46);
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;

    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = stroke === 'mid' ? 1400 : 2600;
    band.Q.value = stroke === 'mid' ? 1.6 : 3.2;

    const level = stroke === 'mid' ? 0.028 : 0.016;
    const length = stroke === 'mid' ? 0.14 : 0.06;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);

    source.connect(band);
    band.connect(env);
    env.connect(this.master);
    env.connect(this.reverb);

    source.start(at);
    source.stop(at + length + 0.05);
  }

  /* --- scheduling ------------------------------------------------- */

  private timeAt(beat: number): number {
    return this.origin + beat * BEAT;
  }

  /**
   * Each voice keeps its own place in the score and is scheduled a couple of
   * seconds ahead of the clock, so the parts stay locked together without a
   * timer per note.
   */
  private schedule = () => {
    if (this.disposed) return;
    const horizon = this.ctx.currentTime + 2.5;
    const floor = this.ctx.currentTime + 0.04;

    // Veena — the tune.
    while (this.timeAt(this.veenaAt.beat) < horizon) {
      const [pitch, beats] = VEENA[this.veenaAt.index % VEENA.length];
      const at = Math.max(this.timeAt(this.veenaAt.beat), floor);

      if (pitch !== null) {
        const leap = this.lastVeenaPitch !== null && Math.abs(pitch - this.lastVeenaPitch) >= 3;
        this.veena(
          semitone(pitch),
          at,
          beats * BEAT,
          0.088,
          leap ? semitone(this.lastVeenaPitch as number) : undefined,
        );
        this.lastVeenaPitch = pitch;
      } else {
        this.lastVeenaPitch = null;
      }

      this.veenaAt.beat += beats;
      this.veenaAt.index += 1;
    }

    // Flute — the line above.
    while (this.timeAt(this.fluteAt.beat) < horizon) {
      const [pitch, beats] = FLUTE[this.fluteAt.index % FLUTE.length];
      const at = Math.max(this.timeAt(this.fluteAt.beat), floor);

      if (pitch !== null) this.flute(semitone(pitch), at, beats * BEAT * 0.94, 0.072);

      this.fluteAt.beat += beats;
      this.fluteAt.index += 1;
    }

    // Chords and percussion, a bar at a time.
    while (this.timeAt(this.barAt * BEATS_PER_BAR) < horizon) {
      const barStart = Math.max(this.timeAt(this.barAt * BEATS_PER_BAR), floor);
      const barInPiece = this.barAt % TOTAL_BARS;

      CHORDS[barInPiece].forEach((offset, voice) => {
        this.accompany(semitone(offset - 12), barStart + voice * 0.075, 0.028);
      });

      if (barInPiece >= DRUM_FIRST_BAR && barInPiece <= DRUM_LAST_BAR) {
        const strokes =
          barInPiece % 4 === 3 ? [...DRUM_PATTERN, ...DRUM_FILL] : DRUM_PATTERN;
        strokes.forEach(({ at, stroke }) => this.drum(stroke, barStart + at * BEAT));
      }

      this.barAt += 1;
    }
  };

  async play() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => undefined);
    }
    this.startDrone();

    // Starting, or resuming after a pause: re-anchor the clock so nothing is
    // scheduled into the past and the whole backlog fires at once.
    const nextBeat = Math.min(this.veenaAt.beat, this.fluteAt.beat, this.barAt * BEATS_PER_BAR);
    if (this.timeAt(nextBeat) < this.ctx.currentTime) {
      this.origin = this.ctx.currentTime + 0.25 - nextBeat * BEAT;
    }

    if (this.timer === null) {
      this.schedule();
      this.timer = window.setInterval(this.schedule, 700);
    }

    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.linearRampToValueAtTime(0.5, now + FADE_SECONDS);
  }

  pause() {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + FADE_SECONDS);
    window.setTimeout(() => {
      if (this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    }, FADE_SECONDS * 1000);
  }

  dispose() {
    this.disposed = true;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.ctx.close().catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ *
 * Public factory
 * ------------------------------------------------------------------ */

export function createAmbience(src: string | null): AmbientController {
  let element: HTMLAudioElement | null = null;
  let generated: GeneratedAmbience | null = null;
  let fadeTimer: number | null = null;
  let fallback = false;

  const ensureGenerated = (): GeneratedAmbience | null => {
    if (generated) return generated;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    try {
      generated = new GeneratedAmbience(new Ctor());
      fallback = true;
      return generated;
    } catch {
      return null;
    }
  };

  const fadeElement = (to: number, onDone?: () => void) => {
    if (!element) return;
    if (fadeTimer !== null) window.clearInterval(fadeTimer);
    const audio = element;
    const from = audio.volume;
    const started = performance.now();
    fadeTimer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - started) / (FADE_SECONDS * 1000));
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      if (t >= 1) {
        if (fadeTimer !== null) window.clearInterval(fadeTimer);
        fadeTimer = null;
        onDone?.();
      }
    }, 50);
  };

  if (src) {
    try {
      element = new Audio(src);
      element.loop = true;
      element.preload = 'auto';
      element.volume = 0;
      // A missing or unplayable file must never break the invitation.
      element.addEventListener('error', () => {
        element = null;
      });
    } catch {
      element = null;
    }
  }

  return {
    async play() {
      if (element) {
        try {
          await element.play();
          fadeElement(0.55);
          return;
        } catch {
          // Autoplay refused or decode failed — fall through to the generated piece.
          element = null;
        }
      }
      await ensureGenerated()?.play();
    },
    pause() {
      if (element) {
        fadeElement(0, () => element?.pause());
        return;
      }
      generated?.pause();
    },
    dispose() {
      if (fadeTimer !== null) window.clearInterval(fadeTimer);
      element?.pause();
      element = null;
      generated?.dispose();
      generated = null;
    },
    usingFallback: () => fallback,
  };
}

/** Exposed for the offline renderer in scripts/preview-music.mjs. */
export const compositionLength = TOTAL_BEATS * BEAT;
