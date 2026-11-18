// Investor risk-level characterisation: scoring and track matching. Pure functions, no React and no
// network, so the page computes everything in the browser and the rules are unit-tested.
// Spec: docs/product/RISK-PROFILE.md (sections 3 and 5).

export type RiskLevel = "low" | "medium" | "high";
export const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"];

export const QUESTION_IDS = ["sleep_drop", "drop_reaction", "stability_vs_growth", "loss_vs_miss"] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];
/** Score per question, 0..3. Missing keys mean "not answered yet". */
export type RiskAnswers = Partial<Record<QuestionId, number>>;

export type Guardrail = "forced_low" | "capped_medium" | null;

export interface RiskResult {
  /** sum of the four scores, 0..12 (never shown on screen) */
  sum: number;
  /** level from the sum alone */
  baseLevel: RiskLevel;
  /** level after the conservative guardrail (downgrade only) */
  level: RiskLevel;
  /** which guardrail lowered the level, or null when the sum decided */
  guardrail: Guardrail;
}

const isScore = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3;

/** Sum thresholds: 0-4 low, 5-7 medium, 8-12 high. */
export function levelForSum(sum: number): RiskLevel {
  return sum <= 4 ? "low" : sum <= 7 ? "medium" : "high";
}

/** True when every question has a valid 0..3 score. */
export function isComplete(answers: RiskAnswers): boolean {
  return QUESTION_IDS.every((id) => isScore(answers[id]));
}

/**
 * The result, or null while any answer is missing or out of range (no partial result).
 * Guardrails only lower the level: a "move everything" reaction forces low; a "move part" reaction,
 * or "I will not sleep", caps the level at medium.
 */
export function scoreRisk(answers: RiskAnswers): RiskResult | null {
  if (!isComplete(answers)) return null;
  const sleep = answers.sleep_drop as number;
  const react = answers.drop_reaction as number;
  const sum = QUESTION_IDS.reduce((acc, id) => acc + (answers[id] as number), 0);
  const baseLevel = levelForSum(sum);
  let level: RiskLevel = baseLevel;
  let guardrail: Guardrail = null;
  if (react === 0) {
    level = "low";
    if (baseLevel !== "low") guardrail = "forced_low";
  } else if ((react === 1 || sleep === 0) && baseLevel === "high") {
    level = "medium";
    guardrail = "capped_medium";
  }
  return { sum, baseLevel, level, guardrail };
}

// ───────────────────────────── track matching ─────────────────────────────

/** The fields of a returns-board row (cma_board via useCmaBoard) that matching and display need. */
export interface TrackRow {
  fund_name: string;
  track: string;
  stock_pct: number | null;
  board_product?: string;
  total_assets?: number | null;
}

export type TrackClass = RiskLevel | "age" | "excluded" | "unmatched";

/** Normalises Hebrew punctuation variants (gershayim, geresh, smart quotes) and whitespace. */
export const normName = (s: string | null | undefined): string =>
  String(s ?? "").replace(/[״“”]/g, '"').replace(/[׳’]/g, "'").replace(/\s+/g, " ").trim();

const EXCLUDED_KEYS = new Set(["guaranteed", "participating", "self_managed", "annuity"]);
const AGE_KEYS = new Set(["age_under_50", "age_50_60", "age_over_60"]);
const LOW_KEYS = new Set(["money_market", "bonds", "bonds_tradable", "credit_bonds", "risk_low"]);
const HIGH_FIXED_KEYS = new Set(["sp500", "nasdaq", "risk_high"]);
const INDEX_KEYS = new Set(["index", "index_tracking"]);
const MID_DEFAULT_KEYS = new Set(["general", "combined_tradable", "halacha"]);
const HIGH_DEFAULT_KEYS = new Set(["stocks", "stocks_tradable", "index", "index_tracking", "foreign", "sustainability"]);

const EXCLUDE_NAME = /קצבה לזכאים|מקבלי קצבה|\bIRA\b|קרן [יטח]'|מרכזית ל(פיצויים|פצויים|פציויים)|תקציבית|ניהול אישי/u;
const NO_STOCKS = /ללא מניות/u;
const UP_TO_STOCKS = /עד (\d+)% ?מניות/u;
const BONDS = /אג"?ח/u;
const STOCKS = /מניות/u;
const AGE_RE = /עד 50|50 ומטה|50 ?(עד|-|–) ?60|60 ומעלה/u;
const LOW_RE = /ללא מניות|עד \d+% ?מניות|כספי|שקלי|סולידי/u;
const HIGH_RE = /מניות|S&P|500|נאסד|NASDAQ|חו"ל/u;
const MID_RE = /כללי|משולב|גמיש|הלכ/u;

/** Stock-exposure band of the board: up to 25 low, above 25 up to 60 medium, above 60 high. */
export function levelForStockPct(pct: number): RiskLevel {
  return pct <= 25 ? "low" : pct <= 60 ? "medium" : "high";
}

/** Classifies one track. The first rule that applies wins (spec section 5, rules 1-12). */
export function classifyTrack(row: TrackRow): TrackClass {
  const key = String(row.track ?? "");
  const name = normName(row.fund_name);
  // 1-2: not shown (closed to private joiners, self-managed, or for existing annuitants)
  if (EXCLUDED_KEYS.has(key)) return "excluded";
  if (EXCLUDE_NAME.test(name)) return "excluded";
  // 3: age-dependent default tracks: a separate note, no level
  if (AGE_KEYS.has(key)) return "age";
  // 4: the name caps the stock exposure
  if (NO_STOCKS.test(name)) return "low";
  const cap = name.match(UP_TO_STOCKS);
  if (cap && Number(cap[1]) <= 25) return "low";
  // 5: bond-index trackers filed under index
  if (INDEX_KEYS.has(key) && BONDS.test(name) && !STOCKS.test(name)) return "low";
  // 6-8: level fixed by the track definition
  if (LOW_KEYS.has(key)) return "low";
  if (key === "risk_mid") return "medium";
  if (HIGH_FIXED_KEYS.has(key)) return "high";
  // 9: the reported stock exposure
  if (typeof row.stock_pct === "number" && Number.isFinite(row.stock_pct)) return levelForStockPct(row.stock_pct);
  // 10-11: family defaults when there is no figure
  if (MID_DEFAULT_KEYS.has(key)) return "medium";
  if (HIGH_DEFAULT_KEYS.has(key)) return "high";
  // 12: last resort, name keywords
  if (AGE_RE.test(name)) return "age";
  if (LOW_RE.test(name) || (BONDS.test(name) && !STOCKS.test(name))) return "low";
  if (HIGH_RE.test(name)) return "high";
  if (MID_RE.test(name)) return "medium";
  return "unmatched";
}

const byAssetsDesc = (a: TrackRow, b: TrackRow) => {
  const av = a.total_assets, bv = b.total_assets;
  const an = av === null || av === undefined || !Number.isFinite(av);
  const bn = bv === null || bv === undefined || !Number.isFinite(bv);
  if (an && bn) return normName(a.fund_name).localeCompare(normName(b.fund_name), "he");
  if (an) return 1;
  if (bn) return -1;
  return (bv as number) - (av as number);
};

/**
 * Rows of one product that fall in the given class, largest by assets first (never by return).
 * `limit` caps the list; `total` is the full count before the cap.
 */
export function tracksFor<T extends TrackRow>(rows: readonly T[], cls: TrackClass, product: string, limit = 6): { rows: T[]; total: number } {
  const all = rows.filter((r) => r.board_product === product && classifyTrack(r) === cls).sort(byAssetsDesc);
  return { rows: all.slice(0, limit), total: all.length };
}

/** Count of rows per product in the given class (for the product chips). */
export function countByProduct(rows: readonly TrackRow[], cls: TrackClass): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!r.board_product) continue;
    if (classifyTrack(r) === cls) out[r.board_product] = (out[r.board_product] ?? 0) + 1;
  }
  return out;
}
