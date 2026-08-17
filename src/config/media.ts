/**
 * Replaceable media slots.
 *
 * Every slot is `null` by default, and every component that consumes one falls
 * back to original illustration/typography — so the invitation never shows a
 * stock photograph of somebody else's wedding.
 *
 * To add real photographs later:
 *   1. Drop the files into `public/images/` (e.g. `public/images/couple.jpg`)
 *   2. Point the slot at them with `withBase('images/couple.jpg')`
 * No layout code needs to change.
 */

/** Resolves a path inside `public/` against the deployed base URL. */
export const withBase = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export interface ImageSlot {
  src: string;
  /** Describe the people and the moment — this is read aloud by screen readers. */
  alt: string;
  /** Optional focal point, e.g. '50% 30%', for art-directed cropping. */
  position?: string;
}

export interface MediaConfig {
  /** Wide photograph behind the hero. Portrait-safe crops recommended. */
  hero: ImageSlot | null;
  /** Portrait of the couple, shown in the invitation message section. */
  couple: ImageSlot | null;
  /** Optional photographs woven into "Two Roots. One Story." */
  story: {
    bride: ImageSlot | null;
    groom: ImageSlot | null;
  };
  /** Optional closing gallery. Leave empty to hide the gallery entirely. */
  gallery: ImageSlot[];
  /**
   * Background music. Leave `src` as `null` to use the built-in generated
   * ambience (original, weightless, loops forever). To use a real recording,
   * drop a royalty-free instrumental at `public/audio/ambience.mp3` and set
   * `src: withBase('audio/ambience.mp3')`.
   */
  audio: {
    src: string | null;
    credit: string;
  };
}

export const media: MediaConfig = {
  hero: null,
  couple: null,
  story: {
    bride: null,
    groom: null,
  },
  gallery: [],
  audio: {
    src: withBase('audio/ambience.mp3'),
    credit: 'Thattathin Marayathu — instrumental theme.',
  },
};
