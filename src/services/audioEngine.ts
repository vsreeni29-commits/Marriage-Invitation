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
 * An original instrumental, written for this invitation.
 *
 * The mood is the one Malayalam romance soundtracks live in — unhurried, a
 * little nostalgic, a flute carrying the tune over softly plucked strings —
 * but the melody is composed here from scratch, so nothing is borrowed from
 * any recording.
 *
 * Semitones are relative to the root, D. The scale is Mohanam / Bhoopali:
 * the same five notes in Carnatic and Hindustani music, which is about as
 * close to shared cultural ground as a scale gets.
 */
const ROOT = 293.66; // D4

const semitone = (steps: number) => ROOT * Math.pow(2, steps / 12);

/** [semitone, beats] — a rest is `null`. Written in a gentle 6/8 lilt. */
type Note = [number | null, number];

/**
 * Two sections of fourteen bars each.
 *
 * A: a statement, its answer, a lift, and a resolution home.
 * B: a lower, gentler restatement that climbs once before settling.
 *
 * Both end on the root, so the loop closes without a seam, and on alternate
 * passes the highest phrases drop an octave — the tune comes back changed,
 * which is what keeps eighty seconds of background music from nagging.
 */
const MELODY: Note[] = [
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

/**
 * One chord per bar of three beats, as offsets from the root — twenty-eight
 * bars, exactly matching the melody, so the two never drift apart.
 */
const CHORDS: number[][] = [
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

const BEAT = 0.46; // seconds — unhurried

class GeneratedAmbience {
  private ctx: AudioContext;
  private master: GainNode;
  private drone: GainNode | null = null;
  private timer: number | null = null;
  private nextNoteAt = 0;
  private step = 0;
  private beat = 0;
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
    bed.gain.value = 0.03;
    bed.connect(this.master);

    // Root only — a tanpura-style Sa that sits under every chord without
    // arguing with any of them.
    [ROOT / 2, ROOT / 4].forEach((freq, index) => {
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

  /**
   * The lead: a breathy flute. A triangle wave for the body, a quiet octave
   * above for air, a touch of vibrato once the note has settled, and a soft
   * attack so nothing ever sounds struck.
   */
  private flute(freq: number, at: number, duration: number, level: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const air = this.ctx.createOscillator();
    air.type = 'sine';
    air.frequency.value = freq * 2;
    const airGain = this.ctx.createGain();
    airGain.gain.value = level * 0.13;

    // Vibrato fades in, the way a player leans into a held note.
    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 4.6;
    const vibratoDepth = this.ctx.createGain();
    vibratoDepth.gain.setValueAtTime(0, at);
    vibratoDepth.gain.linearRampToValueAtTime(5, at + Math.min(0.6, duration * 0.7));
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(osc.detune);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.14);
    env.gain.setValueAtTime(level, at + duration * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.5);

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;

    osc.connect(env);
    air.connect(airGain);
    airGain.connect(env);
    env.connect(tone);
    tone.connect(this.master);

    const stopAt = at + duration + 0.7;
    osc.start(at);
    air.start(at);
    vibrato.start(at);
    osc.stop(stopAt);
    air.stop(stopAt);
    vibrato.stop(stopAt);
  }

  /** The accompaniment: a plucked string, short and warm. */
  private pluck(freq: number, at: number, level: number) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(2200, at);
    tone.frequency.exponentialRampToValueAtTime(520, at + 2.2);

    osc.connect(env);
    env.connect(tone);
    tone.connect(this.master);

    osc.start(at);
    osc.stop(at + 2.9);
  }

  /**
   * Schedules ahead of the clock in small batches, so the piece plays in time
   * without holding a timer per note.
   */
  private schedule = () => {
    if (this.disposed) return;
    const horizon = this.ctx.currentTime + 2.5;

    while (this.nextNoteAt < horizon) {
      const at = Math.max(this.nextNoteAt, this.ctx.currentTime + 0.05);
      const [pitch, beats] = MELODY[this.step % MELODY.length];
      const span = beats * BEAT;

      // Every second pass, the highest phrases sound an octave lower.
      const secondPass = Math.floor(this.beat / CYCLE_BEATS) % 2 === 1;

      if (pitch !== null) {
        const sounded = secondPass && pitch >= 12 ? pitch - 12 : pitch;
        this.flute(semitone(sounded), at, span * 0.92, 0.13);
      }

      // The chord bed rolls underneath, one voice at a time, like a strum.
      if (Math.floor(this.beat) % 3 === 0) {
        const bar = Math.floor((this.beat % CYCLE_BEATS) / 3) % CHORDS.length;
        CHORDS[bar].forEach((offset, voice) => {
          this.pluck(semitone(offset - 12), at + voice * 0.09, 0.055);
        });
      }

      this.nextNoteAt = at + span;
      this.beat += beats;
      this.step += 1;
    }
  };

  async play() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => undefined);
    }
    this.startDrone();
    // Resuming after a pause: never schedule into the past, or the backlog
    // would all fire at once.
    if (this.nextNoteAt < this.ctx.currentTime) {
      this.nextNoteAt = this.ctx.currentTime + 0.2;
    }
    if (this.timer === null) {
      this.schedule();
      this.timer = window.setInterval(this.schedule, 700);
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.linearRampToValueAtTime(0.72, now + FADE_SECONDS);
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
