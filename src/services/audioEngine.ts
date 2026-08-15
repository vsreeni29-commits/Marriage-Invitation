/**
 * Background ambience.
 *
 * Two sources, one interface:
 *
 *  1. A real audio file, if `media.audio.src` points at one. Drop a
 *     royalty-free instrumental into `public/audio/` and set the slot.
 *  2. Otherwise a small generated ambience — a warm, slow arpeggio over a
 *     soft drone, written with the Web Audio API. It is original, weighs
 *     nothing, loops forever, and is deliberately neutral: no ceremony
 *     motifs from either tradition, just flute-like tones on a scale that
 *     Carnatic and Hindustani music share.
 *
 * Either way the controller fades in and out — audio never snaps on.
 */

export interface AmbientController {
  play(): Promise<void>;
  pause(): void;
  dispose(): void;
  /** True when the generated ambience is being used instead of a file. */
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
 * Generated ambience
 * ------------------------------------------------------------------ */

/**
 * Mohanam / Bhoopali — the same five notes in Carnatic and Hindustani music,
 * and about as close to culturally shared ground as a scale gets.
 */
const SCALE = [0, 2, 4, 7, 9];
const ROOT = 293.66; // D4

const semitone = (steps: number) => ROOT * Math.pow(2, steps / 12);

class GeneratedAmbience {
  private ctx: AudioContext;
  private master: GainNode;
  private drone: GainNode | null = null;
  private timer: number | null = null;
  private nextNoteAt = 0;
  private step = 0;
  private disposed = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 2600;
    warmth.Q.value = 0.4;

    this.master.connect(warmth);
    warmth.connect(ctx.destination);
  }

  private startDrone() {
    if (this.drone) return;
    const bed = this.ctx.createGain();
    bed.gain.value = 0.05;
    bed.connect(this.master);

    [ROOT / 2, (ROOT / 2) * Math.pow(2, 7 / 12)].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // A slow, breathing detune keeps the drone from sounding synthetic.
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + index * 0.017;
      const lfoDepth = this.ctx.createGain();
      lfoDepth.gain.value = 0.9;
      lfo.connect(lfoDepth);
      lfoDepth.connect(osc.detune);

      osc.connect(bed);
      osc.start();
      lfo.start();
    });

    this.drone = bed;
  }

  /** One plucked, flute-like tone with a long tail. */
  private voice(freq: number, at: number, duration: number, level: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = freq * 2;
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.value = level * 0.16;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.28);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(1800, at);
    tone.frequency.exponentialRampToValueAtTime(700, at + duration);

    osc.connect(env);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(env);
    env.connect(tone);
    tone.connect(this.master);

    osc.start(at);
    shimmer.start(at);
    osc.stop(at + duration + 0.1);
    shimmer.stop(at + duration + 0.1);
  }

  private schedule = () => {
    if (this.disposed) return;
    const horizon = this.ctx.currentTime + 2;

    while (this.nextNoteAt < horizon) {
      const at = Math.max(this.nextNoteAt, this.ctx.currentTime + 0.05);

      // A slow, wandering line rather than a repeating loop.
      const octave = this.step % 16 < 8 ? 0 : 12;
      const degree = SCALE[(this.step * 3 + Math.floor(this.step / 5)) % SCALE.length];
      this.voice(semitone(degree + octave), at, 4.2, 0.09);

      // Every fourth note, a quiet companion a fifth below — two voices, one line.
      if (this.step % 4 === 2) {
        this.voice(semitone(degree - 5), at + 0.35, 5.4, 0.05);
      }

      this.nextNoteAt = at + 1.85;
      this.step += 1;
    }
  };

  async play() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => undefined);
    }
    this.startDrone();
    if (this.timer === null) {
      this.nextNoteAt = this.ctx.currentTime + 0.2;
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
          // Autoplay refused or decode failed — fall through to generated audio.
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
