# Background music

The invitation ships with **no audio file**, and does not need one.

When a guest chooses *Enter With Music*, the site generates its ambience in the
browser with the Web Audio API — a slow flute-like line over a soft drone, on a
five-note scale shared by Carnatic and Hindustani music. It is original, weighs
nothing, loops forever, and is deliberately neutral: no ceremony motif from
either tradition. The code is in `src/services/audioEngine.ts`.

## Using a real recording instead

1. Put a royalty-free instrumental here, e.g. `ambience.mp3`.
2. Point the slot at it:

   ```ts
   // src/config/media.ts
   audio: {
     src: withBase('audio/ambience.mp3'),
     credit: 'Track name — Artist (licence)',
   },
   ```

The generated ambience stays as the fallback: if the file is missing, blocked or
fails to decode, the site quietly plays the generated version instead of
throwing an error.

## Choosing a track

- Warm, nostalgic, cinematic. Soft flute, veena, light acoustic guitar, minimal
  piano, gentle percussion.
- Avoid music tied specifically to Hindu or Muslim ceremony, film songs, loud
  percussion, and anything you do not hold a licence for.
- Keep it under ~2 MB (96–128 kbps mono is plenty) and make sure it loops cleanly.
- Good sources: the Free Music Archive, Pixabay Music, and Uppbeat — always
  check the licence terms before publishing.
