import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildRouteGraph } from "@/lib/structuredData";

const SITE_URL = "https://seeld.co.il";
const DEFAULT_TITLE = "SEELD | בית פיננסים וביטוח";
const DEFAULT_DESCRIPTION =
  "שילד היא סוכנות ביטוח ופיננסים. ממפים את תיק הביטוח, הפנסיה והחיסכון, מבינים את האפשרויות ומלווים את הביצוע. הביטוח והכסף שלכם, בתמונה ברורה. שיחה ראשונה ללא עלות.";

type RouteMeta = { title: string; description?: string };

// Exact-path metadata for public routes. Dynamic routes (/blog/:slug, /article/:id)
// fall back to the prefix rules below; private app routes get noindex.
const ROUTE_META: Record<string, RouteMeta> = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/about": {
    title: "אודות SEELD | בית פיננסים וביטוח עצמאי",
    description: "הכירו את שילד, סוכנות ביטוח ופיננסים. הצוות, הערכים והדרך שבה אנחנו מלווים משפחות בישראל.",
  },
  "/learn": {
    title: "מידע ולמידה | תשואות, מונחים ומדריכים פיננסיים | SEELD",
    description:
      "נתוני תשואות ודמי ניהול מעודכנים מרשות שוק ההון, מונחון בשפה פשוטה ומדריכים על פנסיה, גמל, קרן השתלמות וביטוח.",
  },
  "/authors": { title: "הצוות המקצועי | SEELD",
    description: "הכירו את צוות הסוכנים של שילד: תחומי המומחיות ודרך העבודה.",
  },
  "/portfolio-review": {
    title: "בדיקת תיק 360 | תמונה מסודרת של הביטוחים והחסכונות | SEELD",
    description: "בדיקת תיק 360 ללא עלות: מיפוי כל הביטוחים והחסכונות, בחינת הצרכים ומסמך החלטות עם המלצות מנומקות. השאירו פרטים ונחזור אליכם.",
  },
  "/contact": {
    title: "צור קשר | SEELD",
    description: "דברו איתנו: טלפון 052-309-7444, וואטסאפ או טופס פנייה. פגישת ייעוץ ראשונה ללא עלות וללא התחייבות.",
  },
  "/calculators": {
    title: "מחשבונים פיננסיים חינם | משכנתא, פנסיה, חיסכון ומס | SEELD",
    description: "8 מחשבונים פיננסיים חינמיים וללא רישום: החזר משכנתא, צבירת פנסיה, חיסכון, מס הכנסה, ביטוח חיים והשוואת מסלולים.",
  },
  "/return-tables": {
    title: "לוח התשואות | השוואת קרנות פנסיה, גמל והשתלמות לפי מסלול | SEELD",
    description: "לוח תשואות מעודכן אוטומטית מנתוני רשות שוק ההון: מפת השוק לפי חברה, ותשואות, סיכון, חשיפות ודמי ניהול לכל מסלול בקרנות פנסיה, קופות גמל, קרנות השתלמות ופוליסות חיסכון.",
  },
  "/return-tables/pension": {
    title: "תשואות קרנות פנסיה לפי מסלול | לוח התשואות | SEELD",
    description: "כל קרנות הפנסיה בישראל לפי מסלול: תשואה חודשית, מתחילת השנה, 12 חודשים, 3 ו־5 שנים, סיכון, חשיפות ודמי ניהול, מהדיווח הרשמי האחרון.",
  },
  "/return-tables/hishtalmut": {
    title: "תשואות קרנות השתלמות לפי מסלול | לוח התשואות | SEELD",
    description: "כל קרנות ההשתלמות בישראל לפי מסלול: כללי, מניות, עוקבי מדד S&P 500, אג״ח ועוד. תשואות, סיכון ודמי ניהול מהדיווח הרשמי האחרון.",
  },
  "/return-tables/gemel": {
    title: "תשואות קופות גמל לפי מסלול | לוח התשואות | SEELD",
    description: "כל קופות הגמל בישראל לפי מסלול: תשואות 12 חודשים, 3 ו־5 שנים, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
  },
  "/return-tables/gemel-invest": {
    title: "תשואות קופות גמל להשקעה לפי מסלול | לוח התשואות | SEELD",
    description: "כל קופות הגמל להשקעה בישראל לפי מסלול: תשואות, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
  },
  "/return-tables/policies": {
    title: "תשואות פוליסות חיסכון לפי מסלול | לוח התשואות | SEELD",
    description: "פוליסות החיסכון של חברות הביטוח לפי מסלול: תשואות, סיכון, חשיפות ודמי ניהול מהדיווח הרשמי האחרון.",
  },
  "/return-tables/child-savings": {
    title: "תשואות חיסכון לכל ילד לפי מסלול | לוח התשואות | SEELD",
    description: "תוכניות חיסכון לכל ילד בקופות הגמל להשקעה לפי רמת סיכון: תשואות ודמי ניהול מהדיווח הרשמי האחרון.",
  },
  "/fund-finder": {
    title: "איתור קופות וקרנות | SEELD",
    description: "אתרו את הקופות והקרנות שלכם והשוו דמי ניהול ותשואות בין הגופים המנהלים בישראל.",
  },
  "/faq": { title: "שאלות נפוצות | SEELD",
    description: "תשובות קצרות וברורות לשאלות נפוצות על ביטוח בריאות, ביטוח חיים, משכנתא, פנסיה, קרן השתלמות וחיסכון, מסוכנות הביטוח שילד.",
  },
  "/accessibility": { title: "הצהרת נגישות | SEELD",
    description: "הצהרת הנגישות של אתר שילד: התאמות הנגישות באתר, תקן הנגישות ודרכי פנייה לדיווח על בעיה או בקשה להתאמה.",
  },
  "/cookie-policy": { title: "מדיניות עוגיות | SEELD",
    description: "מדיניות העוגיות של אתר שילד: אילו עוגיות פועלות באתר, למה הן משמשות ואיך אפשר לנהל או לבטל אותן.",
  },
  "/terms": { title: "תנאי שימוש | SEELD",
    description: "תנאי השימוש באתר שילד: כללי השימוש באתר ובכלים הדיגיטליים, הגבלת אחריות וזכויות יוצרים.",
  },
  "/privacy": { title: "מדיניות פרטיות | SEELD",
    description: "מדיניות הפרטיות של שילד: איזה מידע נאסף, איך הוא נשמר ומשמש, וזכויות הגולש לעיין במידע ולמחוק אותו.",
  },
  "/rights-extraction": {
    title: "מיצוי זכויות | בדיקת כספים אבודים וזכויות ביטוח | SEELD",
    description: "בדיקת זכויות וכספים אבודים בפנסיה, גמל וביטוח — ליווי מלא במיצוי הזכויות שמגיעות לכם.",
  },
  "/blog": {
    title: "בלוג | מדריכים פיננסיים בגובה העיניים | SEELD",
    description: "מדריכים, טיפים והסברים על ביטוח, פנסיה, חיסכון והשקעות — כתובים בעברית פשוטה ובגובה העיניים.",
  },
  "/insurances": {
    title: "כל הביטוחים | 16 סוגי ביטוח בהשוואה אחת | SEELD",
    description: "בריאות, חיים, משכנתא, רכב, דירה, סיעוד ועוד — כל סוגי הביטוח במקום אחד, עם השוואה מול 12 חברות הביטוח.",
  },
  "/savings": {
    title: "חיסכון והשקעות | פנסיה, גמל וקרן השתלמות | SEELD",
    description: "כל אפיקי החיסכון וההשקעה: קרן פנסיה, קופת גמל, קרן השתלמות, גמל להשקעה ותכנון פיננסי מקיף.",
  },
  "/investment-tracks": {
    title: "מסלולי השקעה | השוואת מסלולים בפנסיה וגמל | SEELD",
    description: "השוואת מסלולי השקעה — מנייתי, S&P 500, כללי, סולידי — בקרנות פנסיה, גמל והשתלמות.",
  },
  "/insurance/health": {
    title: "ביטוח בריאות פרטי | השוואה והצעת מחיר | SEELD",
    description: "ביטוח בריאות פרטי: גישה מהירה לרופאים מומחים, ניתוחים וטיפולים מתקדמים. השוואה מול 12 חברות והצעה מותאמת.",
  },
  "/insurance/critical-illness": { title: "ביטוח מחלות קשות | פיצוי כספי חד-פעמי | SEELD",
    description: "ביטוח מחלות קשות: פיצוי כספי חד-פעמי בעת אבחון מחלה קשה, מה מכוסה, למי זה מתאים ומה לבדוק בפוליסה.",
  },
  "/insurance/accidents": { title: "ביטוח תאונות אישיות | SEELD",
    description: "ביטוח תאונות אישיות: פיצוי במקרה של נכות או מוות עקב תאונה, מה כולל הכיסוי ואיך משווים בין הצעות.",
  },
  "/insurance/life": { title: "ביטוח חיים | הגנה כלכלית למשפחה | SEELD",
    description: "ביטוח חיים: הגנה כלכלית למשפחה במקרה פטירה. סוגי הכיסוי, שיקולים בבחירת סכום הביטוח והשוואה בין חברות.",
  },
  "/insurance/mortgage": { title: "ביטוח משכנתא | חיים ומבנה | SEELD",
    description: "ביטוח משכנתא: ביטוח חיים וביטוח מבנה הנדרשים עם משכנתא, ההבדלים בין ביטוח דרך הבנק לביטוח דרך סוכן עצמאי.",
  },
  "/insurance/partners": { title: "ביטוח שותפים | הגנה עסקית | SEELD",
    description: "ביטוח שותפים: הגנה על עסק ועל השותפים בו במקרה פטירה או אובדן כושר עבודה של אחד מהם.",
  },
  "/insurance/vehicle": { title: "ביטוח רכב | חובה, צד ג׳ ומקיף | SEELD",
    description: "ביטוח רכב: ביטוח חובה, צד ג׳ וביטוח מקיף. מה כל כיסוי כולל ואיך להשוות הצעות בין חברות הביטוח.",
  },
  "/insurance/home": { title: "ביטוח דירה | מבנה ותכולה | SEELD",
    description: "ביטוח דירה: כיסוי למבנה ולתכולה מפני נזקי מים, אש, פריצה ועוד. מה כדאי לבדוק ואיך משווים הצעות.",
  },
  "/insurance/renters": { title: "ביטוח שוכרים | SEELD",
    description: "ביטוח לשוכרי דירה: כיסוי לתכולה ולאחריות כלפי צד ג׳, מה מכוסה ומתי הוא נדרש.",
  },
  "/insurance/business": { title: "ביטוח עסק | SEELD",
    description: "ביטוח עסק: כיסויים לעסקים קטנים ובינוניים, כגון תכולה, צד ג׳, אחריות מקצועית והפסד הכנסה.",
  },
  "/insurance/travel": { title: "ביטוח נסיעות לחו״ל | SEELD",
    description: "ביטוח נסיעות לחו״ל: כיסוי רפואי, ביטול טיסה ואובדן כבודה. מה לבדוק לפי יעד, גיל ופעילויות.",
  },
  "/insurance/dental": { title: "ביטוח שיניים | SEELD",
    description: "ביטוח שיניים: כיסוי לטיפולי שיניים ושיקום, מה כולל הביטוח, תקופות אכשרה ולמי הוא מתאים.",
  },
  "/insurance/disability": { title: "ביטוח אובדן כושר עבודה | SEELD",
    description: "ביטוח אובדן כושר עבודה: תשלום חודשי במקרה שאינכם יכולים לעבוד עקב מחלה או תאונה, והשיקולים בבחירת הכיסוי.",
  },
  "/insurance/foreign-workers": { title: "ביטוח עובדים זרים | SEELD",
    description: "ביטוח עובדים זרים: הביטוח הרפואי הנדרש בחוק למעסיקים של עובדים זרים, מה כולל הכיסוי ואיך מסדירים אותו.",
  },
  "/insurance/nursing": { title: "ביטוח סיעודי | SEELD",
    description: "ביטוח סיעודי: כיסוי כספי להוצאות טיפול סיעודי בגיל מבוגר, סוגי הפוליסות והשוואה בין חברות הביטוח.",
  },
  "/insurance/nursing-clalit": { title: "ביטוח סיעודי משלים לחברי כללית | SEELD",
    description: "ביטוח סיעודי משלים לחברי כללית: ההבדל בין הכיסוי של קופת החולים לביטוח משלים, ומה כדאי לבדוק.",
  },
  "/savings/pension-funds": { title: "קרן פנסיה | השוואה, ניוד ודמי ניהול | SEELD",
    description: "קרן פנסיה: איך היא עובדת, דמי ניהול, מסלולי השקעה ושיקולים בניוד בין קרנות, עם השוואה לפי נתונים רשמיים.",
  },
  "/savings/gemel-funds": { title: "קופת גמל | SEELD",
    description: "קופת גמל: חיסכון לטווח ארוך, הבדלים מקרן פנסיה, דמי ניהול ומסלולי השקעה זמינים.",
  },
  "/savings/gemel-investment": { title: "קופת גמל להשקעה | SEELD",
    description: "קופת גמל להשקעה: חיסכון גמיש עם אפשרות למשיכה, יתרונות מס והבדלים מקרן השתלמות.",
  },
  "/savings/child-savings": { title: "חיסכון לכל ילד | SEELD",
    description: "חיסכון לכל ילד: התוכנית הממשלתית והחיסכון הפרטי לילדים, איך בוחרים מסלול ומה חשוב לדעת.",
  },
  "/savings/training-funds": { title: "קרן השתלמות | הטבות מס וניוד | SEELD",
    description: "קרן השתלמות: הטבות המס, תקופת הצבירה, מסלולי השקעה ושיקולים בניוד בין קרנות.",
  },
  "/savings/investment": { title: "תיקי השקעות | SEELD",
    description: "תיקי השקעות: היכרות עם אפיקי השקעה, רמות סיכון ושילוב בין חיסכון פנסיוני להשקעה עצמאית.",
  },
  "/savings/pension-life-insurance": { title: "ביטוח מנהלים | SEELD",
    description: "ביטוח מנהלים: מוצר המשלב חיסכון פנסיוני וכיסוי ביטוחי, ההבדלים מקרן פנסיה ושיקולי דמי ניהול.",
  },
  "/savings/employer-funds": { title: "קופות מעסיק | SEELD",
    description: "קופות מעסיק: איך פועלת הפרשת המעסיק לפנסיה, גמל והשתלמות, ומה כדאי לבדוק בהסדר שלכם.",
  },
  "/savings/pre-retirement": { title: "היערכות לפרישה | SEELD",
    description: "היערכות לפרישה: איך בודקים את הצבירה, מה השלבים לפני הפרישה והשאלות שכדאי לשאול בזמן.",
  },
  "/savings/post-retirement": { title: "ניהול כספים אחרי פרישה | SEELD",
    description: "ניהול כספים אחרי פרישה: קצבה, משיכת הון ושיקולי מס, איך בונים הכנסה חודשית מהחיסכון.",
  },
  "/savings/financial-planning": { title: "תכנון פיננסי אישי | SEELD",
    description: "תכנון פיננסי אישי: מיפוי הכנסות, הוצאות, ביטוחים וחסכונות, והגדרת מטרות כלכליות לטווח קצר וארוך.",
  },
  "/wellness": { title: "רווחה ואיזון | SEELD",
    description: "רווחה ואיזון: תוכן על איזון בין חיים לכסף, בריאות והרגלים שתומכים בביטחון כלכלי, מבית שילד.",
  },
  "/travel": { title: "טיולים ונסיעות | SEELD",
    description: "טיולים ונסיעות: תוכן וטיפים לתכנון נסיעה, כולל היבטי הביטוח הרלוונטיים לטיול בחו״ל.",
  },
  "/creativity": { title: "יצירתיות | SEELD",
    description: "יצירתיות: תוכן על חשיבה יצירתית וקבלת החלטות, מבית שילד.",
  },
  "/growth": { title: "צמיחה אישית | SEELD",
    description: "צמיחה אישית: תוכן על התפתחות אישית ומקצועית ועל הקשר בינה לבין ביטחון כלכלי.",
  },
  "/agents": {
    title: "לסוכני ביטוח | פלטפורמת העבודה של SEELD",
    description: "פלטפורמה דיגיטלית לסוכני ביטוח: ניהול לקוחות, המלצות, מעקב ביצוע וכלי עבודה חכמים.",
  },
  "/onboarding": { title: "הצטרפות ל-SEELD",
    description: "הצטרפות לשילד: מילוי פרטים להתחלת התהליך. מיפוי התיק הביטוחי והפנסיוני וליווי אישי ללא התחייבות.",
  },
  "/direct-debit": { title: "הסדר תשלום | SEELD",
    description: "הסדר תשלום בהוראת קבע לפוליסות וחסכונות דרך שילד: איך מסדירים תשלום קבוע ובטוח.",
  },
};

// Prefix rules for dynamic public routes (first match wins).
const PREFIX_META: Array<[string, RouteMeta]> = [
  ["/blog/", { title: "בלוג | SEELD" }],
  ["/article/", { title: "מאמר | SEELD" }],
];

// Private/utility areas — excluded from search indexing.
const NOINDEX_PREFIXES = [
  "/app",
  "/admin",
  "/site-admin",
  "/portal/",
  "/execution-portal/",
  "/client/",
  "/style-guide",
  "/personal-area",
  "/saved-calculations",
];

function setMeta(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

function setRobots(noindex: boolean) {
  let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) {
    if (!el) {
      el = document.createElement("meta");
      el.name = "robots";
      document.head.appendChild(el);
    }
    el.content = "noindex, nofollow";
  } else if (el) {
    el.remove();
  }
}

function setJsonLd(graph: object | null) {
  let el = document.head.querySelector<HTMLScriptElement>("script#route-jsonld");
  if (!graph) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "route-jsonld";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(graph);
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const meta =
      ROUTE_META[path] ??
      PREFIX_META.find(([prefix]) => path.startsWith(prefix))?.[1] ??
      { title: DEFAULT_TITLE };

    const title = meta.title;
    const description = meta.description ?? DEFAULT_DESCRIPTION;
    const canonical = `${SITE_URL}${path === "/" ? "" : path}`;

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", canonical);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    const noindex = NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/"));
    setRobots(noindex);
    // Blog posts and articles get their own graph from usePageSeo (needs the loaded data).
    const dynamic = path.startsWith("/blog/") || path.startsWith("/article/");
    if (!dynamic) document.head.querySelector("script#page-jsonld")?.remove();
    setJsonLd(noindex || dynamic ? null : buildRouteGraph({ path, title, description }));
  }, [pathname]);

  return null;
}
