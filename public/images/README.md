# Photographs

Drop image files here and point the matching slot in `src/config/media.ts` at them.
No layout code needs to change — every slot has a decorative fallback, which is
what the site uses while these are empty.

| Slot            | Suggested file      | Recommended size            | Notes                                       |
| --------------- | ------------------- | --------------------------- | ------------------------------------------- |
| `hero`          | `hero.jpg`          | 1600 × 2000, portrait-safe  | Sits behind the arch at ~40% opacity        |
| `couple`        | `couple.jpg`        | 1200 × 1500 (4:5)           | Shown beside the invitation message         |
| `story.bride`   | `rinsha.jpg`        | 600 × 600 square            | Rendered as a circle, so keep faces centred |
| `story.groom`   | `sreeni.jpg`        | 600 × 600 square            | Same                                        |
| `gallery[]`     | `gallery-01.jpg` …  | 1200 px on the long edge    | Leave the array empty to hide the gallery   |

## Example

```ts
// src/config/media.ts
hero: {
  src: withBase('images/hero.jpg'),
  alt: 'Rinsha and Sreeni on the terrace at home in Chennai',
  position: '50% 35%',
},
```

## Before you commit

- Export at ~80% JPEG quality, or use WebP/AVIF — guests will open this on mobile data.
- Keep each file under ~300 KB.
- Write a real `alt` description: it is read aloud to guests using a screen reader.
