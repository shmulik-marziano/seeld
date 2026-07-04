# STYLESEED.md — SEELD Design Lock

> **This file is binding.** Re-read it at the start of every prompt that touches UI.
> It encodes decisions made by the owner on 2026-07-04 through the StyleSeed wizard
> and a mockup review. Do not drift from it. To change it, the owner must say so.

## Locked decisions

| Axis | Value |
|---|---|
| App type | Financial-services marketing site (SEELD, Hebrew RTL) |
| Skin | **SEELD Mono** — Vercel-derived monochrome (`design-systems/library/vercel/DESIGN.md`) |
| Signature | **The Flim gesture**: colossal SEELD wordmark as the homepage hero, with small "live" people-chips and a mini statement card over it |
| Key color | **None.** Full greyscale. The only color on a page is *people & status*: live-chip colors (`#e8890c` / `#1f9d55` / `#d9a400`) on collaboration chips, and severity colors on real statuses. Never decorative. |
| Font | **Heebo only** (400 / 500 / 600 — no 700+ in UI). Numbers & technical labels: **Geist Mono** (`'Geist Mono', ui-monospace, monospace`), tabular. |
| Motion seed | **Snap** — instant, decisive. Durations 0.15–0.25s, ease-out, no springs/bounce. Respect `prefers-reduced-motion`. |
| Radius | One personality: **6px** buttons/inputs, **8px** cards. Pills only for chips/badges. |
| Shadows | Vercel stack only, ≤8% opacity: border `0 0 0 1px rgba(0,0,0,.08)`; card `0 0 0 1px rgba(0,0,0,.08), 0 2px 2px rgba(0,0,0,.04), 0 8px 8px -8px rgba(0,0,0,.04), 0 0 0 1px #fafafa`. Shadow-as-border replaces CSS borders on cards. |
| Spacing | 8px grid. Section padding 80–120px desktop, ~48px mobile. |

## Greyscale ramp (the entire palette)

```
ink      #171717   headings, primary text, dark buttons/bands (never #000)
body     #4d4d4d   paragraph text on white
muted    #5c5c5c   secondary labels
faint    #6e6e6e   captions, footnotes, mono tags (AA-safe: 5.1:1 on white)
line     #ebebeb   solid hairlines
tint     #fafafa   subtle surface, inner card ring, light text on ink
bg       #ffffff   the canvas (all sections white; separation by hairlines, not bg changes)
```

Source of truth in code: `src/lib/brand.ts`. Tokens: `tokens/seeld.tokens.json` (DTCG).

## Typography rules

- Display/headings: Heebo 600, negative tracking (−0.02em to −0.045em, larger = tighter).
- Body: 16px minimum on desktop (18–20px for ledes), line-height 1.7–1.8, color `body`.
- Captions/labels may go smaller, `faint`, mono for technical tags (`01 · REVIEW` style).
- All numbers that can change: Geist Mono, `font-variant-numeric: tabular-nums`, `dir="ltr"`.

## Hard rules (quality gate — check before showing anything)

1. One accent law: zero decorative color. People-chips and real status only.
2. `#171717` not `#000`; `#fafafa`/`#ffffff` canvas.
3. Desktop body ≥16px.
4. No emoji icons, no Lucide-in-a-pale-chip, no colored left-border strips.
5. No repeated identical card rows — ruled lists and varied section archetypes.
6. No em-dashes in UI copy. Short, specific sentences. No marketing filler.
7. Real loading / error / empty states on every interactive surface.
8. Contrast: run `python3 scripts/contrast.py <fg> <bg>` for any new pair; AA minimum.
9. Taste: `python3 scripts/lint_taste.py <file>` on new pages; fix real findings.
10. RTL: logical properties; test at 1440 and 390.

## Reference material in this repo

- `design-systems/library/vercel/DESIGN.md` — the base skin spec (shadow stacks, type scale).
- `taste/design-taste.md` — anti-slop doctrine (banned defaults).
- `CLAUDE.md` — agent persona + request router (ux-ui-agent-skills v2.4.0).
- Approved mockup: scratchpad `mockup-d-flim.html` (session 2026-07-04).
