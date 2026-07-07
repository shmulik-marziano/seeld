// SEELD design tokens — locked in STYLESEED.md (read it before changing).
// DNA v3: institutional navy/turquoise/gold from the owner's design system
// (template_base.html is the source of truth), fused with the live-tech layer.

/* ── DNA v3 core palette ── */
export const NAVY = "#1D2D3D";        // headings, primary text, table headers, dark bands
export const TURQ = "#4E9D8F";        // accent: bars, dots, large stats (3.2:1 — large/UI only)
export const TURQ_TEXT = "#356d60";   // turquoise for small text (5.99:1 AA)
export const GOLD = "#D8A24A";        // accent surfaces/markers (decorative)
export const GOLD_TEXT = "#8a5a1e";   // gold for small text (5.9:1 AA)
export const BLUE = "#5b9fd0";        // secondary accent (decorative)
export const BLUE_TEXT = "#4a6fa5";   // blue for small text (5.11:1 AA)
export const CORAL = "#d67a8a";       // gaps/negative (decorative)
export const CORAL_TEXT = "#a04a5c";  // coral for small text (5.79:1 AA)

export const BODY = "#3a4c5a";        // paragraph text on white (8.89:1)
export const MUTED = "#5a6a78";       // lead/secondary text (5.57:1)
export const FAINT = "#9aa6b1";       // decorative-only labels (2.48:1 — never for readable text)
export const LINE = "#E7EDF1";        // hairline rules
export const LINE_SOFT = "#EAEFF3";   // table row rules

/* pastel circle surfaces */
export const PASTEL_BLUE = "#E1EAF1";
export const PASTEL_PEACH = "#F4EEE6";
export const PASTEL_MINT = "#D3E4E5";

/* tinted quote-box surfaces */
export const TINT_TURQ = "#F4F8F7";
export const TINT_GOLD = "#FBF5EA";
export const TINT_BLUE = "#F0F5FB";

/* the signature gradient bar (pixel-sampled from the source) */
export const GRADIENT_BAR =
  "linear-gradient(90deg,#4E9D8F 0%,#5b9fd0 24%,#9a8fc0 48%,#e08a9a 70%,#e8a04e 86%,#d65a4e 100%)";

/* typography */
export const DISPLAY = "'Frank Ruhl Libre', 'Heebo', serif"; // Hebrew headings, 900/700
export const SANS = "'Heebo', sans-serif";                   // body
export const MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace"; // live-tech layer

/* regulatory (must appear in the footer of every page) */
export const LICENSE_LINE = "שמוליק מרציאנו · סוכן ברישיון 138666";
export const REGULATORY_LINE =
  "האמור באתר מהווה שיווק פנסיוני ואינו מהווה ייעוץ פנסיוני או תחליף לייעוץ המתחשב בנתונים ובצרכים של כל אדם.";

/* shadows */
export const RING = "0 0 0 1px rgba(29,45,61,.08)";
export const CARD_SHADOW = "0 2px 12px rgba(29,45,61,0.05), 0 0 0 1px #E1EAF1";

/* ── Legacy aliases (previous skin) — kept so unconverted pages compile.
      Remove after the DNA v3 rollout completes. ── */
export const INK = NAVY;
export const BONE = "#ffffff";
export const PINE = NAVY;
export const BRONZE = MUTED;
export const SERIF = DISPLAY;
export const TINT = "#F7FAFB";
export const CHIP_ORANGE = GOLD_TEXT;
export const CHIP_GREEN = TURQ_TEXT;
export const CHIP_YELLOW = "#8a5a1e";
