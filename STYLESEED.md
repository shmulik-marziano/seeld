# STYLESEED.md — SEELD Design Lock (Brand system 2026-09)

> **This file is binding.** Re-read it at the start of every prompt that touches UI.
> It encodes the owner's brand system delivered 2026-09-15: the SeelD digital brand
> (deep green on ivory, Rubik) plus the illustrations and icons kit v1.1
> (`SeelD-Illustrations-Guide.pdf`, 12 pages). It replaces DNA v3 (navy/turquoise/gold,
> Frank Ruhl Libre/Heebo) in full. To change it, the owner must say so.

## Locked decisions

| Axis | Value |
|---|---|
| App type | Financial-services site (שילד ביטוח ופיננסים, Hebrew RTL): clear picture, documented decisions, guidance you can follow |
| Character | professional, measured, personal, orderly. Deep green and the new logos lead; bubbles, paths, layered landscape and leaves add life |
| Canvas | **Ivory `#FAF7EF`** page background. **White `#FFFFFF`** card surface. About 70% light surfaces, 20% deep green, 10% accents |
| Font | **Rubik** only, weights **400 and 700**. Fallback `Arial, sans-serif`. No second heading font, no mono font (figures use Rubik + `tabular-nums`) |
| Logo | The kit's PNG assets only: `/public/brand/logo.png` (Hebrew lockup: שילד + ביטוח ופיננסים, symbol on the left) and `/public/brand/logo-icon.png` (symbol crop). Never redrawn, stretched, recolored, shadowed or boxed. Clear space ≥ ¼ symbol height. On dark grounds the logo sits on an ivory card |
| Radius | card 16 · button 12 · field 10 |
| Tap target | ≥ 48px |
| Content width | 1200px (`max-w-brand`); wider only for data interfaces, with a reason |
| Gutters | 20px phone · ≥ 32px desktop |
| Spacing scale | 4 8 12 16 24 32 48 64 96 |
| Motion | short ease-out (0.15–0.25s), no springs, no looping background animation. `prefers-reduced-motion` respected everywhere |

## Palette (measured on ivory #FAF7EF)

```
green       #003D30   headings, primary text, primary actions, dark bands   (12.5:1)
green-hover #002B22
body        #24483C   paragraph text                                         (9.4:1)
text-2      #476356   secondary text, lead, labels                          (6.0:1)
faint       #8FA396   DECORATIVE ONLY — never for readable text
line        #CCD6CC   hairlines, borders · line-soft #E1E8E1 table rows

sage        #819B7D   secondary surfaces, illustration tone, dots — NOT for small text (3.1:1)
sage-light  #E8EDE5   light surfaces, callouts, bubbles
sand        #CBA064   small highlight, dots (decorative) · text: #8A6230 (4.9:1)
rust        #BD582D   small highlight, dots, destructive (decorative) · text: #9A4520 (6.1:1)

on green:   ivory #FAF7EF for primary text · #A9C4A5 (sage-on-green) for secondary (8.6:1)
pastels:    #E8EDE5 sage · #F1E7D6 sand · #DDE6DA mint   (bubbles, opacity 0.7–0.9)
tints:      #EEF2EC sage · #F5EEE0 sand                  (quote boxes)
```

Rule: an accent that fails contrast gets the `_TEXT` variant. Sage on ivory is never body or small text.
All tokens live in `src/lib/brand.ts` (legacy names NAVY/TURQ/GOLD… are aliases onto this palette);
component classes in `src/index.css`.

## Typography

| Role | Size |
|---|---|
| h1 | 48–56px desktop · 32–36 phone (`clamp(32px, 4.6vw, 56px)`), Rubik 700, line-height ≈1.15 |
| h2 section | 28–32 desktop · 24–28 phone |
| body | 16–18px, line-height ≈1.6–1.7 |
| helper | 14px minimum, in `text-2` or darker |

Headings start their block. Headings are Rubik 700 in deep green.

## Component library (use these, don't invent)

- **`.dna-page` + `.dna-circles`/`.dna-circ`** — ivory surface, at most 2–3 pastel bubbles per opening, never behind small text, fields, sums, tables or buttons; `pointer-events: none`.
- **`.dna-display`** — Rubik 700 heading.
- **`.btn-primary`** (green, ivory text) · **`.btn-secondary`** (green outline) · **`.btn-on-green`** / **`.btn-on-green-outline`** (on the green band). 48px min height, 12px radius.
- **`.link-rule`** — text link with a hairline underline rule.
- **`.field`** — white input, `#CCD6CC` border, 10px radius, green focus ring, `aria-invalid` turns the border rust. Every field has a visible `<label>`; required fields carry a rust asterisk.
- **`.dna-concept`** — white card, 16px radius, hairline border. `.dna-hover` adds a quiet lift.
- **`.dna-quote`** (+ `.gold` = sand, `.blue` = sage-light) — side-bar highlight box.
- **`table.dna-data`** — green header, zebra rows, `.num` cells LTR tabular.
- **`.dna-pill-item`** — sage-dot list rows. **`.dna-callout`** — sage-light note box.
- **`.dna-navy-band`** — the deep green CTA band: sand hairline on top, one soft sage bubble.
- **`.dna-warm-band`** — ivory→sand tint band (partner logo strip).
- **`.brand-dots` / `<BrandDots />`** — the three dots sage · sand · rust. Decorative motif, never a status, meter or confirmation.
- **`<Illustration name=… />`** (`src/components/brand/Illustration.tsx`) — the six kit illustrations from `/public/brand/illustrations/*-{480,960,1536}.webp`, 3:2, `object-fit: contain`, opaque ivory background, never cropped, flipped, filtered or made transparent. `priority` only above the fold; lazy otherwise. `alt=""` when the heading explains it; `describe` when it is content.
- **`<BrandIcon name=… />`** (`src/components/brand/BrandIcon.tsx`) — the 24 kit icons (24 grid, 1.75 stroke, round caps) mapped onto lucide glyphs; `currentColor`. 20–24 for navigation/actions, 32–40 for a service symbol. Icon-only buttons need `label`.
- **Elements** (`src/components/brand/Elements.tsx`) — `BubbleCorner`, `PathDivider`, `LeafCanopy`, `BalancedStones`, `OliveBranch`, `SignatureLandscape`. Decorative, `aria-hidden`, in page margins and transitions only.

## Illustration map (kit p.11) — dosage

| Asset | Where | How |
|---|---|---|
| `01-journey` | home hero · service opening | main art beside the headline and action |
| `02-family-protection` | health, life, family cover | service art or wide card |
| `03-saving-growth` | pension and savings | service art or related content |
| `04-retirement-horizon` | retirement planning | service art at the centre of the story |
| `05-clarity-decisions` | portfolio review 360, the process, meeting summary | medium art beside the explanation |
| `06-documents-service` | documents, requests, empty state in the personal area | small art beside the action |

Home: one main illustration + one or two secondary uses. Service page: the one matching art (property, vehicle, travel and business pages stay illustration-free and use a vector element). Article: choose by content; keep an existing explanatory image. Calculators and forms: inputs and results stay central, no full illustration. Never repeat a full landscape in every section.

Priority order on every screen: **understanding the service → the next action → readability → decoration.** If art pushes information down or stretches the phone view, shrink it.

## The central path

Every service leads to **בדיקת תיק 360** (`/#portfolio-review`, the lead form on the home page) and **תיאום פגישה** (`/contact`). Primary button = the page's own working action; secondary = the 360 review or the meeting. No button or link may point at a placeholder.

## HARD BANS

1. No eyebrow labels above headings, no section numbering ornaments, no single colored word inside a heading.
2. No stock photos, no 3D characters, no other flat illustration style mixed with the kit.
3. No emoji anywhere. No em-dash in UI copy. No English words inside a Hebrew sentence (a standalone Latin label such as a brand name is a label, not a sentence).
4. No invented figures: returns, savings, counts of clients, response times, testimonials, availability. Missing content → mark and stop.
5. No looping background animation, flashing, glass effects or heavy shadows. Grain filters at most whisper-level, never on illustrations.
6. Numbers, license, phones never break across lines: `white-space: nowrap` + `dir="ltr"` spans.
7. The old SeeID mark, Frank Ruhl Libre, Heebo, Geist Mono and the navy/turquoise/gold palette are retired. Do not reintroduce them.

## Regulatory (every page)

Footer must carry, verbatim:
- `שמוליק מרציאנו · סוכן ברישיון 138666`
- `האמור באתר מהווה שיווק פנסיוני ואינו מהווה ייעוץ פנסיוני או תחליף לייעוץ המתחשב בנתונים ובצרכים של כל אדם.`

## RTL rules (critical)

- `dir="rtl"` at the root; prefer logical properties (`margin-inline`, `padding-inline`).
- Numbers/English inside Hebrew text: `tabular-nums` + a pointed `dir="ltr"` span.
- Never flip the logo, people or leaves in RTL; check directional arrows separately (`arrow-left` points to "next" in RTL).
- After any layout change: render and LOOK (`node scripts/shot_brand.mjs <url> <dir> <routes…>`). Never trust code alone in RTL.

## Process gates

- Zero hardcoded off-palette hex in new work; tokens from `brand.ts` or the classes above.
- Body text ≥ 16px desktop; helper ≥ 14px; contrast AA (4.5:1) for text.
- Real loading/error/empty states on every interactive surface; forms validate per field, keep input after an error, block double submit, confirm only after the write succeeded.
- Full-route sweep before merge: zero page errors, zero horizontal overflow at 390 and 1440.
- Mobile first: verify 390px on every converted page. Check 360, 390, 768, 1440 and 200% zoom on key pages.

## Addendum 2026-09-17 · the owner's design mock

The owner's mock set (site, service page, process, knowledge hub, app screens) is the reference above the kit map where they differ:

- **Home opening art** = the circles-and-leaf composition with the three door cards (`src/components/brand/HeroComposition.tsx`), not the journey landscape. Landscapes stay for service and savings openings.
- **Cards are the grammar** for services, products and key points: white, hairline, radius 16, a line icon in a tinted disc (sage / sand / mint), title, one or two lines, arrow or rule link.
- **Numbers** in the brand triad (01 sage, 02 sand, 03 rust, 04 green) for steps.
- **No repeated ornament**: the three dots live only inside the illustrations. `BrandDots` is not used above headings.
- **Header**: five nav items; the personal area is an outlined round pill with the user glyph. Phone header: logo and menu only.
- **One primary action per opening** plus one rule link. Section titles are short; a trailing period is allowed ("כך עובדים יחד.").
