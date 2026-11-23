// Generated from public/art/spot/manifest.json (spot-art task). Single-element illustrations, transparent WebP.
export interface SpotInfo { w: number; h: number; tags: readonly string[] }

export const SPOTS = {
  "key-brass": { w: 227, h: 100, tags: ["key", "home", "access", "ownership"] },
  "olive-branch": { w: 512, h: 297, tags: ["olive", "branch", "peace", "calm", "divider"] },
  "shield-blue": { w: 322, h: 383, tags: ["shield", "protection", "safety", "insurance"] },
  "heart-pink": { w: 247, h: 209, tags: ["heart", "health", "care", "love"] },
  "coins-stacks": { w: 424, h: 247, tags: ["coins", "savings", "investment", "growth", "money"] },
  "olive-sapling": { w: 512, h: 301, tags: ["olive", "plant", "sapling", "growth", "savings"] },
  "olive-canopy": { w: 512, h: 188, tags: ["olive", "tree", "canopy", "retirement", "calm", "divider"] },
  "tea-hourglass": { w: 260, h: 211, tags: ["tea", "hourglass", "time", "retirement", "pause"] },
  "scroll-ribbon": { w: 512, h: 219, tags: ["scroll", "document", "ribbon", "agreement", "mortgage"] },
  "stone-house": { w: 512, h: 433, tags: ["house", "home", "mortgage", "stone"] },
  "shield-navy": { w: 283, h: 350, tags: ["shield", "protection", "insurance", "safety"] },
  "car-key": { w: 369, h: 160, tags: ["car", "key", "auto", "vehicle"] },
  "scales": { w: 296, h: 290, tags: ["scales", "justice", "legal", "business", "balance"] },
  "briefcase": { w: 290, h: 257, tags: ["briefcase", "business", "work", "professional"] },
  "passport": { w: 374, h: 363, tags: ["passport", "travel", "document", "trip"] },
  "compass": { w: 302, h: 399, tags: ["compass", "travel", "direction", "guidance"] },
  "suitcase": { w: 512, h: 293, tags: ["suitcase", "travel", "luggage", "trip"] },
  "magnifier": { w: 512, h: 323, tags: ["magnifier", "search", "review", "claims", "inspect"] },
  // The wax seal with the check: deliberately rare (owner, 23.11.2026). Only the claims scene and the questionnaire
  // completion use it; no generic pool, rule or stage orbit may pick it.
  "seal-check": { w: 225, h: 222, tags: ["seal", "claims"] },
  "pen": { w: 512, h: 124, tags: ["pen", "signature", "planning", "writing"] },
  "family-figures": { w: 512, h: 418, tags: ["family", "figures", "protection", "parents", "children"] },
  "pillows": { w: 295, h: 190, tags: ["pillows", "cushions", "comfort", "home", "rest"] },
  "plane-toy": { w: 412, h: 264, tags: ["plane", "airplane", "travel", "toy", "trip"] },
  "sailboat": { w: 431, h: 449, tags: ["boat", "sailboat", "child", "future", "toy", "journey"] },
  "ribbon-pink": { w: 512, h: 114, tags: ["ribbon", "bow", "gift", "children", "celebration", "divider"] },
  "treasure-chest": { w: 512, h: 497, tags: ["chest", "treasure", "savings", "coins", "children"] },
  "olive-sapling-b": { w: 512, h: 402, tags: ["olive", "plant", "sapling", "children", "growth"] },
} as const satisfies Record<string, SpotInfo>;

export type SpotName = keyof typeof SPOTS;

/* ---- polish: topic -> context spots (kept here so topics.ts stays untouched) ---- */
type ArtKey =
  | "01-hero" | "02-family-protection" | "03-health-insurance" | "04-investments-growth"
  | "05-retirement" | "06-home-mortgage" | "07-car-insurance" | "08-business-insurance"
  | "09-travel-insurance" | "10-financial-planning" | "11-claims-service" | "12-childrens-savings"
  | "13-nursing-care" | "14-accidents-recovery" | "15-critical-illness" | "16-disability-income" | "17-child-savings-sailboat"
  | "18-partners-agreement" | "19-renters-first-home" | "20-vehicle-road" | "21-dental-calm" | "22-foreign-caregiver" | "23-training-desk" | "24-pension-family-umbrella" | "25-employer-employee"
  | "26-pre-retirement-path" | "27-post-retirement-bench" | "28-direct-debit-calendar" | "29-onboarding-door" | "30-rights-found-key" | "31-team-desks" | "32-process-steps" | "33-welcome-table"
  | "34-object-umbrella" | "35-object-wallet" | "36-object-house-key" | "37-object-hourglass" | "38-object-health-bag" | "39-object-car-key" | "40-object-suitcase" | "41-object-school-bag";

/** Four small spots per illustration topic: [0] floats on the hero stage, the rest are corners, cards and story accents. */
export const SPOT_BY_ART: Record<ArtKey, readonly SpotName[]> = {
  "01-hero": ["key-brass", "olive-sapling", "shield-blue", "compass"],
  "02-family-protection": ["shield-navy", "heart-pink", "olive-sapling-b", "pillows"],
  "03-health-insurance": ["heart-pink", "shield-blue", "magnifier", "pillows"],
  "04-investments-growth": ["coins-stacks", "olive-sapling", "compass", "pen"],
  "05-retirement": ["tea-hourglass", "olive-sapling", "pillows", "compass"],
  "06-home-mortgage": ["key-brass", "scroll-ribbon", "pillows", "stone-house"],
  "07-car-insurance": ["car-key", "shield-navy", "compass", "pen"],
  "08-business-insurance": ["briefcase", "scales", "pen", "olive-sapling"],
  "09-travel-insurance": ["compass", "plane-toy", "suitcase", "passport"],
  "10-financial-planning": ["compass", "pen", "magnifier", "olive-sapling"],
  "11-claims-service": ["seal-check", "magnifier", "scroll-ribbon", "shield-navy"],
  "12-childrens-savings": ["sailboat", "treasure-chest", "olive-sapling-b", "heart-pink"],
  "13-nursing-care": ["tea-hourglass", "pillows", "heart-pink", "olive-sapling-b"],
  "14-accidents-recovery": ["shield-blue", "olive-sapling", "pillows", "heart-pink"],
  "15-critical-illness": ["heart-pink", "olive-sapling-b", "pillows", "shield-blue"],
  "16-disability-income": ["shield-navy", "coins-stacks", "pen", "family-figures"],
  "17-child-savings-sailboat": ["sailboat", "treasure-chest", "olive-sapling-b", "heart-pink"],
  "18-partners-agreement": ["pen", "scales", "briefcase", "key-brass"],
  "19-renters-first-home": ["key-brass", "olive-sapling", "pillows", "stone-house"],
  "20-vehicle-road": ["car-key", "shield-navy", "compass", "scroll-ribbon"],
  "21-dental-calm": ["shield-blue", "heart-pink", "olive-sapling", "pillows"],
  "22-foreign-caregiver": ["suitcase", "passport", "shield-navy", "compass"],
  "23-training-desk": ["pen", "coins-stacks", "olive-sapling", "magnifier"],
  "24-pension-family-umbrella": ["shield-navy", "heart-pink", "olive-sapling-b", "pillows"],
  "25-employer-employee": ["briefcase", "coins-stacks", "olive-sapling", "scales"],
  "26-pre-retirement-path": ["compass", "tea-hourglass", "olive-sapling", "magnifier"],
  "27-post-retirement-bench": ["tea-hourglass", "pillows", "olive-sapling", "coins-stacks"],
  "28-direct-debit-calendar": ["pen", "coins-stacks", "olive-sapling", "scroll-ribbon"],
  "29-onboarding-door": ["key-brass", "olive-sapling", "pen", "scroll-ribbon"],
  "30-rights-found-key": ["magnifier", "key-brass", "scroll-ribbon", "coins-stacks"],
  "31-team-desks": ["briefcase", "pen", "olive-sapling", "compass"],
  "32-process-steps": ["compass", "pen", "magnifier", "scroll-ribbon"],
  "33-welcome-table": ["tea-hourglass", "pen", "olive-sapling", "pillows"],
  "34-object-umbrella": ["shield-blue", "olive-sapling", "pillows", "heart-pink"],
  "35-object-wallet": ["coins-stacks", "pen", "key-brass", "olive-sapling"],
  "36-object-house-key": ["key-brass", "stone-house", "scroll-ribbon", "pillows"],
  "37-object-hourglass": ["tea-hourglass", "compass", "olive-sapling", "pillows"],
  "38-object-health-bag": ["heart-pink", "shield-blue", "magnifier", "pillows"],
  "39-object-car-key": ["car-key", "compass", "shield-navy", "pen"],
  "40-object-suitcase": ["suitcase", "passport", "compass", "plane-toy"],
  "41-object-school-bag": ["sailboat", "heart-pink", "pen", "olive-sapling-b"],
};

/** i-th context spot of a topic (wraps around). Unknown art falls back to the generic set. */
export const spotAt = (art: string, i: number): SpotName => {
  const list = SPOT_BY_ART[art as ArtKey] ?? SPOT_BY_ART["01-hero"];
  return list[((i % list.length) + list.length) % list.length];
};

/** Divider spot that crosses the border between two colour bands. */
export const dividerFor = (art: string, i = 0): SpotName => {
  if (art === "12-childrens-savings") return i % 2 ? "olive-branch" : "ribbon-pink";
  if (art === "05-retirement") return i % 2 ? "olive-branch" : "olive-canopy";
  if (art === "06-home-mortgage" || art === "11-claims-service") return i % 2 ? "scroll-ribbon" : "olive-branch";
  return i % 2 ? "olive-canopy" : "olive-branch";
};

/* ---- insurance pages: spots chosen per topic (by path), never repeated on one page ---- */
export interface PageSpots { hero: SpotName; story: readonly [SpotName, SpotName]; process: SpotName; contact: SpotName }

export const PAGE_SPOTS: Record<string, PageSpots> = {
  "/insurance/life": { hero: "shield-navy", story: ["sailboat", "heart-pink"], process: "pen", contact: "olive-sapling-b" },
  "/insurance/health": { hero: "heart-pink", story: ["magnifier", "pillows"], process: "pen", contact: "shield-blue" },
  "/insurance/vehicle": { hero: "car-key", story: ["compass", "pen"], process: "scroll-ribbon", contact: "shield-navy" },
  "/insurance/home": { hero: "key-brass", story: ["pillows", "stone-house"], process: "scroll-ribbon", contact: "shield-blue" },
  "/insurance/mortgage": { hero: "scroll-ribbon", story: ["key-brass", "family-figures"], process: "pen", contact: "stone-house" },
  "/insurance/renters": { hero: "pillows", story: ["key-brass", "stone-house"], process: "scroll-ribbon", contact: "shield-blue" },
  "/insurance/business": { hero: "briefcase", story: ["scales", "pen"], process: "magnifier", contact: "olive-sapling" },
  "/insurance/partners": { hero: "scales", story: ["briefcase", "pen"], process: "scroll-ribbon", contact: "shield-navy" },
  "/insurance/travel": { hero: "suitcase", story: ["passport", "compass"], process: "plane-toy", contact: "shield-blue" },
  "/insurance/nursing": { hero: "tea-hourglass", story: ["olive-sapling", "pillows"], process: "shield-blue", contact: "heart-pink" },
  "/insurance/nursing-clalit": { hero: "shield-blue", story: ["heart-pink", "tea-hourglass"], process: "magnifier", contact: "pillows" },
  "/insurance/critical-illness": { hero: "heart-pink", story: ["shield-navy", "family-figures"], process: "pen", contact: "olive-sapling" },
  "/insurance/disability": { hero: "shield-blue", story: ["coins-stacks", "family-figures"], process: "pen", contact: "olive-sapling" },
  "/insurance/dental": { hero: "shield-blue", story: ["magnifier", "heart-pink"], process: "pen", contact: "pillows" },
  "/insurance/accidents": { hero: "shield-navy", story: ["heart-pink", "compass"], process: "pen", contact: "pillows" },
  "/insurance/foreign-workers": { hero: "passport", story: ["heart-pink", "scroll-ribbon"], process: "compass", contact: "shield-navy" },
};

/** Card keywords -> the spot that illustrates that content (first match whose spot is still unused wins). */
const CARD_SPOT_RULES: readonly (readonly [RegExp, SpotName])[] = [
  [/משכנתא|הלוואה|בנק/, "scroll-ribbon"],
  [/דירה|בית|מבנה|תכולה|רהיט|שוכר/, "stone-house"],
  [/ילדים|ילד |משפחה|שאירים|יקיריכם/, "family-figures"],
  [/סיעוד|זקנה|גיל מבוגר|פנסיה|פרישה/, "tea-hourglass"],
  [/בריאות|רפוא|ניתוח|רופא|שיניים|מחלה|מחלות|טיפול|החלמה/, "heart-pink"],
  [/רכב|נהג|כביש|מוסך/, "car-key"],
  [/נסיעה|נסיעות|טיסה|חו״ל|מזוודה|תייר/, "suitcase"],
  [/עסק|שותף|עובד|מעסיק/, "briefcase"],
  [/הכנסה|שכר|קצבה|חודשי/, "coins-stacks"],
  [/השווא|בדיק|בודקים|מחיר|עלות|פרמיה/, "magnifier"],
  [/תביעה|פיצוי|אישור|תשלום/, "shield-blue"],
  [/פוליסה|הסכם|תנאים|חתימה|מסמך/, "pen"],
  [/הגנה|בטוח|ביטחון|שקט|כיסוי/, "shield-navy"],
];

/** Content-neutral spots, used only when a card matches no keyword. */
const NEUTRAL_SPOTS: readonly SpotName[] = ["olive-sapling", "pen", "shield-navy", "compass"];

/**
 * Spot for a key-point card chosen from the card's own text (then the topic's pool), skipping spots already on the page.
 * `used` is mutated. Returns null when nothing suitable is left, so the card simply has no spot.
 */
export const spotForCard = (text: string, used: Set<SpotName>): SpotName | null => {
  const pick = (n: SpotName) => { used.add(n); return n; };
  for (const [re, name] of CARD_SPOT_RULES) if (re.test(text) && !used.has(name)) return pick(name);
  const fallback = NEUTRAL_SPOTS.find((n) => !used.has(n));
  return fallback ? pick(fallback) : null;
};
