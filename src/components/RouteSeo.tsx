import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://seeld.co.il";
const DEFAULT_TITLE = "SEELD | בית פיננסים וביטוח עצמאי | מבית עמיתים הון";
const DEFAULT_DESCRIPTION =
  "SEELD הוא בית פיננסים וביטוח עצמאי. צוות של יועצים ומומחים פיננסיים מלווים את תיק הביטוח, הפנסיה והחיסכון של 600 משפחות ברחבי ישראל. פגישת ייעוץ ראשונה ללא עלות.";

type RouteMeta = { title: string; description?: string };

// Exact-path metadata for public routes. Dynamic routes (/blog/:slug, /article/:id)
// fall back to the prefix rules below; private app routes get noindex.
const ROUTE_META: Record<string, RouteMeta> = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/about": {
    title: "אודות SEELD | בית פיננסים וביטוח עצמאי",
    description: "הכירו את SEELD — בית פיננסים וביטוח עצמאי מבית עמיתים הון. הצוות, הערכים והדרך שבה אנחנו מלווים 600+ משפחות בישראל.",
  },
  "/authors": { title: "הכותבים שלנו | SEELD" },
  "/contact": {
    title: "צור קשר | SEELD",
    description: "דברו איתנו: טלפון 052-309-7444, וואטסאפ או טופס פנייה. פגישת ייעוץ ראשונה ללא עלות — מענה תוך יום עסקים.",
  },
  "/calculators": {
    title: "מחשבונים פיננסיים חינם | משכנתא, פנסיה, חיסכון ומס | SEELD",
    description: "8 מחשבונים פיננסיים חינמיים וללא רישום: החזר משכנתא, צבירת פנסיה, חיסכון, מס הכנסה, ביטוח חיים והשוואת מסלולים.",
  },
  "/return-tables": {
    title: "טבלאות תשואה | השוואת קרנות פנסיה, גמל והשתלמות | SEELD",
    description: "טבלאות תשואה מעודכנות להשוואה בין קרנות פנסיה, קופות גמל וקרנות השתלמות בכל מסלולי ההשקעה.",
  },
  "/fund-finder": {
    title: "איתור קופות וקרנות | SEELD",
    description: "אתרו את הקופות והקרנות שלכם והשוו דמי ניהול ותשואות בין הגופים המנהלים בישראל.",
  },
  "/faq": { title: "שאלות נפוצות | SEELD" },
  "/accessibility": { title: "הצהרת נגישות | SEELD" },
  "/cookie-policy": { title: "מדיניות עוגיות | SEELD" },
  "/terms": { title: "תנאי שימוש | SEELD" },
  "/privacy": { title: "מדיניות פרטיות | SEELD" },
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
  "/insurance/critical-illness": { title: "ביטוח מחלות קשות | פיצוי כספי חד-פעמי | SEELD" },
  "/insurance/accidents": { title: "ביטוח תאונות אישיות | SEELD" },
  "/insurance/life": { title: "ביטוח חיים | הגנה כלכלית למשפחה | SEELD" },
  "/insurance/mortgage": { title: "ביטוח משכנתא | חיים ומבנה | SEELD" },
  "/insurance/partners": { title: "ביטוח שותפים | הגנה עסקית | SEELD" },
  "/insurance/vehicle": { title: "ביטוח רכב | חובה, צד ג׳ ומקיף | SEELD" },
  "/insurance/home": { title: "ביטוח דירה | מבנה ותכולה | SEELD" },
  "/insurance/renters": { title: "ביטוח שוכרים | SEELD" },
  "/insurance/business": { title: "ביטוח עסק | SEELD" },
  "/insurance/travel": { title: "ביטוח נסיעות לחו״ל | SEELD" },
  "/insurance/dental": { title: "ביטוח שיניים | SEELD" },
  "/insurance/disability": { title: "ביטוח אובדן כושר עבודה | SEELD" },
  "/insurance/foreign-workers": { title: "ביטוח עובדים זרים | SEELD" },
  "/insurance/nursing": { title: "ביטוח סיעודי | SEELD" },
  "/insurance/nursing-clalit": { title: "ביטוח סיעודי משלים לחברי כללית | SEELD" },
  "/savings/pension-funds": { title: "קרן פנסיה | השוואה, ניוד ודמי ניהול | SEELD" },
  "/savings/gemel-funds": { title: "קופת גמל | SEELD" },
  "/savings/gemel-investment": { title: "קופת גמל להשקעה | SEELD" },
  "/savings/child-savings": { title: "חיסכון לכל ילד | SEELD" },
  "/savings/training-funds": { title: "קרן השתלמות | הטבות מס וניוד | SEELD" },
  "/savings/investment": { title: "תיקי השקעות | SEELD" },
  "/savings/pension-life-insurance": { title: "ביטוח מנהלים | SEELD" },
  "/savings/employer-funds": { title: "קופות מעסיק | SEELD" },
  "/savings/pre-retirement": { title: "היערכות לפרישה | SEELD" },
  "/savings/post-retirement": { title: "ניהול כספים אחרי פרישה | SEELD" },
  "/savings/financial-planning": { title: "תכנון פיננסי אישי | SEELD" },
  "/wellness": { title: "רווחה ואיזון | SEELD" },
  "/travel": { title: "טיולים ונסיעות | SEELD" },
  "/creativity": { title: "יצירתיות | SEELD" },
  "/growth": { title: "צמיחה אישית | SEELD" },
  "/agents": {
    title: "לסוכני ביטוח | פלטפורמת העבודה של SEELD",
    description: "פלטפורמה דיגיטלית לסוכני ביטוח: ניהול לקוחות, המלצות, מעקב ביצוע וכלי עבודה חכמים.",
  },
  "/onboarding": { title: "הצטרפות ל-SEELD" },
  "/direct-debit": { title: "הסדר תשלום | SEELD" },
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
    setRobots(NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/")));
  }, [pathname]);

  return null;
}
