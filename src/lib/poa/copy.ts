// Every user-visible string of the POA wizard. Screens text is copied verbatim from
// docs/product/POA-WIZARD-SPEC.md §2 ("הנוסח המדויק לכל מסך"); src/test/poa-copy.test.ts checks each spec string
// against the spec file and scans everything here for the site's copy rules (the forbidden-word list, no names,
// no licence, no gendered slash suffixes, plural neutral forms).
// Strings marked "not in spec" have no wording in the spec (field labels, back button, loading, aria labels,
// placeholder template values); they are listed in the PR description for the owner.
// The browser never holds legal text: the document itself is the PDF the adapter returns.
import type { PoaEntry, PoaKind } from "./config";

export const POA_COPY = {
  s0: {
    eyebrow: "פתיחת תיק בשילד",
    title: "כמה פרטים, שלושה אישורים, והמידע מגיע אלינו",
    /** First line, by the entry context (`?from=`, spec ס0 "נקודות כניסה"). */
    lead: {
      default: "כדי לבדוק את התיק שלכם כמו שצריך, אנחנו צריכים את המידע מהגופים עצמם. זה מה שקורה כאן.",
      insurance: "ביקשתם שנבדוק את הביטוחים שלכם. כדי לעשות את זה כמו שצריך, אנחנו צריכים את המידע מהגופים עצמם. זה מה שקורה כאן.",
      finance: "ביקשתם שנבדוק את הפנסיה והחיסכון שלכם. כדי לעשות את זה כמו שצריך, אנחנו צריכים את המידע מהגופים עצמם. זה מה שקורה כאן.",
      portfolio: "ביקשתם שנבדוק את התיק שלכם. כדי לעשות את זה כמו שצריך, אנחנו צריכים את המידע מהגופים עצמם. זה מה שקורה כאן.",
      join: "ברוכים הבאים לשילד. כדי שנוכל לטפל בתיק שלכם, אנחנו צריכים את המידע מהגופים עצמם. זה מה שקורה כאן.",
    } satisfies Record<PoaEntry, string>,
    body: "המסלקה הפנסיונית, הר הביטוח וחברות הביטוח מוסרים מידע רק עם ייפוי כוח חתום שלכם. ממלאים כאן כמה פרטים ומאשרים שלושה מסמכים, וזה לוקח כמה דקות.",
    prepareTitle: "מה צריך להכין",
    prepareLine: "תעודת הזהות עצמה, כי נבקש את תאריך ההנפקה",
    note: "בשלב האחרון חותמים באצבע או בעכבר. אם זה לא מתאים לכם, אפשר לחתום יחד איתנו.",
    cta: "מתחילים",
  },
  s1: {
    title: "כמה פרטים מזהים",
    lead: "הפרטים יופיעו בייפויי הכוח כפי שהם רשומים בתעודת הזהות.",
    why: "כל אחד מהגופים מזהה אתכם לפי מספר הזהות. המספר נשמר אצלנו מוצפן, ומופיע רק בתוך ייפויי הכוח עצמם.",
    // labels: not in spec (the words come from the spec's own error strings)
    labelFirst: "שם פרטי",
    labelLast: "שם משפחה",
    labelId: "מספר תעודת זהות",
    errFirst: "צריך למלא שם פרטי",
    errLast: "צריך למלא שם משפחה",
    errId: "צריך למלא מספר תעודת זהות",
    cta: "המשך",
  },
  s2: {
    title: "איך ליצור איתכם קשר",
    lead: "לנייד נחזור אליכם לפני הפנייה לגופים.",
    labelPhone: "טלפון נייד",
    labelEmail: "דוא\"ל (לא חובה)",
    /** "קראתי ואישרתי את תנאי השימוש ומדיניות הפרטיות", split so the two links open in a new tab */
    termsParts: ["קראתי ואישרתי את ", "תנאי השימוש", " ו", "מדיניות הפרטיות"],
    marketing: "אשמח לקבל עדכונים ומידע שיווקי",
    errPhone: "צריך מספר נייד שמתחיל ב־05",
    errTerms: "כדי להמשיך צריך לאשר את תנאי השימוש ומדיניות הפרטיות.",
    // not in spec: the spec gives ס2 no button wording; reuses ס1's "המשך" (owner sign-off)
    cta: "המשך",
  },
  s2a: {
    title: "הפרטים שיופיעו במסמכים",
    // row labels: not in spec as labels (the spec says "מוצגים שם, ת"ז ונייד")
    labelName: "שם",
    labelId: "ת\"ז",
    labelPhone: "נייד",
    fix: "תיקון",
    cta: "אישור הפרטים והמשך",
  },
  card: {
    labels: { whom: "למי פונים", scope: "איזה מידע", validity: "תוקף", revoke: "אפשר לבטל" },
    fixedLine: "במסמך מופיע בעל הרישיון שמטפל בתיק שלכם.",
    view: "צפייה במסמך",
  },
  s4: {
    title: "המסלקה הפנסיונית",
    lead: "מכאן מגיע המידע על הפנסיה, קופות הגמל וקרנות ההשתלמות שלכם.",
    check: "קראתי את המסמך ואישרתי את הפנייה למסלקה הפנסיונית בשמי",
    err: "כדי להמשיך צריך לסמן את האישור.",
    cta: "אישור והמשך",
  },
  s5: {
    title: "הר הביטוח",
    lead: "מכאן מגיע המידע על הביטוחים שלכם בכל החברות.",
    why: "הר הביטוח מבקש את תאריך ההנפקה כדי לזהות אתכם. התאריך מודפס על תעודת הזהות.",
    // labels: not in spec (the words come from the spec's own error strings)
    labelBirth: "תאריך לידה",
    labelIssue: "תאריך הנפקה",
    check: "קראתי את המסמך ואישרתי את הפנייה להר הביטוח בשמי",
    errBirth: "צריך להזין תאריך לידה",
    errIssue: "צריך להזין את תאריך ההנפקה",
    errOrder: "תאריך ההנפקה מוקדם מתאריך הלידה, כדאי לבדוק שוב.",
    // not in spec (owner sign-off): the date validator's failures, mapped here so every visible string lives in this file
    errDate: "התאריך לא נראה תקין, כדאי לבדוק שוב",
    errFuture: "התאריך הזה עוד לא הגיע, כדאי לבדוק שוב",
    errAge: "נדרש גיל 18 ומעלה",
    // not in spec (owner sign-off): the spec gives ס5 no button or missing-check wording; both reuse ס4's
    errCheck: "כדי להמשיך צריך לסמן את האישור.",
    cta: "אישור והמשך",
  },
  s6: {
    title: "העתקי הפוליסות",
    lead: "כדי לבדוק את פרטי הכיסוי, נבקש מחברות הביטוח העתק של הפוליסות שלכם ושל ילדיכם הקטינים.",
    declaration: "קראתי את המסמך, ובחתימתי אישרתי את הפנייה לחברות הביטוח לקבלת העתקי הפוליסות שלי ושל ילדיי הקטינים.",
    minorsLine: "אם אין לכם ילדים קטינים, האישור חל עליכם בלבד.",
    sigLabel: "חתימה על ייפוי כוח פוליסות",
    altSign: "אין אפשרות לחתום על המסך? אפשר לחתום יחד איתנו",
    err: "צריך לחתום במסגרת כדי להמשיך.",
    cta: "חתימה וסיום",
    // not in spec (owner sign-off): the signature pad's own hint and buttons, inherited from the questionnaires pad
    sigHint: "חותמים כאן באצבע או בעכבר",
    sigUndo: "ביטול הקו האחרון",
    sigClear: "ניקוי החתימה",
  },
  s7: {
    title: "קיבלנו את האישורים",
    methodCheck: "סימון",
    methodSign: "חתימה",
    // row labels: "שעה" not in spec as a label; "תוקף" is the card label
    labelTime: "שעה",
    labelValidity: "תוקף",
    download: "הורדה",
    downloadNote: "אפשר להוריד עותק עכשיו, במשך חצי שעה. אחר כך העותק שמור אצלנו, ואפשר לבקש אותו בפנייה אלינו.",
    nextTitle: "מה קורה עכשיו",
    next1: "צוות הסוכנות בודק את הפרטים ויוצר איתכם קשר לפני הפנייה לגופים.",
    next2: "כשהמידע מגיע, הצוות מסדר אותו בדוח.",
    keptLine: "עותק חתום נשמר אצלנו בתיק הלקוח.",
    afterReload: "לעותק נוסף צרו קשר",
  },
  s8: {
    inactive: "הקישור אינו פעיל",
    unavailable: "השירות אינו זמין כרגע",
    unavailableText: "נסו שוב בעוד כמה רגעים",
    generic: "משהו השתבש",
    genericAction: "נסו שוב",
    /** spec: "הזמן לתהליך הסתיים. האישורים ..." — first sentence as the title, the rest as the line */
    expiredTitle: "הזמן לתהליך הסתיים",
    expiredText: "האישורים שכבר נתתם שמורים אצלנו, וכדי להשלים את השאר מתחילים שוב, זה לוקח דקה.",
    expiredAction: "מתחילים שוב",
    /** spec: "מטעמי אבטחה עצרנו את התהליך. צרו איתנו קשר ונמשיך יחד" — split the same way */
    lockedTitle: "מטעמי אבטחה עצרנו את התהליך",
    lockedText: "צרו איתנו קשר ונמשיך יחד",
    completed: "התהליך כבר הושלם",
    warn: "להמשיך? התהליך יסתיים בעוד 2 דקות",
    warnAction: "ממשיכים",
  },
  common: {
    // not in spec
    back: "חזרה",
    loading: "טוענים…",
    progressLabel: "התקדמות בתהליך",
    navLabel: "ניווט בתהליך",
    pageTitle: "פתיחת תיק · שילד",
    datePlaceholder: "dd/mm/yyyy",
  },
  /** Display title of each document (spec §1 wording). The server template will own it (spec §1, §4). */
  docTitle: {
    maslaka: "ייפוי כוח מסלקה",
    harbit: "ייפוי כוח הר הביטוח",
    policies: "ייפוי כוח העתקי פוליסות",
  } satisfies Record<PoaKind, string>,
  /** Mock adapter only: the mark on the generated draft PDF (spec §3). */
  draftMark: "טיוטה, טרם אושר",
  /** Mock adapter only: the draft PDF's /Author (spec §4: the agency, no names) */
  draftAuthor: "הסוכנות",
} as const;

/** "שלב N מתוך M" (spec §2, progress indicator). */
export const poaStep = (n: number, m: number) => `שלב ${n} מתוך ${m}`;

export type CardRowKey = keyof typeof POA_COPY.card.labels;
export interface PoaTemplate { approved: boolean; rows: Record<CardRowKey, string> }

/**
 * Placeholder template (not in spec): the real rows come from the approved server template
 * (supabase/functions/_shared/poa/{kind}.json, spec §4). approved=false hides the validity and scope rows (spec §4),
 * and a row with no template value (empty string) is never shown. The "whom" values are the body names from the
 * spec's ס0 line (owner sign-off before the switch goes on).
 */
export const POA_TEMPLATE_PLACEHOLDER: Record<PoaKind, PoaTemplate> = {
  maslaka: { approved: false, rows: { whom: "המסלקה הפנסיונית", scope: "", validity: "", revoke: "" } },
  harbit: { approved: false, rows: { whom: "הר הביטוח", scope: "", validity: "", revoke: "" } },
  policies: { approved: false, rows: { whom: "חברות הביטוח", scope: "", validity: "", revoke: "" } },
};

/** Every string above, flattened, for the copy tests. */
export function poaAllStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(POA_COPY);
  walk(POA_TEMPLATE_PLACEHOLDER);
  out.push(poaStep(1, 6));
  return out;
}
