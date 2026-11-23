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

import { CONTACTS, GENERAL_MAILBOX } from "../../lib/contacts";

export const SITE_URL = "https://seeld.co.il";
/** Bump when page content changes materially; feeds sitemap lastmod and schema dateModified. */
export const CONTENT_REVIEWED = "2026-11-21";

export type RouteKind =
  | "home" | "hub" | "insurance" | "savings" | "tool" | "data" | "info" | "legal" | "service" | "b2b" | "flow" | "blog-index" | "article";

export type LlmsGroup = "about" | "insurance" | "savings" | "tools" | "info" | "legal" | "guides";

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
    description: "שילד היא סוכנות ביטוח ופיננסים. ממפים את תיק הביטוח, הפנסיה והחיסכון, מבינים את האפשרויות ומלווים את הביצוע. אפיון צרכים ושיחת היכרות.",
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
    title: "אפיון צרכים | תמונה מסודרת של הביטוחים והחסכונות | SEELD",
    description: "אפיון צרכים: מיפוי כל הביטוחים והחסכונות, אפיון מקיף של התא המשפחתי, שיקוף האופציות בתמונת המוצרים הפיננסיים ומסמך החלטות בכתב, כולל גידור סיכונים. משאירים פרטים וחוזרים אליכם.",
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
    description: `דברו איתנו: טלפון ווטסאפ (ביטוח ${CONTACTS.insurance.phone}, פיננסים וכללי ${CONTACTS.general.phone}), מייל ${GENERAL_MAILBOX} או טופס פנייה. פגישת ייעוץ ראשונה, בלי התחייבות מצידכם.`,
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
  // ───────── Knowledge: guides and pension-tax chapters ─────────
  r({
    path: "/learn/guides", kind: "hub", group: "guides", changefreq: "weekly", priority: 0.7, pageType: "CollectionPage", parent: "/learn",
    title: "מדריכי שילד | פנסיה, פרישה והכסף בבית | SEELD",
    description: "מדריכים קצרים וברורים על פנסיה לשכירים ולעצמאים, קרנות השתלמות, תכנון פרישה, ניהול הון משפחתי וביטוח, עם דוגמאות להמחשה ומקורות.",
    related: ["/learn", "/faq", "/savings/retirement-planning", "/blog"],
  }),
  r({
    path: "/learn/pension-tax", kind: "info", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מיסוי החיסכון הפנסיוני | מדריכי שילד | SEELD",
    description: "איך מתנהל המס על חיסכון פנסיוני בשלוש תחנות: בהפקדה, בצבירה ובמשיכה. פרקים על גמל, השתלמות, פנסיה וקיבוע זכויות, ולוח מספרים מעודכן.",
    related: ["/learn/guides", "/savings/retirement-planning", "/faq"],
  }),
  // knowledge: guide pages (assembled)
  r({
    path: "/learn/guides/pension-fund-what-you-buy", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה קונים כשמפקידים לקרן פנסיה מקיפה | SEELD",
    description: "הסבר על ההבדל בין היתרה בקרן פנסיה מקיפה לבין קצבאות הנכות והשאירים בדוח, ועל מה כדאי לבדוק אחרי שינוי במשפחה או החלפת מסלול. לשכירים שמקבלים דוח פנסיה.",
    related: ["/learn/guides/employee-pension-contributions", "/learn/guides/pension-start-new-job", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/employee-pension-contributions", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "הפקדה לפנסיה של שכיר: שיעורים ושכר מבוטח | SEELD",
    description: "איך מחושבת ההפקדה לפנסיה של שכיר: אילו שיעורים משלמים העובד והמעסיק, מאיזה שכר מחשבים, ולמה הסכום שמנוכה בתלוש אינו כל ההפקדה. למי שמשווה בין התלוש לדוח הקרן.",
    related: ["/learn/guides/pension-start-new-job", "/learn/guides/section-14-severance-deposits", "/learn/guides", "/savings/employer-funds"],
  }),
  r({
    path: "/learn/guides/pension-start-new-job", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מתי מתחילה הפנסיה במקום עבודה חדש | SEELD",
    description: "מתי המעסיק החדש מתחיל להפקיד לפנסיה, מה משתנה כשאין ביטוח פנסיוני פעיל, ואיך שומרים על רצף הכיסוי בקרן בזמן ההמתנה. לשכירים שהחליפו עבודה.",
    related: ["/learn/guides/section-14-severance-deposits", "/learn/guides/pension-deducted-missing-in-fund", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/section-14-severance-deposits", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה סעיף ארבע־עשרה מכסה בהפקדות לפיצויים | SEELD",
    description: "הסבר לשכירים על מה שסעיף ארבע־עשרה מחליף בפועל כשהמעסיק מפקיד לפיצויים, מה לבדוק בדוח ובחוזה, ומה לבקש לפני גמר חשבון או התפטרות.",
    related: ["/learn/guides/pension-deducted-missing-in-fund", "/learn/guides/why-projected-pension-looks-low", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/pension-deducted-missing-in-fund", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "הפנסיה ירדה בתלוש והכסף לא נראה בקרן | SEELD",
    description: "מדריך לשכירים שרואים ניכוי פנסיה בתלוש ולא מוצאים הפקדה בקרן: איך בודקים לפי חודש השכר, מתי ההעברה מתבצעת ואיך פונים לקרן.",
    related: ["/learn/guides/why-projected-pension-looks-low", "/learn/guides/pension-fund-what-you-buy", "/learn/guides", "/savings/employer-funds"],
  }),
  r({
    path: "/learn/guides/why-projected-pension-looks-low", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "למה הקצבה הצפויה בדוח הפנסיה נראית נמוכה | SEELD",
    description: "הסבר לבעלי קרן פנסיה על הפער בין תחזית הקצבה בדוח השנתי לבין מחשבון, ומה כדאי לוודא לפני שמסיקים שחסר כסף.",
    related: ["/learn/guides/pension-fund-what-you-buy", "/learn/guides/employee-pension-contributions", "/learn/guides", "/calculators"],
  }),
  r({
    path: "/learn/guides/self-employed-mandatory-pension", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "כמה עצמאי חייב להפקיד לפנסיה ולפי איזה חישוב | SEELD",
    description: "הסבר על חובת ההפקדה לפנסיה של עצמאי: שתי מדרגות לפי ההכנסה השנתית ולא לפי המחזור, תנאי הגיל והרישום, ודוגמה מחושבת לעצמאים שרוצים להבין את הסכום.",
    related: ["/learn/guides/employee-and-self-employed-pension-top-up", "/learn/guides/pension-tax-saving-deduction-vs-credit", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/employee-and-self-employed-pension-top-up", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "שכיר ועצמאי: כמה להשלים לפנסיה בכל שנה | SEELD",
    description: "איך מחשבים השלמת פנסיה למי שעובד גם כשכיר וגם כעצמאי: חובת העצמאי, הפחתת הפקדות השכר, ומה נספר ומה לא. מתאים למי שיש לו משכורת והכנסה מעסק.",
    related: ["/learn/guides/pension-tax-saving-deduction-vs-credit", "/learn/guides/seasonal-business-pension", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/pension-tax-saving-deduction-vs-credit", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "ניכוי או זיכוי בהפקדה עצמאית לפנסיה | SEELD",
    description: "מה ההבדל בין ניכוי לזיכוי בהפקדה עצמאית לפנסיה, למה אסור לחבר את שתי התוצאות, ואיך מתרגמים הודעה על הטבת מס לסכום שנשאר בפועל בכיס.",
    related: ["/learn/guides/seasonal-business-pension", "/learn/guides/self-employed-mandatory-pension", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/seasonal-business-pension", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "פנסיה בעסק עונתי: חובת הפקדה מול כיסוי ביטוחי | SEELD",
    description: "מדריך לעצמאי שההכנסה שלו מתרכזת בכמה חודשים בשנה: איך חובת ההפקדה נקבעת, מה קורה לכיסוי הביטוחי בחודשי ההפסקה ואיזו שאלה כדאי לשלוח לקרן.",
    related: ["/learn/guides/self-employed-mandatory-pension", "/learn/guides/employee-and-self-employed-pension-top-up", "/learn/guides", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/guides/training-fund-value-in-job-offer", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "כמה שווה קרן השתלמות בהצעת עבודה לשכיר | SEELD",
    description: "איך קוראים הצעת עבודה שכוללת קרן השתלמות: על איזה שכר מפקידים, כמה מוסיף המעסיק וכמה יורד מהנטו, ומה לבקש כדי להשוות בין שתי הצעות.",
    related: ["/learn/guides/self-employed-training-fund-two-ceilings", "/learn/guides/training-fund-partial-withdrawal", "/learn/guides", "/savings/training-funds"],
  }),
  r({
    path: "/learn/guides/self-employed-training-fund-two-ceilings", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "שתי תקרות המס בקרן השתלמות של עצמאי | SEELD",
    description: "הסבר לעצמאי שמפקיד לקרן השתלמות: מה ההבדל בין תקרת הניכוי לתקרת ההפקדה המוטבת, איך זה נראה בדוגמה מספרית ומה קורה כשמפקידים בשתי קרנות.",
    related: ["/learn/guides/training-fund-partial-withdrawal", "/learn/guides/training-fund-tax-salary-and-business", "/learn/guides", "/savings/training-funds"],
  }),
  r({
    path: "/learn/guides/training-fund-partial-withdrawal", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה קורה בקרן השתלמות נזילה אחרי משיכה חלקית | SEELD",
    description: "מה נשאר נזיל בקרן ההשתלמות אחרי משיכה חלקית, מה קורה להפקדות החדשות ולוותק, ומה כדאי לבקש מהקרן לפני הגשת בקשה. למי שקיבל הודעה שהקרן נזילה.",
    related: ["/learn/guides/training-fund-tax-salary-and-business", "/learn/guides/training-fund-value-in-job-offer", "/learn/guides", "/savings/training-funds"],
  }),
  r({
    path: "/learn/guides/training-fund-tax-salary-and-business", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "הטבת מס בקרן השתלמות כשיש משכורת וגם עסק | SEELD",
    description: "איך מחשבים את ניכוי קרן ההשתלמות לעסק כששכיר מפעיל גם עסק, במה שונה הפטור על הרווחים, ואילו נתונים כדאי להביא ממחשבות השכר ומרואה החשבון.",
    related: ["/learn/guides/training-fund-value-in-job-offer", "/learn/guides/self-employed-training-fund-two-ceilings", "/learn/guides", "/savings/training-funds"],
  }),
  r({
    path: "/learn/guides/first-month-after-retirement-income", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מי ישלם את המשכורת בחודש הראשון לפרישה | SEELD",
    description: "איך בונים יומן הכנסות והוצאות לשנה הראשונה אחרי הפרישה ומזהים פער בין חודש המעבר לחודשים הרגילים. למי שמתכנן את המעבר מעבודה לקצבה.",
    related: ["/learn/guides/form-161-before-severance-decision", "/learn/guides/pension-tax-exemption-after-fixing-rights", "/learn/guides", "/savings/pre-retirement"],
  }),
  r({
    path: "/learn/guides/form-161-before-severance-decision", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה בודקים בטופס עזיבת העבודה לפני בחירה בפיצויים | SEELD",
    description: "מה כל חלק בטופס עזיבת העבודה מכיל, איך בחירה בין רצף קצבה, משיכה ורצף פיצויים משפיעה על הכסף, ומה כדאי לבדוק ולשמור לפני שמסמנים. למי שעוזב מקום עבודה.",
    related: ["/learn/guides/pension-tax-exemption-after-fixing-rights", "/learn/guides/survivors-pension-vs-guaranteed-payments", "/learn/guides", "/savings/retirement-planning"],
  }),
  r({
    path: "/learn/guides/pension-tax-exemption-after-fixing-rights", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "כמה מהפנסיה פטור ממס אחרי קיבוע זכויות | SEELD",
    description: "איך קיבוע זכויות מחלק את סל הפטור בין קצבה חודשית להיוון, איך נחשב הפטור המרבי בקצבה מזכה, ולמה מענקים שנמשכו בעבר משנים את התוצאה. למי שמתקרב לגיל הזכאות.",
    related: ["/learn/guides/survivors-pension-vs-guaranteed-payments", "/learn/guides/old-age-pension-while-working", "/learn/guides", "/savings/retirement-planning"],
  }),
  r({
    path: "/learn/guides/survivors-pension-vs-guaranteed-payments", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "קצבת שאירים או תקופת תשלומים מובטחים בפרישה | SEELD",
    description: "מה ההבדל בין קצבת שאירים לבן או לבת הזוג לבין תקופת תשלומים מובטחים, איך כל בחירה משפיעה על הקצבה ההתחלתית, ואילו השוואות כדאי לבקש מהקרן לפני תחילת הקצבה.",
    related: ["/learn/guides/old-age-pension-while-working", "/learn/guides/withdrawing-severance-between-jobs", "/learn/guides", "/savings/retirement-planning"],
  }),
  r({
    path: "/learn/guides/old-age-pension-while-working", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "קצבת אזרח ותיק והמשך עבודה אחרי גיל הפרישה | SEELD",
    description: "מה קורה לקצבת אזרח ותיק מביטוח לאומי כשממשיכים לעבוד: מבחן הכנסות לפי גיל, מה נחשב הכנסה, דחיית קצבה ומתי כדאי להגיש תביעה. לעובדים בגיל הפרישה.",
    related: ["/learn/guides/withdrawing-severance-between-jobs", "/learn/guides/first-month-after-retirement-income", "/learn/guides", "/savings/pre-retirement"],
  }),
  r({
    path: "/learn/guides/withdrawing-severance-between-jobs", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה עולה משיכת פיצויים בין שתי עבודות | SEELD",
    description: "המחיר של משיכת פיצויים מהחיסכון הפנסיוני בין שתי עבודות: ירידה ביתרה ובקצבה העתידית, ההשפעה על הפטור במס, ודרך להשוות חלופות לפני שמחליטים כמה למשוך.",
    related: ["/learn/guides/first-month-after-retirement-income", "/learn/guides/form-161-before-severance-decision", "/learn/guides", "/savings/retirement-planning"],
  }),
  r({
    path: "/learn/guides/family-wealth-how-much-available", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "שווי נקי מול כסף זמין בהון המשפחתי | SEELD",
    description: "ההבדל בין שווי נקי לנזילות בהון משפחתי, איך בונים טבלה של חמש שורות, איך נמנעים מכפל בספירה ולמה משפחה עם נכסים רבים יכולה להיתקע בתשלום קרוב.",
    related: ["/learn/guides/cash-reserve-when-income-varies", "/learn/guides/investment-provident-fund-ceiling-two-accounts", "/learn/guides", "/savings/financial-planning"],
  }),
  r({
    path: "/learn/guides/cash-reserve-when-income-varies", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "כמה כסף להשאיר נזיל כשהכנסה משתנה | SEELD",
    description: "איך מחשבים כרית חירום למשפחה שבה אחת ההכנסות משתנה: פער חודשי, תרחיש סביר, כסף שזמין בפועל, ומה לעשות עם מסגרת אשראי. למשפחות עם הכנסה עצמאית.",
    related: ["/learn/guides/investment-provident-fund-ceiling-two-accounts", "/learn/guides/deposit-or-money-market-fund-for-home", "/learn/guides", "/savings/financial-planning"],
  }),
  r({
    path: "/learn/guides/investment-provident-fund-ceiling-two-accounts", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "תקרת הפקדה לשתי קופות גמל להשקעה | SEELD",
    description: "תקרת ההפקדה לקופת גמל להשקעה נקבעת לאדם ולא לקופה. מה נספר במהלך השנה, במה היא שונה מהטבת מס, ומה כדאי לבדוק בדצמבר. למי שמחזיק קופות בכמה חברות.",
    related: ["/learn/guides/deposit-or-money-market-fund-for-home", "/learn/guides/savings-concentrated-same-stocks", "/learn/guides", "/savings/gemel-investment"],
  }),
  r({
    path: "/learn/guides/deposit-or-money-market-fund-for-home", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "פיקדון או קרן כספית לכסף שצריך לדירה | SEELD",
    description: "השוואה בין פיקדון בנקאי לקרן כספית שקלית יומית כשצריך את הכסף לתשלום על דירה: מועד הנגישות, מיסוי, סליקה ומה לשאול לפני שמחליטים. למי שמתכנן רכישה.",
    related: ["/learn/guides/savings-concentrated-same-stocks", "/learn/guides/sequence-of-returns-retirement-withdrawals", "/learn/guides", "/savings/financial-planning"],
  }),
  r({
    path: "/learn/guides/savings-concentrated-same-stocks", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "האם החסכונות מושקעים באותן מניות? | SEELD",
    description: "איך מחשבים כמה מהכסף המשפחתי חשוף לאותו מדד מניות בכל החשבונות יחד, ומה עושים עם המספר, למי שמחזיק קרנות ומסלולים אצל כמה גופים.",
    related: ["/learn/guides/sequence-of-returns-retirement-withdrawals", "/learn/guides/family-wealth-how-much-available", "/learn/guides", "/savings/investment"],
  }),
  r({
    path: "/learn/guides/sequence-of-returns-retirement-withdrawals", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "למה סדר התשואות משנה למי שמושך כסף בפרישה | SEELD",
    description: "דוגמה מספרית לשתי משפחות עם אותן תשואות בסדר הפוך ויתרות שונות, ומה כדאי לבדוק לפני שמתחילים למשוך כסף מתיק השקעות בפרישה.",
    related: ["/learn/guides/family-wealth-how-much-available", "/learn/guides/cash-reserve-when-income-varies", "/learn/guides", "/savings/risk-profile"],
  }),
  r({
    path: "/learn/guides/disability-pension-fund-or-private-insurance", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "נכות מקרן פנסיה או מפוליסת אובדן כושר עבודה | SEELD",
    description: "איך בודקים מי משלם כשאי אפשר להמשיך במקצוע: הגדרת העיסוק, השכר המבוטח, כללי קיזוז ותיאום, ומה לרכז לפני הגשת תביעה לשני הגופים.",
    related: ["/learn/guides/life-insurance-after-mortgage-paid", "/learn/guides/two-health-policies-one-receipt", "/learn/guides", "/insurance/disability"],
  }),
  r({
    path: "/learn/guides/life-insurance-after-mortgage-paid", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מה נשאר למשפחה אחרי שביטוח החיים סילק את המשכנתה | SEELD",
    description: "הסבר לבעלי משכנתה ולמשפחות: למי משולם הכסף בביטוח חיים למשכנתה, איך מחשבים את הפער החודשי שנשאר אחרי סילוק החוב ואילו פרטים בפוליסה כדאי לבדוק.",
    related: ["/learn/guides/two-health-policies-one-receipt", "/learn/guides/critical-illness-diagnosis-payout", "/learn/guides", "/insurance/life"],
  }),
  r({
    path: "/learn/guides/two-health-policies-one-receipt", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "שתי פוליסות בריאות וקבלה אחת: כמה מקבלים בחזרה | SEELD",
    description: "הסבר למי שמחזיק יותר מפוליסת בריאות אחת: ההבדל בין שיפוי לפיצוי, איך מחושב החזר כשיש כפל כיסוי ומה בודקים לפני שמבטלים כיסוי קיים.",
    related: ["/learn/guides/critical-illness-diagnosis-payout", "/learn/guides/disability-pension-fund-or-private-insurance", "/learn/guides", "/insurance/health"],
  }),
  r({
    path: "/learn/guides/critical-illness-diagnosis-payout", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/guides",
    title: "מתי אבחנה רפואית מזכה בפיצוי במחלות קשות | SEELD",
    description: "הסבר למבוטחים ולבני משפחתם: איך בודקים בפוליסה אם אבחנה עומדת בהגדרה, איזה דף לפתוח קודם ואיזה מידע לבקש מהרופא לפני הגשת תביעה.",
    related: ["/learn/guides/disability-pension-fund-or-private-insurance", "/learn/guides/life-insurance-after-mortgage-paid", "/learn/guides", "/insurance/critical-illness"],
  }),
  r({
    path: "/learn/pension-tax/three-tax-stations", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "שלוש תחנות המס של החיסכון הפנסיוני | SEELD",
    description: "איך כל מוצר פנסיוני ממוסה בהפקדה, בצבירה ובמימוש, ואיך שנת ההפקדה משנה את הכללים. הסבר לחוסכים שרוצים להבין איפה ההטבה ואיפה המס.",
    related: ["/learn/pension-tax/provident-funds", "/learn/pension-tax/training-funds", "/learn/pension-tax", "/savings/retirement-planning"],
  }),
  r({
    path: "/learn/pension-tax/provident-funds", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "קופת גמל וגמל להשקעה: מה פטור ממס ומה חייב | SEELD",
    description: "איך ממוסות קופות גמל לפי שכבות ההפקדה, מה ההטבה בהפקדה לשכיר ולעצמאי, ומה היתרון של גמל להשקעה. לחוסכים שרוצים להבין את התיק לפני משיכה או ניוד.",
    related: ["/learn/pension-tax/three-tax-stations", "/learn/pension-tax/training-funds", "/learn/pension-tax", "/savings/gemel-funds"],
  }),
  r({
    path: "/learn/pension-tax/training-funds", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "קרן השתלמות: הפקדה, פטור ומשיכה מוקדמת | SEELD",
    description: "מה התקרות והפטורים בקרן השתלמות לשכיר ולעצמאי, מתי אפשר למשוך בפטור ומה קורה במשיכה לפני תום הוותק. למי שמחזיק קרן ורוצה להבין את הכללים.",
    related: ["/learn/pension-tax/provident-funds", "/learn/pension-tax/pension-funds", "/learn/pension-tax", "/savings/training-funds"],
  }),
  r({
    path: "/learn/pension-tax/managers-insurance", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "ביטוח מנהלים: למה הדור של הפוליסה קובע את ערכה | SEELD",
    description: "מה ההבדל בין דורות של פוליסות ביטוח מנהלים, איך מתנהלים שכבות המס ומרכיב הפיצויים, ומה כדאי לבדוק לפני פדיון או ניוד. למי שמחזיק פוליסה ישנה.",
    related: ["/learn/pension-tax/pension-funds", "/learn/pension-tax/three-tax-stations", "/learn/pension-tax", "/savings/pension-life-insurance"],
  }),
  r({
    path: "/learn/pension-tax/pension-funds", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "קרן פנסיה חדשה או ותיקה: מה שונה ביניהן | SEELD",
    description: "השוואה בין קרן פנסיה חדשה לקרן ותיקה: איך נבנות הזכויות, מה תקרת ההפקדה, איך בוחרים מסלול פרישה ומה בודקים בקרן ותיקה. למי שמחזיק קרן פנסיה ורוצה להבין אותה.",
    related: ["/learn/pension-tax/managers-insurance", "/learn/pension-tax/realization-fixing-rights-190", "/learn/pension-tax", "/savings/pension-funds"],
  }),
  r({
    path: "/learn/pension-tax/realization-fixing-rights-190", kind: "article", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "קיבוע זכויות, היוון ותיקון מאה תשעים בפרישה | SEELD",
    description: "איך הופכים חיסכון פנסיוני לקצבה או להון: קיבוע זכויות, נוסחת הקיזוז של מענקים, היוון, תיקון מאה תשעים והחזר מס רטרואקטיבי. למי שמתקרב לפרישה ורוצה להבין מה פטור ממס.",
    related: ["/learn/pension-tax/pension-funds", "/learn/pension-tax/numbers", "/learn/pension-tax", "/savings/post-retirement"],
  }),
  r({
    path: "/learn/pension-tax/numbers", kind: "data", group: "guides", changefreq: "monthly", priority: 0.6, parent: "/learn/pension-tax",
    title: "לוח המספרים של החיסכון הפנסיוני | SEELD",
    description: "כל התקרות, הסכומים והשיעורים של מדור המס בחיסכון הפנסיוני בלוח אחד, עם יחידת המידה והבסיס החוקי של כל נתון, לשימוש מי שבודק או משווה.",
    related: ["/learn/pension-tax/three-tax-stations", "/learn/pension-tax/realization-fixing-rights-190", "/learn/pension-tax", "/savings/retirement-planning"],
  }),
  r({
    path: "/rights-extraction", kind: "service", group: "about", changefreq: "monthly", priority: 0.7,
    title: "מיצוי זכויות | החזרי מס, קצבאות וכספים שנשכחו | SEELD",
    description: "בדיקת זכויות וכספים שנשכחו: החזרי מס, קצבאות ביטוח לאומי, הטבות מס לעצמאים וקופות פנסיוניות. הבדיקה נעשית בשיחה אישית.",
    related: ["/portfolio-review", "/savings/pension-funds", "/contact"],
  }),
  r({
    path: "/forms", kind: "service", group: "about", changefreq: "monthly", priority: 0.7,
    title: "שאלונים ומסמכים | הזמנת מידעים, פרטים, בריאות, פיננסי ואפיון סיכון | SEELD",
    description: "מקום אחד למילוי השאלונים של שילד: הזמנת מידעים בייפוי כוח, פרטים אישיים ומסמכים, שאלון בריאות, שאלון פיננסי ומורחב ואפיון סיכון. ממלאים בזה אחר זה, והצוות מקבל הכול מסודר.",
    related: ["/portfolio-review", "/rights-extraction", "/direct-debit", "/contact"],
  }),
  // /forms/:card (the flow itself) is noindex and never in the sitemap: a personal-data flow, not a page.
  // /onboarding is a redirect to the POA wizard (/report/start/order?from=join, noindex) since 2026-11-22: not a page.
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
    description: "ביטוח בריאות, חיים וסיעוד: המידע, הכלים וההשוואות במקום אחד, עם אפשרות לתאם פגישה ולבקש אפיון צרכים.",
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
    related: ["/return-tables", "/savings/pension-funds", "/savings/training-funds", "/fund-finder", "/savings/risk-profile"],
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
  r({
    path: "/savings/risk-profile", kind: "tool", group: "tools", changefreq: "monthly", priority: 0.7, parent: "/savings",
    title: "אפיון רמת סיכון למשקיע | ארבע שאלות על האופי שלכם | SEELD",
    description: "ארבע שאלות קצרות על האופי שלכם כמשקיעים: איך אתם מגיבים לירידות, לתנודות ולהחמצה. התוצאה היא אפיון של רמת סיכון נמוכה, בינונית או גבוהה, ולצידה משפחות מסלולי ההשקעה ומדיניות ההשקעה שלהן. זה אפיון ולא המלצה.",
    related: ["/investment-tracks", "/return-tables", "/savings/gemel-investment", "/savings/pension-funds"],
  }),

  // ───────── Retirement planning section (landing + four step pages) ─────────
  r({
    path: "/savings/retirement-planning", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.8, parent: "/savings",
    title: "תכנון פרישה | אפיון צרכים, מיפוי התיק והחלטות בכתב | SEELD",
    description: "תכנון פרישה לבני 55 ומעלה ולילדיהם: אפיון צרכים ואפיון מקיף של התא המשפחתי, כרטיס לכל קופה ופוליסה, החלטות בכתב וביצוע מדורג. שיחת היכרות ראשונה, בלי התחייבות.",
    related: ["/savings/retirement-planning/how-it-works", "/savings/retirement-planning/case-study", "/savings/retirement-planning/faq", "/savings/pre-retirement", "/savings/post-retirement"],
  }),
  r({
    path: "/savings/retirement-planning/how-it-works", kind: "savings", group: "savings", changefreq: "monthly", priority: 0.6, parent: "/savings/retirement-planning",
    title: "איך זה עובד | תהליך תכנון פרישה בחמישה שלבים | SEELD",
    description: "תהליך תכנון פרישה בחמישה שלבים: פגישת היכרות, מיפוי מלא של התיק, בדיקות ובירורים, פגישת החלטות וביצוע מדורג, כשכל החלטה נרשמת בכתב.",
    related: ["/savings/retirement-planning", "/savings/retirement-planning/case-study", "/savings/retirement-planning/contact"],
  }),
  r({
    path: "/savings/retirement-planning/case-study", kind: "info", group: "savings", changefreq: "monthly", priority: 0.6, parent: "/savings/retirement-planning",
    title: "סיפור מהשטח | תיק פרישה של זוג פנסיונרים, הפרטים שונו | SEELD",
    description: "מקרה מהשטח, הפרטים שונו: מיפוי תיק פנסיוני של זוג בני 78 ו־72, מה נמצא בו ואיך התקבלו ההחלטות, בכתב ושלב אחרי שלב. מקרה אחד, לא תוצאה אופיינית.",
    related: ["/savings/retirement-planning", "/savings/retirement-planning/how-it-works", "/savings/retirement-planning/faq"],
  }),
  r({
    path: "/savings/retirement-planning/faq", kind: "info", group: "savings", changefreq: "monthly", priority: 0.6, parent: "/savings/retirement-planning",
    title: "שאלות נפוצות על תכנון פרישה | קיבוע זכויות, קצבה והחזרי מס | SEELD",
    description: "תשובות בשפה פשוטה לשאלות שלקוחות שאלו: קיבוע זכויות (טופס 161ד), איחוד קופות, קצבה מול הון, פוליסות ישנות, מוטבים ומה קורה כשילדים מסדרים את ענייני ההורים.",
    related: ["/savings/retirement-planning", "/savings/retirement-planning/contact", "/faq"],
  }),
  r({
    path: "/savings/retirement-planning/contact", kind: "service", group: "savings", changefreq: "monthly", priority: 0.7, parent: "/savings/retirement-planning",
    title: "שיחת היכרות לתכנון פרישה | SEELD",
    description: "שיחת היכרות ראשונה לתכנון פרישה, בלי התחייבות: משאירים פרטים בטופס קצר, מישהו מהצוות חוזר לתיאום, ואפשר להוריד את רשימת ההכנה לתכנון פרישה.",
    related: ["/savings/retirement-planning", "/savings/retirement-planning/how-it-works", "/contact"],
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
