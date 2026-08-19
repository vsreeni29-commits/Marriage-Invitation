# Rinsha & Sreeni — Wedding Invitation

An interactive invitation for the wedding reception of **Rinsha & Sreeni**,
Thursday 17 September 2026, at Sree Gupta Bhavan – SgB, Chennai.

Two families, two states and two traditions meet here: Rinsha's Muslim family
from Kerala, Sreeni's Hindu family from Tamil Nadu. The site is built around
that idea rather than decorated with it — a Tamil kolam line and a geometric
star ornament begin apart, travel toward each other, and resolve into a single
emblem that belongs to neither tradition alone. That emblem then carries the
rest of the invitation.

**Live:** https://vsreeni29-commits.github.io/Marriage-Invitation/

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built site locally
npm run typecheck  # TypeScript, no emit
```

Node 20 or newer.

---

## Deployment

### GitHub Pages (current)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.

One-time setup, in the repository: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The first push to `main` after that publishes to
`https://<user>.github.io/Marriage-Invitation/`.

The base path matters on Pages, because the site is served from a subdirectory.
It defaults to `/Marriage-Invitation/` and is set in `vite.config.ts`, and the
workflow passes it explicitly as `VITE_BASE`.

### Custom domain, later

When the domain is ready:

1. **Build at the root path.** Set `VITE_BASE: /` in the workflow (or run
   `VITE_BASE=/ npm run build`).
2. **Point the domain at the host.** On Pages: add the domain under
   Settings → Pages, and add a `public/CNAME` file containing just the domain so
   it survives redeploys.
3. **Update the canonical and preview URLs**, which are absolute and cannot be
   inferred at build time:
   - `src/config/weddingConfig.ts` → `site.url`
   - `index.html` → `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`

   `og:image` **must** be an absolute `https://` URL or WhatsApp will not show
   the preview card.

### Vercel / Netlify

Both work with no configuration beyond the base path: build command
`npm run build`, publish directory `dist`, and an environment variable
`VITE_BASE=/` (these hosts serve from the root). Then update the three URLs
above.

---

## What's in it

| Section | What it does |
| --- | --- |
| **Opening** | Kolam and geometric star draw in from opposite sides, converge, and become the emblem. Ends in a choice: *Enter With Music ♪* or *Enter Quietly*. Plays once per session. |
| **Hero** | Names inside an arch, drifting jasmine, the date, and a scroll cue. |
| **Invitation** | The written invitation, and the two journeys becoming one. |
| **Two Roots. One Story.** | Rinsha/Kerala and Sreeni/Tamil Nadu as two cards, joined by an ornamental thread that grows as you scroll. |
| **Where the Patterns Meet** | The signature morph: kolam → geometry → bloom → emblem, driven by scroll position, with a four-part narration. |
| **A Date Worth Remembering** | Scratch the kasavu-gold foil (mouse, touch or pen). Auto-completes at 55%. *Reveal Date* does the same in one tap. |
| **Countdown** | Live countdown to 6:00 PM IST, correct from any timezone. Hands over to a celebration message at zero, and a keepsake line afterwards. |
| **Reception** | Date, time, venue, and *Add to Calendar* (`.ics` download + a Google Calendar link). |
| **Venue** | Illustrated map card and a *Get Directions* button straight to Google Maps. |
| **Blessing Garden** | Guests leave a message; each one becomes a jasmine bloom in a shared garden, with the words readable underneath. |
| **RSVP** | Yes/no, name, a guest-count stepper, an optional note, validation, loading and success states. |
| **Closing** | Thanks, the emblem, and *அன்புடன் · സ്നേഹത്തോടെ · With Love*. |

Plus a persistent music toggle, a share button, a scroll-progress rule and a
small floating menu.

---

## Editing the details

Everything about the event lives in **`src/config/weddingConfig.ts`** — names,
date, times, timezone, venue, maps link, and the metadata used for sharing.
Nothing in `src/components` hardcodes any of it. Change it there and it changes
everywhere, including the calendar file and the structured data.

If you change the date or venue, also update the copies that cannot read from
TypeScript: the `<noscript>` block and the JSON-LD in `index.html`.

**Photographs** go in `public/images/` and are wired up in
`src/config/media.ts` — see `public/images/README.md`. Until then the site uses
its own illustration rather than stock photographs of other people.

**Music** is an original instrumental generated in the browser: a plucked veena
carrying the tune, a soft flute in long tones above it, gentle hand percussion
keeping the pulse, and a tanpura-style drone underneath. The scale is Mohanam /
Bhoopali, shared by Carnatic and Hindustani music. Two sections, twenty-eight
bars, 131 notes in the veena line — a full cycle runs about thirty-nine seconds
and loops without a seam.

- **The score** is `src/services/composition.ts` — notes, chords, drum pattern.
  Every voice sums to the same 84 beats, so the parts can never drift apart.
- **The synthesis** is `src/services/audioEngine.ts`. The veena is a single
  oscillator using a `PeriodicWave` built from a plucked string's harmonic
  series, with a filter that closes as the note rings, so the tone darkens the
  way a real string does. Notes that leap glide into pitch — the gamaka that
  makes it sound like a veena rather than a harp.

To hear it outside a browser:

```bash
node scripts/preview-music.mjs preview.wav          # 22 kHz, small
PREVIEW_RATE=44100 PREVIEW_LOOPS=3 node scripts/preview-music.mjs preview.wav
```

That script reads the score straight out of `composition.ts`, so the notes can
never drift from the site; only the synthesis is duplicated, and it mirrors the
engine closely enough that the offline render and the browser measure within a
few percent of each other.

To use a real recording instead, drop a licensed file in `public/audio/` and
point `media.audio.src` at it; see `public/audio/README.md`. The generated
version stays as the fallback if the file is missing or fails to play.

**The share image** is regenerated with `node scripts/generate-og.mjs`
(needs `npm i -D sharp` and the Cormorant Garamond / Inter fonts installed
locally). The committed PNG is fine as-is unless the artwork changes.

---

## Architecture

```
src/
  components/          one file per section, plus ornaments/ and ui/
    ornaments/         the entire decorative vocabulary, drawn in SVG
    ui/                Section wrapper, ErrorBoundary
  config/              weddingConfig.ts (source of truth), media.ts (image
                       slots), backend.ts (where responses are stored)
  context/             MusicContext — owns the single audio instance
  hooks/               useCountdown, useReveal, useScrollProgress, useReducedMotion
  services/            persistence behind an interface, + the audio engine
  styles/              tokens.css, base.css, sections.css
  utils/               geometry.ts, calendar.ts, share.ts
scripts/               generate-og.mjs, preview-music.mjs, apps-script/Code.gs
public/                og-image.png, favicons, images/, audio/
```

**Type:** three voices, deliberately. **Pinyon Script** is used for exactly one
thing — the couple's names — so calligraphy stays special and never gets in the
way of anything a guest has to read. **Cormorant Garamond** carries section
titles, dates and the emotional lines. **Jost** handles body copy, forms and
buttons. Tamil and Malayalam use Noto Serif faces, subsetted to the handful of
characters actually used.

**Stack:** React 18 + TypeScript + Vite. No UI framework, no animation library,
no state library — the whole thing is ~65 KB of gzipped JavaScript and one CSS
file. Animation is CSS plus `IntersectionObserver`, and scroll-linked motion is
a `requestAnimationFrame`-throttled measurement, so nothing fights the guest for
control of the page.

### Connecting the Google Sheet

RSVPs and blessings land as rows in a Google Sheet you own — the spreadsheet
*is* the database. Nothing to pay for, nothing that pauses when idle, and
"download the guest list as Excel" is File → Download → .xlsx.

Until an endpoint is configured everything stays in the guest's own browser, so
the site works locally and in previews without any setup.

**Setup, about five minutes:**

1. Create a Google Sheet. Name it whatever you like — the tabs are created
   automatically on the first response.
2. **Extensions → Apps Script**. Delete the placeholder, paste the contents of
   [`scripts/apps-script/Code.gs`](scripts/apps-script/Code.gs).
3. Replace `SHARED_SECRET` at the top with a long random string. Save.
4. **Deploy → New deployment → Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**  ← required; the site calls it without login
   - Deploy, approve the permission prompt, and copy the `/exec` URL.
5. In `src/config/backend.ts`, set `sheetsEndpoint` to that URL and
   `sharedSecret` to the same string from step 3.
6. Commit and push. Send yourself a test RSVP and check the sheet.

Two tabs appear: **RSVPs** (timestamp, name, attending, guests, note) and
**Blessings** (timestamp, name, message). Timestamps are IST.

> **On the shared secret:** it ships to the browser, so anyone viewing source
> can read it. It is a spam deterrent, not a security control. The real
> protection is that the endpoint can only ever append rows to two tabs of one
> spreadsheet, and the script clamps and truncates everything it receives.
> There is also a hidden honeypot field in both forms that bots fill in and
> people never see.
>
> If you later want stricter control, put a serverless function in front of the
> endpoint and keep the secret server-side.

**After a redeploy of the Apps Script**, use *Deploy → Manage deployments →
edit → New version*, which keeps the same `/exec` URL. Creating a *new*
deployment issues a different URL and you would have to update the config.

**Keeping it quick.** A Web App nobody has called for a while is cold, and the
first guest to arrive waits several seconds while Google starts it — long
enough that the garden reads as empty rather than slow. The site covers for
this (it paints the last known blessings immediately and retries a slow read),
but the cure is one trigger: **Apps Script → Triggers ⏰ → Add trigger →
function `keepWarm`, Time-driven, Minutes timer, every 5 minutes.** Costs
nothing, and every visitor then gets a warm script.

### Any other backend

The UI talks only to the interfaces in `src/services/types.ts`, so Supabase,
Firebase or a REST API is one more adapter and two lines in
`src/services/index.ts`:

```ts
export const blessingService: BlessingService = createSupabaseBlessingService(supabase);
export const rsvpService: RsvpService = createRestRsvpService('/api/rsvp');
```

Same method signatures, same `ServiceError` — no component changes. Keep
credentials out of the client: use a serverless function, or a publishable key
with row-level security.

---

## Accessibility

Built in from the start, not retrofitted:

- Semantic landmarks, one `h1`, a correct heading order, and a skip link.
- Everything reachable and operable by keyboard; visible focus throughout.
- The scratch card is an enhancement — the date sits in the DOM underneath it,
  so it is readable by screen readers and selectable, and *Reveal Date* is a
  one-tap equivalent.
- All decorative SVG is `aria-hidden`; the countdown exposes a readable
  sentence instead of four separate numbers.
- Forms have real labels, `aria-invalid`, and errors announced politely.
- `prefers-reduced-motion` removes drifting petals, the opening animation, the
  route and pulse loops, and lays the morph narration out as plain text.
- Tap targets are at least 44–48 px; the layout holds from 320 px to 2560 px.

## Privacy

No analytics, no tracking pixels, no advertising scripts, no cookies, no
embedded third-party map frame. External requests are limited to Google Fonts
and — once configured — the Apps Script endpoint that writes to your own
spreadsheet. Until that is set up, guest messages and RSVPs never leave the
guest's own browser.

## Progressive enhancement

The names, date, time, venue and directions are plain markup in their own
sections — an `ErrorBoundary` around each interactive piece means a failure in
the scratch card, the garden or the countdown costs a guest nothing they came
for. With JavaScript disabled entirely, the `<noscript>` block in `index.html`
still gives the essentials and a working directions link.

## Browser support

Tested on Chromium (desktop and emulated Android), at 320 px, 390 px, 740 px
landscape, 1280 px and 2560 px. Uses Pointer Events, `IntersectionObserver`,
`clamp()` and the Web Audio API — all supported in current Chrome, Safari,
Firefox and Edge, with fallbacks where a feature may be blocked (clipboard,
Web Share, canvas, `localStorage`, audio).
