// SEELD design tokens — locked in STYLESEED.md (read it before changing).
// Brand system 2026-09 (SeelD digital brand + illustrations kit v1.1):
// deep green on ivory, sage / sand / rust as small accents, Rubik only.

/* ── Core palette (design-tokens: brand book) ── */
export const GREEN = "#203957";        // headings, primary text, primary actions, dark bands
export const GREEN_HOVER = "#162B45";  // primary action hover
export const SAGE = "#819B7D";         // secondary surfaces, illustration tone, decorative (never small text)
export const SAGE_LIGHT = "#DFE9DC";   // light surfaces, soft callouts
export const SAND = "#AD833E";         // small highlight (decorative)
export const RUST = "#BD582D";         // small highlight (decorative), destructive
export const IVORY = "#FAF7EF";        // page background
export const CARD = "#FFFFFF";         // card surface

export const TEXT_2 = "#55677C";       // secondary text (6.0:1 on ivory)
export const LINE = "#D9DEE4";         // hairline rules / borders
export const LINE_SOFT = "#E8E6DE";    // table row rules

/* Text tiers (measured on ivory #FAF7EF) */
export const BODY = "#2D435D";         // paragraph text (9.4:1)
export const MUTED = TEXT_2;           // lead/secondary text (6.0:1)
export const FAINT = "#8FA396";        // decorative-only labels — never for readable text
export const SAND_TEXT = "#7C5C22";    // sand for small text (4.9:1)
export const RUST_TEXT = "#9A4520";    // rust for small text (6.1:1)
export const SAGE_ON_GREEN = "#C5D3E2"; // light sage for small text on the green band (8.6:1 on #203957)

/* Light surfaces (the pastel tier of the kit) */
export const PASTEL_SAGE = "#DFE9DC";
export const PASTEL_SAND = "#F4E7C3";
export const PASTEL_MINT = "#D6E3EF";

/* Tinted quote-box surfaces */
export const TINT_SAGE = "#EEF2EC";
export const TINT_SAND = "#F5EEE0";

/* The three brand dots (sage · sand · rust) — decorative motif, never status */
export const DOTS = [SAGE, SAND, RUST] as const;

/* typography — Rubik only (400 / 700). No second heading font. */
export const SANS = "'Rubik', Arial, sans-serif";
export const DISPLAY = SANS;   // headings: Rubik 700
export const MONO = SANS;      // figures: Rubik with tabular-nums (no mono font in the system)

/* regulatory (must appear in the footer of every page) */
export const LICENSE_LINE = "שמוליק מרציאנו · סוכן ברישיון 138666";
export const REGULATORY_LINE =
  "האמור באתר מהווה שיווק פנסיוני ואינו מהווה ייעוץ פנסיוני או תחליף לייעוץ המתחשב בנתונים ובצרכים של כל אדם.";

/* shadows */
export const RING = "0 0 0 1px rgba(32, 57, 87,.08)";
export const CARD_SHADOW = "0 2px 12px rgba(32, 57, 87,0.05), 0 0 0 1px #DFE9DC";

/* ── Compatibility aliases (previous DNA v3 names) — every page compiles unchanged,
      and recolors to the new system through these. ── */
export const NAVY = GREEN;
export const TURQ = SAGE;
export const TURQ_TEXT = TEXT_2;
export const GOLD = SAND;
export const GOLD_TEXT = SAND_TEXT;
export const BLUE = SAGE;
export const BLUE_TEXT = TEXT_2;
export const CORAL = RUST;
export const CORAL_TEXT = RUST_TEXT;
export const PASTEL_BLUE = PASTEL_SAGE;
export const PASTEL_PEACH = PASTEL_SAND;
export const TINT_TURQ = TINT_SAGE;
export const TINT_GOLD = TINT_SAND;
export const TINT_BLUE = PASTEL_SAGE;
export const GRADIENT_BAR = `linear-gradient(90deg,${SAGE} 0%,${SAGE} 100%)`;

export const INK = GREEN;
export const BONE = IVORY;
export const PINE = GREEN;
export const BRONZE = MUTED;
export const SERIF = DISPLAY;
export const TINT = TINT_SAGE;
export const CHIP_ORANGE = SAND_TEXT;
export const CHIP_GREEN = TEXT_2;
export const CHIP_YELLOW = SAND_TEXT;
