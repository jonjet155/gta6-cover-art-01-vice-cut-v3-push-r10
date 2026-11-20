# VICE CUT — GTA 6 Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jonjet155/gta6-cover-art-01-vice-cut-v3-push-r10/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jonjet155/gta6-cover-art-01-vice-cut-v3-push-r10/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a GTA-style movie poster — a hero-grid one-sheet with a
huge sunset hero, a five-character ensemble, and a tight striped **VICE CUT**
wordmark — then export it as a PNG to share. Built for the
[make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## The poster

- **Hero grid:** one huge centre hero (face-forward, golden sunset light, rich
  golden sky) plus four character panels around it — five faces total, every
  face sharp with visible eyes, including one joyful laughing face.
- **Cast tags on the photos:** each panel carries its name + role on the photo
  itself, so the ensemble survives the thumbnail.
- **One solid wordmark:** VICE in solid white, CUT in neon pink-to-purple, tight
  tracking so the title reads as one word, spanning 92% of the cover width and
  overlapping the photos — no black zone below the grid. A neon slash cuts
  between the two words, never across a face.
- **Magazine furniture:** press-quote strip, thin gold frame, barcode + round
  seal, five gold stars, VOL. 06 mark, story ribbon and a tiny billing block —
  all readable at contact-sheet size.
- **Sunset grading on every panel:** warm sunset is the default; neon night,
  teal coast and ink mono are one click away. All five panels stay equally
  bright — no dim panel.

## The studio — 3 steps

1. **Drop your photos** — click a panel on the cover, then a sample photo (or
   upload your own from your machine; nothing is ever uploaded). Drag a photo
   to position it, zoom and pan to crop it. One button fills all five panels
   with one photo; another deals the samples across them.
2. **Pick a grade + poster style** — four grades, four poster styles (Hero
   Grid, Full-Bleed, Split, Framed).
3. **Words + export** — edit the title, the script line under the wordmark and
   the story ribbon, then export the PNG in **1080 × 1080**, **1080 × 1350**
   or **1920 × 1080** — exact dimensions, the same cover at every size.

Everything runs offline from static files under `app/` — no network requests,
no uploads. Fonts are Bebas Neue and Caveat (SIL Open Font License), shipped
under `app/fonts/`. The VC monogram logo is drawn in code.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json`. It refuses an oversize
screenshot, clears stale output before copying, and refuses a zero-byte
dossier.

## Photos

Sample photos are free-license portraits from Unsplash (Unsplash License,
free to use):

- Hero — Lucia, golden-hour portrait: https://unsplash.com/photos/1544005313-94ddf0286df2
- Nova, laughing in red: https://unsplash.com/photos/1494790108377-be9c29b29330
- Rae, neon portrait: https://unsplash.com/photos/1534528741775-53994a69daeb
- Jason, smiling portrait: https://unsplash.com/photos/1507003211169-0a1dd7228f2d
- Diego, portrait with hat: https://unsplash.com/photos/1539571696357-5a69c17a67c6
- Marcus, spare portrait: https://unsplash.com/photos/1500648767791-00dcc994a43e

No Rockstar Games logo, artwork or font is used anywhere in this entry — the
lettering, the logo and the layout are original work drawn in code.
