// Single source of truth for every public (indexable) route: title, description, page kind,
// breadcrumb parent, related-pages map, sitemap hints and the llms.txt section.
//
// Consumed by: RouteSeo (title/description/canonical/hreflang), structuredData (JSON-LD graph),
// RelatedPages (internal links), and the build scripts (sitemap.xml, llms.txt, llms-full.txt,
// check:aeo). Node loads this file directly, so keep it dependency-free: no "@/" imports and
// only erasable TypeScript (no enums).
//
// ADDING A PAGE: add one entry here, one summary in ./../answerSummaries.ts, then run
// `npm run seo:generate`. See docs/seo/AEO-GUIDE.md.

export const SITE_URL = "https://seeld.co.il";
/** Bump when page content changes materially; feeds sitemap lastmod and schema dateModified. */
export const CONTENT_REVIEWED = "2026-11-17";

export type RouteKind =
  | "home" | "hub" | "insurance" | "savings" | "tool" | "data" | "info" | "legal" | "service" | "b2b" | "flow" | "blog-index";

export type LlmsGroup = "about" | "insurance" | "savings" | "tools" | "info" | "legal";

export interface RouteEntry {
  path: string;
  kind: RouteKind;
  title: string;
  description: string;
  /** Breadcrumb parent path. Omitted: the home page. */
  parent?: string;
  /** Internal links shown in the related-pages block (same map feeds llms-full.txt). */
  related?: string[];
  group: LlmsGroup;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** schema.org page type when not the default WebPage. */
  pageType?: string;
}

const r = (e: RouteEntry): RouteEntry => e;

export const ROUTES: RouteEntry[] = [
  // ───────── Main ─────────
  r({
    path: "/", kind: "home", group: "about", changefreq: "weekly", priority: 1.0,
    title: "שילד ביטוח ופיננסים | הביטוח והכסף שלכם, בתמונה ברורה",
    description: "שילד היא סוכנות ביטוח ופיננסים. ממפים את תיק הביטוח, הפנסיה והחיסכון, מבינים את האפשרויות ומלווים את הביצוע. בדיקת תיק 360 ופגישת היכרות.",
    related: ["/portfolio-review", "/report", "/insurances", "/savings", "/return-tables"],
  }),
  r({
    path: "/about", kind: "info", group: "about", changefreq: "monthly", priority: 0.8, pageType: "AboutPage",
    title: "אודות SEELD | סוכנות ביטוח ופיננסים עצמאית",
    description: "הכירו את שילד, סוכנות ביטוח ופיננסים. הצוות, הערכים והדרך שבה אנחנו מלווים משפחות ועסקים בישראל.",
    related: ["/authors", "/contact", "/portfolio-review"],
  }),
  r({
    path: "/portfolio-review", kind: "service", group: "about", changefreq: "monthly", priority: 0.9,
    title: "בדיקת תיק 360 | תמונה מסודרת של הביטוחים והחסכונות | SEELD",
    description: "בדיקת תיק 360: מיפוי כל הביטוחים והחסכונות, בחינת הצרכים ומסמך החלטות עם המלצות מנומקות. משאירים פרטים וחוזרים אליכם.",
    related: ["/rights-extraction", "/insurances", "/savings", "/contact"],
  }),
  r({
    path: "/report", kind: "service", group: "about", changefreq: "monthly", priority: 0.7,
    title: "הפקת דוח אישי | קבצי מסלקה והר הביטוח בדוח מידע אחד | SEELD",
    description: "הפקת דוח אישי: מעלים קובץ מסלקה וקובץ הר הביטוח, והמידע מסודר בדוח אחד בעיצוב שילד. דוח מידע, לא ייעוץ. התהליך בהכנה.",
    related: ["/portfolio-review", "/savings/financial-planning", "/contact", "/privacy"],
  }),
  r({
    path: "/contact", kind: "info", group: "about", changefreq: "monthly", priority: 0.8, pageType: "ContactPage",
    title: "צור קשר | SEELD",
    description: "דברו איתנו: טלפון ווטסאפ 052-309-7444, מייל info@seeld.co.il או טופס פנייה. פגישת ייעוץ ראשונה, בלי התחייבות מצידכם.",
    related: ["/portfolio-review", "/faq", "/about"],
  }),
  r({
    path: "/authors", kind: "info", group: "about", changefreq: "monthly", priority: 0.5, pageType: "AboutPage",
    title: "הצוות המקצועי | תחומי ההתמחות של שילד",
    description: "הכירו את צוות הסוכנים של שילד: תחומי ההתמחות ודרך העבודה, מביטוח כללי ועד חיסכון ופנסיה.",
    related: ["/about", "/contact", "/portfolio-review"],
  }),
  r({
    path: "/faq", kind: "info", group: "tools", changefreq: "monthly", priority: 0.7, pageType: "FAQPage",
    title: "שאלות נפוצות על ביטוח, פנסיה וחיסכון | SEELD",
    description: "תשובות קצרות וברורות לשאלות נפוצות על ביטוח בריאות, ביטוח חיים, משכנתא, פנסיה, קרן השתלמות וחיסכון, מסוכנות הביטוח שילד.",
    related: ["/learn", "/insurances", "/savings", "/contact"],
  }),
  r({
    path: "/learn", kind: "hub", group: "tools", changefreq: "weekly", priority: 0.8, pageType: "CollectionPage",
    title: "מידע ולמידה | תשואות, מונחים ומדריכים פיננסיים | SEELD",
    description: "נתוני תשואות ודמי ניהול מעודכנים מרשות שוק ההון, מונחון בשפה פשוטה ומדריכים על פנסיה, גמל, קרן השתלמות וביטוח.",
    related: ["/blog", "/faq", "/return-tables", "/calculators"],
  }),
  r({
    path: "/blog", kind: "blog-index", group: "tools", changefreq: "weekly", priority: 0.8, pageType: "CollectionPage",
    title: "בלוג | מדריכים פיננסיים בגובה העיניים | SEELD",
    description: "מדריכים, טיפים והסברים על ביטוח, פנסיה, חיסכון והשקעות, כתובים בעברית פשוטה ובגובה העיניים.",
    related: ["/learn", "/faq", "/insurances", "/savings"],
  }),
  r({
    path: "/rights-extraction", kind: "service", group: "about", changefreq: "monthly", priority: 0.7,
    title: "מיצוי זכויות | החזרי מס, קצבאות וכספים שנשכחו | SEELD",
    description: "בדיקת זכויות וכספים שנשכחו: החזרי מס, קצבאות ביטוח לאומי, הטבות מס לעצמאים וקופות פנסיוניות. הבדיקה נעשית בשיחה אישית.",
    related: ["/portfolio-review", "/savings/pension-funds", "/contact"],
  }),
  r({
    path: "/onboarding", kind: "flow", group: "about", changefreq: "monthly", priority: 0.6,
    title: "הצטרפות לשילד | שאלון פתיחת תיק",
    description: "שאלון הצטרפות לשילד: מילוי פרטים להתחלת התהליך. מיפוי התיק הביטוחי והפנסיוני וליווי אישי, בלי התחייבות מצידכם.",
    related: ["/portfolio-review", "/contact", "/privacy"],
  }),
  r({
    path: "/direct-debit", kind: "flow", group: "about", changefreq: "monthly", priority: 0.5,
    title: "הוראת קבע | הסדר תשלום לפוליסות וחסכונות | SEELD",
    description: "הסדר תשלום בהוראת קבע לפוליסות וחסכונות דרך שילד: טופס קצר להסדרת תשלום קבוע.",
    related: ["/contact", "/privacy", "/faq"],
  }),
  r({
    path: "/agents", kind: "b2b", group: "about", changefreq: "monthly", priority: 0.6,
    title: "לסוכני ביטוח | פלטפורמת העבודה של SEELD",
    description: "פלטפורמה דיגיטלית לסוכני ביטוח: ניהול לקוחות, מעקב ביצוע וכלי עבודה במקום אחד. בגרסת בטא.",
    related: ["/about", "/contact"],
  }),

  // ───────── Service hubs (formerly mis-titled wellness/travel/creativity/growth) ─────────
  r({
    path: "/wellness", kind: "hub", group: "insurance", changefreq: "weekly", priority: 0.6,
    title: "ביטוח בריאות, חיים וסיעוד | SEELD",
    description: "ביטוח בריאות, חיים וסיעוד: המידע, הכלים וההשוואות במקום אחד, עם אפשרות לתאם פגישה ולבקש בדיקת תיק 360.",
    related: ["/insurance/health", "/insurance/life", "/insurance/nursing", "/portfolio-review"],
  }),
  r({
    path: "/travel", kind: "hub", group: "insurance", changefreq: "weekly", priority: 0.6,
    title: "ביטוח בקליק | ביטוח רכב ודירה בלי פגישה | SEELD",
    description: "ביטוח רכב וביטוח דירה: הצעות מחיר בהשוואה בין חברות הביטוח, בלי פגישה. משאירים פרטים בטופס והצוות חוזר אליכם.",
    related: ["/insurance/vehicle", "/insurance/home", "/insurances"],
  }),
  r({
    path: "/creativity", kind: "hub", group: "insurance", changefreq: "weekly", priority: 0.6,
    title: "ביטוח רכוש ורכב | רכב, דירה, עסק ונסיעות | SEELD",
    description: "ביטוח רכב, דירה, עסק ונסיעות: השוואת הצעות לפי כיסוי, השתתפות עצמית וחריגים, ולא רק לפי מחיר.",
    related: ["/insurance/vehicle", "/insurance/home", "/insurance/business", "/insurance/travel"],
  }),
  r({
    path: "/growth", kind: "hub", group: "savings", changefreq: "weekly", priority: 0.6,
    title: "חיסכון ופיננסים | מדריכים בפנסיה, השתלמות והשקעות | SEELD",
    description: "מדריכים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות, שמתחילים מהתמונה הקיימת ובונים ממנה צעד אחר צעד.",
    related: ["/savings", "/savings/pension-funds", "/savings/training-funds", "/savings/financial-planning"],
  }),

  // ───────── Tools & data ─────────
  r({
    path: "/calculators", kind: "tool", group: "tools", changefreq: "monthly", priority: 0.9, pageType: "CollectionPage",
    title: "מחשבונים פיננסיים | משכנתא, פנסיה, חיסכון ומס | SEELD",
    description: "מחשבונים פיננסיים לשימוש באתר, בלי צורך ברישום: החזר משכנתא, צבירת פנסיה, חיסכון, מס הכנסה, ביטוח חיים והשוואת מסלולים.",
    related: ["/insurance/mortgage", "/savings/pension-funds", "/return-tables", "/portfolio-review"],
  }),
  r({
    path: "/fund-finder", kind: "tool", group: "tools", changefreq: "weekly", priority: 0.8,
    title: "איתור קופות וקרנות | השוואת דמי ניהול ותשואות | SEELD",
    description: "אתרו את הקופות והקרנות שלכם והשוו דמי ניהול ותשואות בין הגופים המנהלים בישראל, לפי נתוני רשות שוק ההון.",
    related: ["/return-tables", "/investment-tracks", "/rights-extraction"],
  }),
  r({
    path: "/investment-tracks", kind: "data", group: "tools", changefreq: "weekly", priority: 0.7,
    title: "מסלולי השקעה | השוואת מסלולים בפנסיה וגמל | SEELD",
    description: "השוואת מסלולי השקעה, כמו מנייתי, S&P 500, כללי וסולידי, בקרנות פנסיה, גמל והשתלמות.",
    related: ["/return-tables", "/savings/pension-funds", "/savings/training-funds", "/fund-finder"],
  }),
  r({
    path: "/return-tables", kind: "data", group: "tools", changefreq: "weekly", priority: 0.7, pageType: "CollectionPage",
    title: "לוח התשואות | השוואת קרנות פנסיה, גמל והשתלמות לפי מסלול | SEELD",
    description: "לוח תשואות מעודכן אוטומטית מנתוני רשות שוק ההון: מפת השוק לפי חברה, ותשואות, סיכון, חשיפות ודמי ניהול לכל מסלול בקרנות פנסיה, קופות גמל, קרנות השתלמות ופוליסות חיסכון.",
    related: ["/return-tables/pension", "/return-tables/hishtalmut", "/fund-finder", "/investment-tracks"],
  }),
  r({
    path: "/return-tables/pension", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות קרנות פנסיה לפי מסלול | לוח התשואות | SEELD",
    description: "קרנות הפנסיה בישראל לפי מסלול: תשואה חודשית, מתחילת השנה, ל־12 חודשים, ל־3 ול־5 שנים, סיכון, חשיפות ודמי ניהול, מהדיווח הרשמי האחרון.",
    related: ["/savings/pension-funds", "/return-tables/gemel", "/return-tables/hishtalmut"],
  }),
  r({
    path: "/return-tables/hishtalmut", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות קרנות השתלמות לפי מסלול | לוח התשואות | SEELD",
    description: "קרנות ההשתלמות בישראל לפי מסלול: כללי, מניות, עוקבי מדד S&P 500, אג״ח ועוד. תשואות, סיכון ודמי ניהול מהדיווח הרשמי האחרון.",
    related: ["/savings/training-funds", "/return-tables/gemel", "/return-tables/pension"],
  }),
  r({
    path: "/return-tables/gemel", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות קופות גמל לפי מסלול | לוח התשואות | SEELD",
    description: "קופות הגמל בישראל לפי מסלול: תשואות ל־12 חודשים, ל־3 ול־5 שנים, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
    related: ["/savings/gemel-funds", "/return-tables/gemel-invest", "/return-tables/pension"],
  }),
  r({
    path: "/return-tables/gemel-invest", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות קופות גמל להשקעה לפי מסלול | לוח התשואות | SEELD",
    description: "קופות הגמל להשקעה בישראל לפי מסלול: תשואות, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
    related: ["/savings/gemel-investment", "/return-tables/gemel", "/return-tables/child-savings"],
  }),
  r({
    path: "/return-tables/policies", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות פוליסות חיסכון לפי מסלול | לוח התשואות | SEELD",
    description: "פוליסות החיסכון של חברות הביטוח לפי מסלול: תשואות, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
    related: ["/savings/pension-life-insurance", "/return-tables/pension", "/return-tables/gemel"],
  }),
  r({
    path: "/return-tables/child-savings", kind: "data", group: "tools", changefreq: "weekly", priority: 0.6, parent: "/return-tables",
    title: "תשואות חיסכון לכל ילד לפי מסלול | לוח התשואות | SEELD",
    description: "תוכניות חיסכון לכל ילד בקופות הגמל להשקעה לפי רמת סיכון: תשואות ודמי ניהול מהדיווח הרשמי האחרון.",
    related: ["/savings/child-savings", "/return-tables/gemel-invest", "/return-tables/gemel"],
  }),

  // ───────── Insurance ─────────
  r({
    path: "/insurances", kind: "hub", group: "insurance", changefreq: "monthly", priority: 0.9, pageType: "CollectionPage",
    title: "כל סוגי הביטוח | בריאות, חיים, רכב, דירה ועוד | SEELD",
    description: "בריאות, חיים, משכנתא, רכב, דירה, סיעוד ועוד: כל סוגי הביטוח במקום אחד, עם השוואה בין חברות הביטוח.",
    related: ["/insurance/health", "/insurance/life", "/insurance/vehicle", "/portfolio-review"],
  }),
  r({
    path: "/insurance/health", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.8, parent: "/insurances",
    title: "ביטוח בריאות פרטי | השוואה והצעת מחיר | SEELD",
    description: "ביטוח בריאות פרטי: גישה מהירה לרופאים מומחים, ניתוחים וטיפולים מתקדמים. השוואה בין חברות והצעה מותאמת.",
    related: ["/insurance/critical-illness", "/insurance/nursing", "/insurance/life", "/wellness"],
  }),
  r({
    path: "/insurance/life", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.8, parent: "/insurances",
    title: "ביטוח חיים | הגנה כלכלית למשפחה | SEELD",
    description: "ביטוח חיים: הגנה כלכלית למשפחה במקרה פטירה. סוגי הכיסוי, שיקולים בבחירת סכום הביטוח והשוואה בין חברות.",
    related: ["/insurance/mortgage", "/insurance/disability", "/insurance/health", "/calculators"],
  }),
  r({
    path: "/insurance/mortgage", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח משכנתא | חיים ומבנה | SEELD",
    description: "ביטוח משכנתא: ביטוח חיים וביטוח מבנה הנדרשים עם משכנתא, וההבדלים בין ביטוח דרך הבנק לביטוח דרך סוכנות עצמאית.",
    related: ["/insurance/life", "/insurance/home", "/calculators"],
  }),
  r({
    path: "/insurance/critical-illness", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח מחלות קשות | פיצוי כספי חד-פעמי | SEELD",
    description: "ביטוח מחלות קשות: פיצוי כספי חד-פעמי בעת אבחון מחלה מוגדרת, מה מכוסה, למי זה מתאים ומה לבדוק בפוליסה.",
    related: ["/insurance/health", "/insurance/disability", "/insurance/life"],
  }),
  r({
    path: "/insurance/accidents", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח תאונות אישיות | SEELD",
    description: "ביטוח תאונות אישיות: פיצוי במקרה של נכות או מוות עקב תאונה, מה כולל הכיסוי ואיך משווים בין הצעות.",
    related: ["/insurance/disability", "/insurance/life", "/insurance/health"],
  }),
  r({
    path: "/insurance/disability", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח אובדן כושר עבודה | SEELD",
    description: "ביטוח אובדן כושר עבודה: תשלום חודשי במקרה שאי אפשר לעבוד עקב מחלה או תאונה, והשיקולים בבחירת הכיסוי.",
    related: ["/insurance/life", "/insurance/accidents", "/savings/pension-funds"],
  }),
  r({
    path: "/insurance/nursing", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח סיעודי | SEELD",
    description: "ביטוח סיעודי: כיסוי כספי להוצאות טיפול סיעודי, סוגי הפוליסות והשוואה בין חברות הביטוח.",
    related: ["/insurance/nursing-clalit", "/insurance/health", "/savings/post-retirement"],
  }),
  r({
    path: "/insurance/nursing-clalit", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.6, parent: "/insurances",
    title: "ביטוח סיעודי משלים לחברי כללית | SEELD",
    description: "ביטוח סיעודי משלים לחברי כללית: ההבדל בין הכיסוי של קופת החולים לביטוח משלים, ומה כדאי לבדוק.",
    related: ["/insurance/nursing", "/insurance/health", "/faq"],
  }),
  r({
    path: "/insurance/vehicle", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.8, parent: "/insurances",
    title: "ביטוח רכב | חובה, צד ג׳ ומקיף | SEELD",
    description: "ביטוח רכב: ביטוח חובה, צד ג׳ וביטוח מקיף. מה כל כיסוי כולל ואיך להשוות הצעות בין חברות הביטוח.",
    related: ["/insurance/home", "/travel", "/creativity"],
  }),
  r({
    path: "/insurance/home", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.8, parent: "/insurances",
    title: "ביטוח דירה | מבנה ותכולה | SEELD",
    description: "ביטוח דירה: כיסוי למבנה ולתכולה מפני נזקי מים, אש, פריצה ועוד. מה כדאי לבדוק ואיך משווים הצעות.",
    related: ["/insurance/renters", "/insurance/mortgage", "/insurance/vehicle"],
  }),
  r({
    path: "/insurance/renters", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח שוכרים | SEELD",
    description: "ביטוח לשוכרי דירה: כיסוי לתכולה ולאחריות כלפי צד ג׳, מה מכוסה ומתי הוא נדרש.",
    related: ["/insurance/home", "/insurance/vehicle", "/faq"],
  }),
  r({
    path: "/insurance/business", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח עסק | SEELD",
    description: "ביטוח עסק: כיסויים לעסקים קטנים ובינוניים, כגון תכולה, צד ג׳, אחריות מקצועית והפסד הכנסה.",
    related: ["/insurance/partners", "/insurance/disability", "/creativity"],
  }),
  r({
    path: "/insurance/travel", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.7, parent: "/insurances",
    title: "ביטוח נסיעות לחו״ל | SEELD",
    description: "ביטוח נסיעות לחו״ל: כיסוי רפואי, ביטול טיסה ואובדן כבודה. מה לבדוק לפי יעד, גיל ופעילויות.",
    related: ["/insurance/health", "/insurance/accidents", "/insurances"],
  }),
  r({
    path: "/insurance/dental", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.6, parent: "/insurances",
    title: "ביטוח שיניים | SEELD",
    description: "ביטוח שיניים: כיסוי לטיפולי שיניים ושיקום, מה כולל הביטוח, תקופות אכשרה ולמי הוא מתאים.",
    related: ["/insurance/health", "/insurances", "/faq"],
  }),
  r({
    path: "/insurance/foreign-workers", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.6, parent: "/insurances",
    title: "ביטוח עובדים זרים | SEELD",
    description: "ביטוח עובדים זרים: הביטוח הרפואי הנדרש בחוק ממעסיקים של עובדים זרים, מה כולל הכיסוי ואיך מסדירים אותו.",
    related: ["/insurance/nursing", "/insurance/health", "/contact"],
  }),
  r({
    path: "/insurance/partners", kind: "insurance", group: "insurance", changefreq: "monthly", priority: 0.6, parent: "/insurances",
    title: "ביטוח שותפים | הגנה עסקית | SEELD",
    description: "ביטוח שותפים: הגנה על עסק ועל השותפים בו במקרה פטירה או אובדן כושר עבודה של אחד מהם.",
    related: ["/insurance/business", "/insurance/life", "/insurance/disability"],
  }),

  // ───────── Savings ─────────
  r({
    path: "/savings", kind: "hub", group: "savings", changefreq: "monthly", priority: 0.9, pageType: "CollectionPage",
    title: "חיסכון והשקעות | פנסיה, גמל וקרן השתלמות | SEELD",
    description: "כל אפיקי החיסכון וההשקעה: קרן פנסיה, קופת גמל, קרן השתלמות, גמל להשקעה ותכנון פיננסי מקיף.",
    related: ["/savings/pension-funds", "/savings/training-funds", "/return-tables", "/portfolio-review"],
  }),
  r({
    path: "/savings/pension-funds", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.8, parent: "/savings",
    title: "קרן פנסיה | השוואה, ניוד ודמי ניהול | SEELD",
    description: "קרן פנסיה: איך היא עובדת, דמי ניהול, מסלולי השקעה ושיקולים בניוד בין קרנות, עם השוואה לפי נתונים רשמיים.",
    related: ["/return-tables/pension", "/savings/pension-life-insurance", "/savings/pre-retirement", "/calculators"],
  }),
  r({
    path: "/savings/gemel-funds", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "קופת גמל | SEELD",
    description: "קופת גמל: חיסכון לטווח ארוך, הבדלים מקרן פנסיה, דמי ניהול ומסלולי השקעה זמינים.",
    related: ["/return-tables/gemel", "/savings/gemel-investment", "/savings/pension-funds"],
  }),
  r({
    path: "/savings/gemel-investment", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "קופת גמל להשקעה | SEELD",
    description: "קופת גמל להשקעה: חיסכון גמיש עם אפשרות למשיכה, יתרונות מס והבדלים מקרן השתלמות.",
    related: ["/return-tables/gemel-invest", "/savings/training-funds", "/savings/child-savings"],
  }),
  r({
    path: "/savings/child-savings", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "חיסכון לכל ילד | SEELD",
    description: "חיסכון לכל ילד: התוכנית הממשלתית והחיסכון הפרטי לילדים, איך בוחרים מסלול ומה חשוב לדעת.",
    related: ["/return-tables/child-savings", "/savings/gemel-investment", "/calculators"],
  }),
  r({
    path: "/savings/training-funds", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "קרן השתלמות | הטבות מס וניוד | SEELD",
    description: "קרן השתלמות: הטבות המס, תקופת הצבירה, מסלולי השקעה ושיקולים בניוד בין קרנות.",
    related: ["/return-tables/hishtalmut", "/savings/gemel-investment", "/savings/employer-funds"],
  }),
  r({
    path: "/savings/investment", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "תיקי השקעות | SEELD",
    description: "תיקי השקעות: היכרות עם אפיקי השקעה, רמות סיכון ושילוב בין חיסכון פנסיוני להשקעה עצמאית.",
    related: ["/investment-tracks", "/savings/financial-planning", "/return-tables"],
  }),
  r({
    path: "/savings/pension-life-insurance", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "ביטוח מנהלים | SEELD",
    description: "ביטוח מנהלים: מוצר המשלב חיסכון פנסיוני וכיסוי ביטוחי, ההבדלים מקרן פנסיה ושיקולי דמי ניהול.",
    related: ["/savings/pension-funds", "/return-tables/policies", "/insurance/life"],
  }),
  r({
    path: "/savings/employer-funds", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.6, parent: "/savings",
    title: "קופות מעסיק | SEELD",
    description: "קופות מעסיק: איך פועלת הפרשת המעסיק לפנסיה, גמל והשתלמות, ומה כדאי לבדוק בהסדר הקיים.",
    related: ["/savings/pension-funds", "/savings/training-funds", "/rights-extraction"],
  }),
  r({
    path: "/savings/pre-retirement", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "היערכות לפרישה | SEELD",
    description: "היערכות לפרישה: איך בודקים את הצבירה, מה השלבים לפני הפרישה והשאלות שכדאי לשאול בזמן.",
    related: ["/savings/post-retirement", "/savings/pension-funds", "/savings/financial-planning"],
  }),
  r({
    path: "/savings/post-retirement", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "ניהול כספים אחרי פרישה | SEELD",
    description: "ניהול כספים אחרי פרישה: קצבה, משיכת הון ושיקולי מס, ואיך בונים הכנסה חודשית מהחיסכון.",
    related: ["/savings/pre-retirement", "/insurance/nursing", "/savings/financial-planning"],
  }),
  r({
    path: "/savings/financial-planning", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "תכנון פיננסי אישי | SEELD",
    description: "תכנון פיננסי אישי: מיפוי הכנסות, הוצאות, ביטוחים וחסכונות, והגדרת מטרות כלכליות לטווח קצר וארוך.",
    related: ["/portfolio-review", "/calculators", "/savings/pre-retirement"],
  }),

  // ───────── Legal ─────────
  r({
    path: "/accessibility", kind: "legal", group: "legal", changefreq: "yearly", priority: 0.3,
    title: "הצהרת נגישות | SEELD",
    description: "הצהרת הנגישות של אתר שילד: התאמות הנגישות באתר, תקן הנגישות ודרכי פנייה לדיווח על בעיה או בקשה להתאמה.",
    related: ["/contact", "/terms", "/privacy"],
  }),
  r({
    path: "/cookie-policy", kind: "legal", group: "legal", changefreq: "yearly", priority: 0.3,
    title: "מדיניות עוגיות | SEELD",
    description: "מדיניות העוגיות של אתר שילד: אילו עוגיות פועלות באתר, למה הן משמשות ואיך אפשר לנהל או לבטל אותן.",
    related: ["/privacy", "/terms"],
  }),
  r({
    path: "/terms", kind: "legal", group: "legal", changefreq: "yearly", priority: 0.3,
    title: "תנאי שימוש | SEELD",
    description: "תנאי השימוש באתר שילד: כללי השימוש באתר ובכלים הדיגיטליים, הגבלת אחריות וזכויות יוצרים.",
    related: ["/privacy", "/cookie-policy", "/accessibility"],
  }),
  r({
    path: "/privacy", kind: "legal", group: "legal", changefreq: "yearly", priority: 0.3,
    title: "מדיניות פרטיות | SEELD",
    description: "מדיניות הפרטיות של שילד: איזה מידע נאסף, איך הוא נשמר ומשמש, וזכויות הגולש לעיין במידע ולמחוק אותו.",
    related: ["/terms", "/cookie-policy", "/contact"],
  }),
];

export const ROUTE_BY_PATH: Record<string, RouteEntry> = Object.fromEntries(ROUTES.map((e) => [e.path, e]));

/** Paths of every static indexable route, in registry order. */
export const STATIC_PATHS: string[] = ROUTES.map((e) => e.path);

export const normalizePath = (p: string) => (p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p);

export const urlFor = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

export const DEFAULT_TITLE = "שילד ביטוח ופיננסים | SEELD";

/** Related paths for a page; dynamic pages (blog posts) get a generic set. */
export function relatedFor(path: string): RouteEntry[] {
  const p = normalizePath(path);
  const entry = ROUTE_BY_PATH[p];
  const paths = entry?.related ?? (p.startsWith("/blog/") ? ["/blog", "/faq", "/portfolio-review"] : []);
  return paths.map((x) => ROUTE_BY_PATH[x]).filter(Boolean);
}

/** Short label of a page: the part of its title before the first " | ". */
export const labelFromTitle = (title: string) => title.split(" | ")[0].trim();
