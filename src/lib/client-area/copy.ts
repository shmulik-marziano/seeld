// Every visible string of the client area (האזור האישי). Verbatim from docs/product/CLIENT-AREA-SPEC.md (the copy test
// checks it). Site copy rules: no "ייעוץ", no "בטוח", no promises, no gendered slash forms, no names, no licence text.
import type { CategoryKey, DocKind } from "./config";
import type { HarbReason } from "./api";

export const MY_COPY = {
  common: {
    pageTitle: "האזור האישי · שילד",
    eyebrow: "האזור האישי שלכם",
    loading: "רגע…",
    logout: "יציאה",
    navLabel: "ניווט באזור האישי",
    nav: { home: "ראשי", portfolio: "התיק שלי", documents: "מסמכים" },
    contact: "לדבר עם הסוכן",
    back: "חזרה",
  },
  login: {
    title: "כניסה לאזור האישי",
    lead: "מזהים אתכם לפי תעודת הזהות והנייד שרשומים אצלנו, ושולחים קוד לנייד. בלי סיסמה.",
    idLabel: "מספר תעודת זהות",
    idErr: "צריך מספר תעודת זהות תקין, 9 ספרות",
    phoneLabel: "טלפון נייד",
    phoneErr: "צריך מספר נייד שמתחיל ב־05",
    cta: "שליחת קוד לנייד",
    privacy: "הפרטים משמשים לזיהוי בלבד ולא נשמרים בדפדפן.",
    joinLine: "עדיין לא רשומים?",
    joinLink: "מצטרפים בדקה",
    sentTitle: "שלחנו קוד",
    sentLead: (tail: string) => `אם הפרטים תואמים למה שרשום אצלנו, קוד בן 6 ספרות נשלח לנייד שמסתיים ב־${tail}.`,
    codeLabel: "הקוד מההודעה",
    codeErr: "צריך להקליד את 6 הספרות מההודעה",
    verifyCta: "כניסה",
    resend: "לא הגיע? שליחה חוזרת",
    resendWait: (sec: number) => `אפשר לבקש קוד חדש בעוד ${sec} שניות`,
    wrongCode: "הקוד לא נכון. נסו שוב.",
    wrongCodeLeft: (n: number) => `הקוד לא נכון. נשארו ${n} ניסיונות.`,
    maxTries: "יותר מדי ניסיונות. בקשו קוד חדש.",
    expired: "הקוד פג. בקשו קוד חדש.",
    editDetails: "תיקון הפרטים",
  },
  home: {
    title: (first: string) => `שלום, ${first}`,
    lead: "כאן רואים את המוצרים שלכם במקום אחד, כפי שדווחו לנו מהגופים.",
    asOf: (date: string) => `נכון ל־${date}`,
    noData: "עדיין אין נתונים בתיק. כשהמידע יגיע מהגופים הוא יופיע כאן.",
    summaryTitle: "התיק במבט",
    productsCount: (n: number) => `${n} מוצרים`,
    cta: "לכל התיק",
    docsCta: "למסמכים",
    sessionLine: (date: string) => `ההתחברות תקפה עד ${date}.`,
  },
  portfolio: {
    title: "התיק שלי",
    lead: "לפי קטגוריה. לחיצה על מוצר פותחת את הפרטים.",
    empty: "אין מוצרים להצגה.",
    labels: { company: "חברה", policy: "מספר", source: "מקור", status: "סטטוס", balance: "יתרה", premium: "פרמיה", coverage: "סכום ביטוח", period: "תקופה", track: "מסלול" },
    frequency: { חודשית: "לחודש", שנתית: "לשנה", חד_פעמית: "חד־פעמי", רבעונית: "לרבעון", חצי_שנתית: "לחצי שנה" } as Record<string, string>,
    categories: {
      pension: "פנסיה", gemel: "קופות גמל", hishtalmut: "קרנות השתלמות", insurance_life: "ביטוח חיים",
      insurance_health: "בריאות וסיעוד", insurance_general: "ביטוח כללי", savings: "חיסכון והשקעות", other: "אחר",
    } satisfies Record<CategoryKey, string>,
    sources: {
      מסלקה_פנסיונית: "המסלקה הפנסיונית", הר_הביטוח: "הר הביטוח", פרודוקציה_פרט: "דיווח החברה", הקמה_עצמית: "הוזן על ידי הסוכנות",
    } as Record<string, string>,
  },
  documents: {
    title: "המסמכים שלי",
    lead: "ייפויי הכוח שחתמתם ומסמכים מהתיק.",
    empty: "אין מסמכים עדיין.",
    download: "הורדה",
    opening: "פותחים…",
    notDownloadable: "זמין דרך הסוכנות",
    kinds: { maslaka: "ייפוי כוח מסלקה", harbit: "ייפוי כוח הר הביטוח", policies: "ייפוי כוח העתקי פוליסות", surense: "מסמך מהתיק" } satisfies Record<DocKind, string>,
  },
  harb: {
    title: "קובץ הר הביטוח",
    lead: "הר הביטוח הוא המאגר הממשלתי של הביטוחים שלכם. הקובץ משם משלים את התמונה בתיק.",
    stepsTitle: "איך מורידים את הקובץ",
    steps: [
      "נכנסים לאתר הר הביטוח ומזדהים בהזדהות הממשלתית.",
      "בדף התוצאות לוחצים על \"יצוא לאקסל\" ושומרים את הקובץ.",
      "חוזרים לכאן, בוחרים את הקובץ ושולחים.",
    ],
    siteLink: "לאתר הר הביטוח",
    cta: "שליחת הקובץ",
    sending: "שולחים…",
    received: "הקובץ התקבל. תודה!",
    duplicate: "את הקובץ הזה כבר קיבלנו.",
    last: (date: string) => `הקובץ האחרון התקבל ב־${date}.`,
    processed: "הנתונים נקלטו בתיק.",
    privacy: "הקובץ נבדק ונשמר אצלנו, ומשמש רק לתיק שלכם.",
    closed: "שליחת הקובץ סגורה כרגע.",
    reasons: {
      not_xlsx: "זה לא קובץ האקסל של הר הביטוח. כדאי להוריד אותו שוב.",
      too_large: "הקובץ גדול מדי.",
      too_many_sheets: "לא הצלחנו לקרוא את הקובץ. כדאי להוריד אותו שוב מהאתר.",
      too_many_rows: "לא הצלחנו לקרוא את הקובץ. כדאי להוריד אותו שוב מהאתר.",
      bad_layout: "לא הצלחנו לקרוא את הקובץ. כדאי להוריד אותו שוב מהאתר.",
      bad_file: "לא הצלחנו לקרוא את הקובץ. כדאי להוריד אותו שוב מהאתר.",
      empty: "בקובץ לא מופיעות פוליסות, אז אין מה לשלוח.",
      id_mismatch: "הקובץ שייך לתעודת זהות אחרת. אפשר לשלוח רק את הקובץ שלכם.",
    } satisfies Record<HarbReason, string>,
  },
  errors: {
    inactive: "האזור האישי סגור כרגע",
    unavailable: "השירות אינו זמין כרגע",
    unavailableText: "נסו שוב בעוד כמה רגעים",
    generic: "משהו השתבש",
    retry: "נסו שוב",
    sessionEnded: "ההתחברות הסתיימה. נכנסים שוב.",
    toLogin: "לכניסה",
  },
} as const;

/** Every visible string, for the copy tests. */
export function myAllStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (typeof v === "function") return;
    else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
  };
  walk(MY_COPY);
  return out;
}
