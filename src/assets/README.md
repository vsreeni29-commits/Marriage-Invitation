# Where the artwork lives

There is no folder of image files here, and that is deliberate.

Every decorative element on this invitation — the emblem, the kolam line-work,
the geometric star ornament, the jasmine, the palm fronds, the arches, the
dividers, the map — is **drawn in code**, as SVG generated from the geometry
helpers in `src/utils/geometry.ts`. Nothing is traced from an existing motif,
nothing is a stock asset, and the whole ornamental system adds no image weight
to the page at all. It also means every motif is resolution-independent and
recolourable from `src/styles/tokens.css`.

| What                                          | Where                                    |
| --------------------------------------------- | ---------------------------------------- |
| Emblem, kolam, geometric star, jasmine, palm, arches, dividers, petals | `src/components/ornaments/Ornaments.tsx` |
| The maths behind every motif                  | `src/utils/geometry.ts`                  |
| The scroll-driven cultural morph              | `src/components/CulturalFusion.tsx`      |
| Kasavu foil on the scratch card (canvas)      | `src/components/DateScratchReveal.tsx`   |
| Illustrated venue map                         | `src/components/Venue.tsx`               |
| Colour, type and spacing tokens               | `src/styles/tokens.css`                  |
| Background music — the score                  | `src/services/composition.ts`            |
| Background music — the synthesis              | `src/services/audioEngine.ts`            |

## Files that *are* assets

| Asset                | Location                        | Regenerate with            |
| -------------------- | ------------------------------- | -------------------------- |
| WhatsApp/OG image    | `public/og-image.png`           | `node scripts/generate-og.mjs` |
| Favicons             | `public/favicon.svg`, `favicon-96.png`, `apple-touch-icon.png` | same script |
| Photographs (yours)  | `public/images/` → see its README | —                        |
| Music file (optional)| `public/audio/` → see its README  | —                        |

`scripts/generate-og.mjs` reuses the same emblem geometry as the site, so the
WhatsApp preview and the invitation are unmistakably the same object.
