// Per-route SEO metadata for the public site.
// Titles pattern: "<page> | SEELD". Descriptions: 120-160 chars, Hebrew,
// no invented figures (STYLESEED regulatory rule), no em-dash in copy.

export const SITE_ORIGIN = "https://seeld.co.il";

export const DEFAULT_TITLE = "SEELD | בית פיננסים וביטוח עצמאי | מבית עמיתים הון";
export const DEFAULT_DESCRIPTION =
  "SEELD הוא בית פיננסים וביטוח עצמאי. צוות של יועצים ומומחים פיננסיים מלווים את תיק הביטוח, הפנסיה והחיסכון של 600 משפחות ברחבי ישראל. פגישת ייעוץ ראשונה ללא עלות.";

export interface RouteMeta {
  title: string;
  description: string;
}

// Route prefixes that must never be indexed (CRM, admin, tokenized portals).
export const NOINDEX_PREFIXES = [
  "/app",
  "/admin",
  "/site-admin",
  "/portal",
  "/execution-portal",
  "/client",
  "/style-guide",
  "/saved-calculations",
  "/personal-area",
];

export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/about": {
    title: "אודות | SEELD",
    description:
      "הכירו את SEELD, בית פיננסים וביטוח עצמאי מבית עמיתים הון. יועץ אישי קבוע, השוואה מול כל החברות המובילות בישראל, וליווי לאורך שנים.",
  },
  "/authors": {
    title: "הסוכן שלכם | SEELD",
    description:
      "שמוליק מרציאנו, סוכן ביטוח פנסיוני ברישיון רשות שוק ההון. מלווה משפחות ועסקים בביטוח, פנסיה וחיסכון עם שירות אישי ושקוף.",
  },
  "/contact": {
    title: "צור קשר | SEELD",
    description:
      "השאירו פרטים ויועץ מהצוות יחזור אליכם באותו יום עבודה. טלפון, אימייל ומשרדים ברעננה ובירושלים. שיחת ייעוץ ראשונה ללא עלות.",
  },
  "/calculators": {
    title: "מחשבונים פיננסיים | SEELD",
    description:
      "מחשבוני פנסיה, משכנתא, ביטוח חיים, חיסכון ומס הכנסה. כלים חינמיים לתכנון פיננסי חכם, בלי רישום ובלי עלות.",
  },
  "/return-tables": {
    title: "לוחות תשואה | SEELD",
    description:
      "לוחות תשואה מעודכנים של קרנות פנסיה, קופות גמל וקרנות השתלמות. השוואת ביצועים בין כל בתי ההשקעות וחברות הביטוח בישראל.",
  },
  "/fund-finder": {
    title: "איתור והשוואת קופות | SEELD",
    description:
      "חיפוש והשוואה של קרנות פנסיה, קופות גמל וקרנות השתלמות מכל בתי ההשקעות. נתונים רשמיים, השוואה שקופה ומעודכנת.",
  },
  "/insurances": {
    title: "ביטוח | SEELD",
    description:
      "16 תחומי ביטוח במקום אחד: בריאות, חיים, רכב, דירה, עסק, נסיעות ועוד. השוואה מול כל חברות הביטוח בישראל וליווי אישי של יועץ.",
  },
  "/savings": {
    title: "חיסכון ופנסיה | SEELD",
    description:
      "קרנות פנסיה, קופות גמל, קרנות השתלמות ופוליסות חיסכון. תכנון פנסיוני מקצועי והשוואת מסלולים מול כל בתי ההשקעות בישראל.",
  },
  "/investment-tracks": {
    title: "מסלולי השקעה | SEELD",
    description:
      "השוואת מסלולי השקעה בפנסיה, גמל והשתלמות: רמות סיכון, תשואות והתאמה אישית. מידע מעודכן מכל בתי ההשקעות בישראל.",
  },
  "/faq": {
    title: "שאלות נפוצות | SEELD",
    description:
      "תשובות לשאלות הנפוצות על ביטוח, פנסיה וחיסכון: איך בוחרים ביטוח בריאות, מה ההבדל בין מסלולים, ואיך עוברים בין קרנות.",
  },
  "/blog": {
    title: "בלוג | SEELD",
    description:
      "מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון בגובה העיניים. כל מה שחשוב לדעת על הכסף שלכם, בעברית פשוטה.",
  },
  "/agents": {
    title: "לסוכנים | SEELD",
    description:
      "פלטפורמה דיגיטלית לסוכני ביטוח: ניהול לקוחות, המלצות, מעקב ביצוע ומסמכים במקום אחד. פחות ניירת, יותר זמן ללקוחות.",
  },
  "/wellness": {
    title: "שירותים ופעולות | SEELD",
    description:
      "כל השירותים והפעולות של SEELD במקום אחד: בדיקת תיק, מיצוי זכויות, טפסים ובקשות. שירות מהיר ואישי לכל לקוח.",
  },
  "/travel": {
    title: "ביטוח בקליק | SEELD",
    description:
      "הצטרפות מהירה אונליין לביטוחים נבחרים: נסיעות לחו״ל, רכב ודירה. תהליך דיגיטלי קצר עם ליווי של יועץ אנושי כשצריך.",
  },
  "/creativity": {
    title: "ביטוח רכוש ורכב | SEELD",
    description:
      "ביטוחי רכוש ורכב בהשוואה מול כל החברות: רכב מקיף וצד ג׳, דירה ותכולה, עסק. הצעות מותאמות אישית וליווי בתביעות.",
  },
  "/growth": {
    title: "חיסכון ופיננסים | SEELD",
    description:
      "פתרונות חיסכון והשקעה לטווח קצר וארוך: קופות גמל להשקעה, פוליסות חיסכון ותכנון פיננסי משפחתי עם יועץ אישי.",
  },
  "/rights-extraction": {
    title: "מיצוי זכויות | SEELD",
    description:
      "בדיקת זכויות מול ביטוח לאומי, מס הכנסה וחברות הביטוח. איתור כספים אבודים וכיסויים כפולים, וליווי מלא בתהליך המימוש.",
  },
  "/direct-debit": {
    title: "הוראת קבע | SEELD",
    description:
      "הקמת הוראת קבע לתשלום פוליסות בצורה מאובטחת ופשוטה. תהליך דיגיטלי קצר עם אישור מיידי.",
  },
  "/accessibility": {
    title: "הצהרת נגישות | SEELD",
    description:
      "הצהרת הנגישות של אתר SEELD: התאמות הנגישות באתר, דרכי פנייה לרכז הנגישות ומידע על רמת התאימות לתקן.",
  },
  "/cookie-policy": {
    title: "מדיניות עוגיות | SEELD",
    description:
      "מדיניות העוגיות של אתר SEELD: אילו עוגיות בשימוש, למה הן משמשות ואיך אפשר לנהל את ההעדפות שלכם.",
  },
  "/terms": {
    title: "תנאי שימוש | SEELD",
    description: "תנאי השימוש באתר SEELD ובשירותי הסוכנות. זכויות, חובות ומידע משפטי למשתמשי האתר.",
  },
  "/privacy": {
    title: "מדיניות פרטיות | SEELD",
    description:
      "מדיניות הפרטיות של SEELD: איך אנחנו אוספים, שומרים ומגנים על המידע האישי שלכם, בהתאם לחוק הגנת הפרטיות.",
  },
  "/onboarding": {
    title: "הצטרפות | SEELD",
    description:
      "הצטרפות דיגיטלית לשירותי SEELD: כמה פרטים קצרים ויועץ אישי יחזור אליכם עם תמונת מצב מלאה של התיק שלכם.",
  },
  "/install": {
    title: "התקנת האפליקציה | SEELD",
    description: "הוסיפו את SEELD למסך הבית של הטלפון וקבלו גישה מהירה לתיק, למחשבונים וליועץ האישי.",
  },

  // Insurance product pages
  "/insurance/health": {
    title: "ביטוח בריאות פרטי | SEELD",
    description:
      "ביטוח בריאות פרטי בהשוואה מול כל החברות: ניתוחים, תרופות מחוץ לסל, השתלות וטיפולים מתקדמים. התאמה אישית לצרכי המשפחה.",
  },
  "/insurance/critical-illness": {
    title: "ביטוח מחלות קשות | SEELD",
    description:
      "ביטוח מחלות קשות עם פיצוי כספי חד פעמי במקרה אבחון. השוואת כיסויים ומחירים בין כל חברות הביטוח בישראל.",
  },
  "/insurance/accidents": {
    title: "ביטוח תאונות אישיות | SEELD",
    description:
      "ביטוח תאונות אישיות: פיצוי על שברים, כוויות, אשפוז ונכות מתאונה. כיסוי לכל המשפחה בהתאמה אישית.",
  },
  "/insurance/life": {
    title: "ביטוח חיים | SEELD",
    description:
      "ביטוח חיים להגנה כלכלית על המשפחה, לפי מה שבאמת צריך. השוואת מחירים בין כל החברות והתאמה למצב המשפחתי והפיננסי.",
  },
  "/insurance/mortgage": {
    title: "ביטוח חיים למשכנתא | SEELD",
    description:
      "ביטוח חיים למשכנתא במחיר משתלם: השוואה מול כל החברות, מעבר חכם מהבנק וחיסכון לאורך חיי ההלוואה.",
  },
  "/insurance/partners": {
    title: "ביטוח ריסק שותפים | SEELD",
    description:
      "ביטוח ריסק שותפים לעסקים: הגנה על המשך פעילות העסק במקרה אובדן של שותף. מותאם להסכם השותפות ולשווי העסק.",
  },
  "/insurance/vehicle": {
    title: "ביטוח רכב | SEELD",
    description:
      "ביטוח רכב חובה, מקיף וצד ג׳ בהשוואה בין כל החברות. הצעת מחיר מהירה, כיסויים מותאמים וליווי אישי בתביעות.",
  },
  "/insurance/home": {
    title: "ביטוח דירה | SEELD",
    description:
      "ביטוח דירה ותכולה: מבנה, צנרת, רעידת אדמה וצד ג׳. השוואת כיסויים ומחירים בין כל חברות הביטוח בישראל.",
  },
  "/insurance/renters": {
    title: "ביטוח תכולה לשוכרים | SEELD",
    description:
      "ביטוח תכולה לדירה שכורה: הגנה על הציוד האישי וצד ג׳ במחיר נגיש. פתרון פשוט ומהיר לשוכרים.",
  },
  "/insurance/business": {
    title: "ביטוח עסק | SEELD",
    description:
      "ביטוח עסקי מקיף: רכוש, אחריות מקצועית, צד ג׳, אובדן הכנסה וסייבר. פתרון מותאם לגודל העסק ולתחום הפעילות.",
  },
  "/insurance/travel": {
    title: "ביטוח נסיעות לחו״ל | SEELD",
    description:
      "ביטוח נסיעות לחו״ל בקליק: כיסוי רפואי, ביטול טיסה, אשפוז ומטען. השוואת פוליסות והצטרפות דיגיטלית מהירה.",
  },
  "/insurance/dental": {
    title: "ביטוח שיניים | SEELD",
    description:
      "ביטוח שיניים למשפחה: טיפולים משמרים, כירורגיה ואורתודנטיה. השוואת תוכניות בין החברות והתאמה לצרכים שלכם.",
  },
  "/insurance/disability": {
    title: "ביטוח אובדן כושר עבודה | SEELD",
    description:
      "ביטוח אובדן כושר עבודה: הכנסה חודשית במקרה פגיעה ביכולת לעבוד. התאמת הכיסוי לעיסוק, לשכר ולמבנה הפנסיוני.",
  },
  "/insurance/foreign-workers": {
    title: "ביטוח עובדים זרים ותיירים | SEELD",
    description:
      "ביטוח רפואי לעובדים זרים ותיירים בהתאם לחוק: כיסוי רפואי מלא, הנפקה מהירה ושירות בכמה שפות.",
  },
  "/insurance/nursing": {
    title: "ביטוח סיעודי | SEELD",
    description:
      "ביטוח סיעודי פרטי: קצבה חודשית במצב סיעודי, בבית או במוסד. השלמה חכמה לביטוח הסיעודי של קופת החולים.",
  },
  "/insurance/nursing-clalit": {
    title: "ביטוח סיעודי לחברי כללית | SEELD",
    description:
      "ביטוח סיעודי משלים לחברי קופת חולים כללית: הרחבת הכיסוי הקיים וקצבה חודשית גבוהה יותר במצב סיעודי.",
  },

  // Savings and pension pages
  "/savings/pension-funds": {
    title: "קרנות פנסיה | SEELD",
    description:
      "השוואת קרנות פנסיה: דמי ניהול, תשואות ומסלולי השקעה בכל בתי ההשקעות. ליווי מקצועי בבחירה ובמעבר בין קרנות.",
  },
  "/savings/gemel-funds": {
    title: "קופות גמל | SEELD",
    description:
      "קופות גמל לחיסכון פנסיוני: השוואת דמי ניהול ותשואות, בחירת מסלול השקעה מתאים וניוד חכם בין קופות.",
  },
  "/savings/gemel-investment": {
    title: "קופת גמל להשקעה | SEELD",
    description:
      "קופת גמל להשקעה: חיסכון נזיל עם יתרונות מס בפדיון כקצבה. השוואת מסלולים ובתי השקעות והצטרפות פשוטה.",
  },
  "/savings/child-savings": {
    title: "חיסכון לכל ילד | SEELD",
    description:
      "תוכנית חיסכון לכל ילד: בחירת מסלול ההשקעה הנכון, הגדלת ההפקדה החודשית ותכנון העתיד הכלכלי של הילדים.",
  },
  "/savings/training-funds": {
    title: "קרן השתלמות | SEELD",
    description:
      "קרן השתלמות לשכירים ועצמאים: הטבות מס, נזילות אחרי שש שנים והשוואת דמי ניהול ותשואות בין כל הקרנות.",
  },
  "/savings/investment": {
    title: "פוליסת חיסכון והשקעות | SEELD",
    description:
      "פוליסות חיסכון והשקעה מנוהלות: פיזור רחב, מעבר בין מסלולים ללא אירוע מס וליווי אישי בבניית התיק.",
  },
  "/savings/pension-life-insurance": {
    title: "ביטוח מנהלים | SEELD",
    description:
      "ביטוח מנהלים: חיסכון פנסיוני עם כיסויים מובנים. בדיקת כדאיות מול קרן פנסיה והתאמת המסלול והכיסויים.",
  },
  "/savings/employer-funds": {
    title: "פתרונות פנסיוניים לארגונים | SEELD",
    description:
      "ניהול הסדרים פנסיוניים לארגונים ומעסיקים: קליטת עובדים, בקרת הפקדות וליווי שוטף לעובדים ולהנהלה.",
  },
  "/savings/pre-retirement": {
    title: "הכנה לפרישה | SEELD",
    description:
      "תכנון פרישה מקיף: מיפוי הצבירות, תכנון מס, בחירה בין קצבה להיוון והכנת התיק לשלב החדש בחיים.",
  },
  "/savings/post-retirement": {
    title: "ניהול פנסיה בפרישה | SEELD",
    description:
      "ניהול חכם של הפנסיה אחרי הפרישה: מסלולי השקעה לגיל פרישה, תכנון משיכות ומיצוי הטבות המס לפנסיונרים.",
  },
  "/savings/financial-planning": {
    title: "תכנון פיננסי | SEELD",
    description:
      "תכנון כלכלי מתקדם למשפחות: תמונת מצב מלאה של הנכסים, יעדים לטווח קצר וארוך ותוכנית פעולה מסודרת.",
  },
};

// Prefix fallbacks for dynamic routes (post/article titles are set by the page itself).
export const PREFIX_META: Array<{ prefix: string; meta: RouteMeta }> = [
  {
    prefix: "/blog/",
    meta: {
      title: "בלוג | SEELD",
      description: "מדריך מקצועי מהבלוג של SEELD בנושאי ביטוח, פנסיה וחיסכון.",
    },
  },
  {
    prefix: "/article/",
    meta: {
      title: "מאמר | SEELD",
      description: "מאמר מקצועי של SEELD בנושאי ביטוח, פנסיה וחיסכון.",
    },
  },
];

export function resolveRouteMeta(pathname: string): RouteMeta {
  const clean = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (ROUTE_META[clean]) return ROUTE_META[clean];
  const byPrefix = PREFIX_META.find((p) => clean.startsWith(p.prefix));
  if (byPrefix) return byPrefix.meta;
  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

export function isNoIndex(pathname: string): boolean {
  return NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
