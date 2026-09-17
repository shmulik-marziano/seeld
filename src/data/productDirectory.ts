// The product directory: one order for the whole site (home, hubs, footer, nav).
//
// The order is the owner's (2026-09-17): first the money and the assets
// (savings policies, provident, study funds, pension), then the insurance that
// protects the person and the family (life, mortgage, health, critical illness,
// accidents, partners), and only then general insurance (vehicle, property,
// business, travel, dental, and the rest).

export interface ProductLink {
  title: string;
  description: string;
  href: string;
}

export interface ProductTier {
  key: "finance" | "life" | "general";
  /** Section title on the home page and the hubs */
  title: string;
  /** One line under the title */
  lede: string;
  /** Hub page with the full list */
  href: string;
  linkLabel: string;
  items: ProductLink[];
  /** How many rows the home page shows on a phone before the "all" link */
  homeCount: number;
}

export const FINANCE: ProductLink[] = [
  { title: "פוליסות חיסכון והשקעה", description: "השקעה בשוק ההון דרך חברות הביטוח, נזילה וללא נעילה", href: "/savings/investment" },
  { title: "קופות גמל", description: "חיסכון לטווח ארוך עם הטבות מס", href: "/savings/gemel-funds" },
  { title: "קרנות השתלמות", description: "חיסכון לשש שנים עם פטור ממס", href: "/savings/training-funds" },
  { title: "קרנות פנסיה", description: "הפקדות, כיסויים ובחירת מסלול נכונה", href: "/savings/pension-funds" },
  { title: "גמל להשקעה", description: "חיסכון נזיל בשוק ההון, ללא נעילה", href: "/savings/gemel-investment" },
  { title: "חיסכון לכל ילד", description: "ניהול כספי התוכנית הממשלתית", href: "/savings/child-savings" },
  { title: "ביטוח חיים פנסיוני", description: "חיסכון עם כיסוי למקרה מוות ונכות", href: "/savings/pension-life-insurance" },
  { title: "קופות מעסיקים", description: "הפקדות לעובדים וציות לחוק", href: "/savings/employer-funds" },
  { title: "טרום פרישה", description: "5 עד 10 שנים לפנסיה? הזמן לסדר הכול", href: "/savings/pre-retirement" },
  { title: "לאחר פרישה", description: "משיכות, קצבאות ותכנון מס", href: "/savings/post-retirement" },
  { title: "תכנון פיננסי", description: "מיפוי מלא של הנכסים ובניית תוכנית", href: "/savings/financial-planning" },
];

export const LIFE_HEALTH: ProductLink[] = [
  { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה, לפי מה שבאמת צריך", href: "/insurance/life" },
  { title: "ביטוח משכנתא", description: "שמירה על הדירה גם במקרה בלתי צפוי", href: "/insurance/mortgage" },
  { title: "ביטוח בריאות", description: "כיסוי שמשלים את הסל ולא כופל אותו", href: "/insurance/health" },
  { title: "מחלות קשות", description: "פיצוי כספי חד־פעמי עם אבחון מחלה", href: "/insurance/critical-illness" },
  { title: "תאונות אישיות", description: "פיצוי על אשפוז, שבר או נכות מתאונה", href: "/insurance/accidents" },
  { title: "ביטוח שותפים", description: "רציפות עסקית במקרה של אובדן שותף", href: "/insurance/partners" },
];

export const GENERAL_INSURANCE: ProductLink[] = [
  { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳. השוואה בין כל החברות", href: "/insurance/vehicle" },
  { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", href: "/insurance/home" },
  { title: "ביטוח שוכרים", description: "כיסוי תכולה ואחריות צד ג׳ לשוכרים", href: "/insurance/renters" },
  { title: "ביטוח עסקי", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק", href: "/insurance/business" },
  { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", href: "/insurance/travel" },
  { title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { title: "אובדן כושר עבודה", description: "תשלום חודשי אם לא תוכלו לעבוד", href: "/insurance/disability" },
  { title: "ביטוח סיעודי", description: "מימון טיפול סיעודי בבית או במוסד", href: "/insurance/nursing" },
  { title: "עובדים זרים", description: "ביטוח חובה בהתאם לחוק", href: "/insurance/foreign-workers" },
  { title: "סיעודי כללית", description: "כיסוי סיעודי משלים לחברי כללית", href: "/insurance/nursing-clalit" },
];

export const TIERS: ProductTier[] = [
  {
    key: "finance",
    title: "פיננסים",
    lede: "הכסף והנכסים שלכם: פוליסות השקעה, גמל, השתלמות ופנסיה.",
    href: "/savings",
    linkLabel: "לכל 11 מוצרי הפיננסים",
    items: FINANCE,
    homeCount: 6,
  },
  {
    key: "life",
    title: "ביטוחי חיים ובריאות",
    lede: "ההגנה על המשפחה, על ההכנסה ועל הבית.",
    href: "/insurances",
    linkLabel: "לכל תחומי הביטוח",
    items: LIFE_HEALTH,
    homeCount: 6,
  },
  {
    key: "general",
    title: "ביטוח כללי",
    lede: "רכב, דירה, עסק, נסיעות ושאר הכיסויים.",
    href: "/insurances#general",
    linkLabel: "לכל 10 תחומי הביטוח הכללי",
    items: GENERAL_INSURANCE,
    homeCount: 4,
  },
];
