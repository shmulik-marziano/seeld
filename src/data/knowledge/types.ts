// Knowledge section: shared content types.
// Source: the agency's guide collection (November 2026 edition, 30 guides) and the
// pension-tax knowledge chapters; transcribed to the site's content rules and approved on
// the owner's behalf under his instruction of 2026-11-21. Figures as supplied by the
// owner and verified against the Tax Authority 2026 table; year label per TAX_YEAR.
//
// This module must stay dependency-free (no "@/" imports): data files that import it are
// bundled by Node scripts as well as by Vite.

export type GuideBlock =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "table"; caption: string; head: string[]; rows: string[][] }
  | { t: "callout"; kind: "attention" | "field" | "example"; title: string; text: string };

export type GuideCategoryKey =
  | "pension-employees"
  | "pension-self-employed"
  | "training-funds"
  | "retirement"
  | "family-wealth"
  | "family-business-insurance"
  | "pension-tax";

export interface GuideSource {
  /** Document or page title as published by the body, e.g. "חובת ביטוח פנסיוני לעובדים". */
  label: string;
  /** Public body or publisher, e.g. "כל־זכות", "רשות המסים". Never a recommendation. */
  publisher: string;
}

export interface Guide {
  /** Latin kebab-case, unique; equals the file name and the last URL segment. */
  slug: string;
  category: GuideCategoryKey;
  /** Visible h1. Digit-free. Not the registry title (that one carries " | SEELD"). */
  title: string;
  /** One or two sentences under the h1. Digit-free. */
  lead: string;
  /** Body in order. Figures only inside tables and "example" callouts, or in paragraphs
   *  that an "example" callout or a table caption labels as illustration. */
  blocks: GuideBlock[];
  sources: GuideSource[];
  /** Slugs of other guides to read next (1-2). Must resolve in the catalog. */
  further: string[];
  /** ISO date of the source check, shown nowhere in the body. */
  checked: string;
  /** Tax/figures year the amounts in this guide refer to; omit when the guide has none. */
  figuresYear?: number;
}

/** Visible label for a worked example. Used by the layout, never typed into bodies. */
export const EXAMPLE_LABEL = "דוגמה להמחשה";

/** Year label for every amount on the knowledge pages. The owner decides this value. */
export const TAX_YEAR = 2026;
