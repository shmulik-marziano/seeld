# STYLESEED.md — SEELD Design Lock (DNA v3)

> **This file is binding.** Re-read it at the start of every prompt that touches UI.
> It encodes the owner's uploaded design system (2026-07-07, seelddesignsystem.zip:
> DESIGN_DNA.md + template_base.html + logo_final.png) fused with the site's
> live-tech layer. The brief: **a large financial institution meets Silicon Valley.**
> To change it, the owner must say so.

## Locked decisions

| Axis | Value |
|---|---|
| App type | Financial-services site (SEELD, Hebrew RTL) — institutional trust + hi-tech aliveness |
| Skin | **SEELD DNA v3** — white canvas, navy/turquoise/gold, pastel circles, signature gradient bar |
| Source of truth | `template_base.html` from the owner's kit (tokens binding; A4 layout is PDF-only — web is responsive) |
| Fonts | Hebrew headings: **Frank Ruhl Libre 900** (h3: 700). Body: **Heebo** 300–700. Numbers & live-tech labels: **Geist Mono**, tabular. |
| Motion | **Snap** — 0.15–0.25s ease-out, no springs. `prefers-reduced-motion` respected everywhere. |
| Radius | 10–12px cards (`.dna-concept` 12px), 8–10px boxes, pills for chips only. |
| Logo | The SeeID mark only (colored dot arc + droplet + navy wordmark). No placeholder, no white box, no halo. |
| Signature | The 5px gradient bar (`.dna-gbar`) at the very bottom of every page. |

## Palette (measured contrast on white — use the right tier)

```
navy        #1D2D3D   headings, primary text, table headers, dark bands (14.05:1)
body        #3a4c5a   paragraph text (8.89:1)
muted       #5a6a78   lead/secondary text (5.57:1)
faint       #9aa6b1   DECORATIVE ONLY — 2.48:1. Never for text that must be read.
line        #E7EDF1   hairline rules · line-soft #EAEFF3 table rows

turquoise   #4E9D8F   accent: bars, dots, big stats (3.21:1 — ≥24px text / UI only)
turq-text   #356d60   turquoise SMALL text (5.99:1 AA)
gold        #D8A24A   accent surfaces/markers (3.66:1 — large/UI only) · text: #8a5a1e (5.9:1)
blue        #5b9fd0   secondary accent · text: #4a6fa5 (5.11:1)
coral       #d67a8a   gaps/negative values · text: #a04a5c (5.79:1)

pastels     #E1EAF1 (blue) · #F4EEE6 (peach) · #D3E4E5 (mint)   — circle backdrops, opacity 0.4–0.6
tints       #F4F8F7 (turq) · #FBF5EA (gold) · #F0F5FB (blue)    — quote-box surfaces
gradient    linear-gradient(90deg,#4E9D8F 0%,#5b9fd0 24%,#9a8fc0 48%,#e08a9a 70%,#e8a04e 86%,#d65a4e 100%)
```

Rule: brand color that fails contrast gets the `_TEXT` variant — POUR beats taste, always.
All tokens live in `src/lib/brand.ts`; component classes in `src/index.css` (`.dna-*`).

## Component library (from the kit — use these, don't invent)

- **`.dna-page` + `.dna-circles`/`.dna-circ`** — white surface, 2–4 absolute pastel circles per screen, opacity 0.4–0.6, z-0, content z-10. Circles never sit behind small text.
- **`.dna-display`** — Frank Ruhl Libre 900 headings. h1 clamp(34px,5vw,50px), h2 30–38px, h3 19px/700.
- **`.dna-quote`** (+ `.gold` / `.blue`) — side-bar highlight box: label (`.dna-ql`) + text (`.dna-qt`).
- **`.dna-concept`** — bordered card, 12px radius, faint navy shadow. Interactive cards add `.dna-hover`.
- **`table.dna-data`** — navy header, zebra rows, `.num` cells LTR tabular.
- **`.dna-pill-item`** — turquoise-dot list rows.
- **`.dna-callout`** — soft pastel-blue note box.
- **`.dna-gbar`** — the signature gradient bar. Bottom of every page.
- **Giant background numeral/letter** — Frank Ruhl 900, opacity 0.05, decorative corner. Sparingly.

## The live-tech layer (the Silicon Valley half — keep, recolored)

CountUp, LiveDot, LiveClock, MarketMarquee, DrawSpark survive — recolored to the DNA:
dots/accents turquoise `#4E9D8F`, standout figures turquoise or gold, mono labels in
Geist Mono at `muted` (#5a6a78) or stronger. They are functional signals (live data,
market returns, availability), never decoration. One live gesture per screen region.

## HARD BANS (AI tells — the owner's explicit list, enforced in QA)

1. **No eyebrow labels above headings.** A heading starts its block. (A corner
   `section-tag` far from the heading is allowed, sparingly, decorative-grade.)
2. **No section numbering** — no `01`, `02 /`, `STEP 03` ornaments. (A real form wizard
   may show progress in plain words, not ornamental numerals.)
3. **No single colored/italic word inside a heading** for "emphasis".
4. **No unrelated stock photos.** No photo? Use brand graphics (pastel circles, line art).
5. **No emoji anywhere** (UI, code, copy, commits) — lucide inline SVG or plain words.
6. **No em-dash in UI copy.** Use comma or period.
7. **No English words inside a Hebrew sentence.** Translate, or give the term its own
   standalone line/label. Standalone mono tags (a ticker band, "LIVE") are labels, not sentences.
8. Numbers/license/phones never break across lines: `white-space:nowrap` + `dir="ltr"` spans.

## Regulatory (every page)

Footer must carry, verbatim:
- `שמוליק מרציאנו · סוכן ברישיון 138666`
- `האמור באתר מהווה שיווק פנסיוני ואינו מהווה ייעוץ פנסיוני או תחליף לייעוץ המתחשב בנתונים ובצרכים של כל אדם.`

Never invent figures, returns, prices, or policy terms. Missing content → mark and stop.

## RTL rules (critical)

- `dir="rtl"` at the root; prefer logical properties (`margin-inline`, `padding-inline`).
- Numbers/English inside Hebrew text: `tabular-nums` + pointed `dir="ltr"` span.
- After any layout change: render and LOOK (Playwright screenshot). Never trust code alone in RTL.

## Process gates (unchanged discipline)

- Zero hardcoded off-palette hex in new work; tokens from `brand.ts` or `.dna-*` classes.
- Desktop body text ≥15px; real loading/error/empty states on every interactive surface.
- `python3 scripts/check_no_emoji.py` + `python3 scripts/contrast.py <fg> <bg>` for new pairs; AA minimum.
- Full-route Playwright sweep (zero page errors, zero horizontal overflow at 390/1440) before merge.
- Mobile first: most clients arrive on phones. Verify 390px on every converted page.
