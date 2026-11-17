// Warm micro-copy: why we ask (private questions) and a calm line per section. No promises, no legal claims, no names.
import type { Question } from "./types";

export function whyWeAsk(q: Question, questionnaireKey: string): string | null {
  if (questionnaireKey === "health" || /בירור בריאותי|מידע בריאותי|אשפוז|תרופות/.test(q.section) || q.key.startsWith("medical_")) {
    return "אנחנו שואלים כדי שהצוות יוכל להתכונן לשיחה. אין כאן הערכה ואין ייעוץ רפואי, ואפשר לדלג על מה שלא נוח.";
  }
  if (q.format === "israeli-id" || q.key === "dd_holder_id") return "מספר הזהות עוזר לנו לזהות אתכם מול חברות הביטוח בלי לבלבל בין אנשים.";
  if (/income|salary|turnover|monthly_budget|balance|amount|deposit/i.test(q.key) || /הכנסה|שכר|סכום|יתרה/.test(q.label)) {
    return "הסכומים עוזרים לנו להתאים הצעות למצב שלכם. אפשר לתת הערכה, ואפשר לסמן 'לא יודע/ת'.";
  }
  if (q.key === "bank_account" || /bank|branch|account/.test(q.key)) return "פרטי החשבון נאספים כדי להכין את הטיפול. מסירתם כאן אינה הרשאה לחיוב.";
  if (q.key === "height" || q.key === "weight") return "גובה ומשקל הם חלק מהמידע הרגיל שחברות הביטוח מבקשות. אנחנו רק אוספים את המספרים.";
  if (q.format === "phone" || q.format === "email") return "כדי שנוכל לחזור אליכם בדרך שנוחה לכם.";
  return null;
}

const SECTION_COPY: [RegExp, string][] = [
  [/אמצעי תשלום/, "רגע קצר על התשלום. מה שלא ידוע עדיין, אפשר להשאיר לשיחה."],
  [/תשלום הביטוח/, "כמה שאלות על מי משלם, כדי שלא יהיו הפתעות בהמשך."],
  [/פרטים אישיים/, "נתחיל מההיכרות. שמות ומסמך מזהה, כמו שהם מופיעים במסמך."],
  [/קשר וכתובת/, "איך נוח לכם שניצור קשר, ואיפה אתם גרים."],
  [/משפחה/, "קצת על המשפחה. כל שורה מתמלאת בנפרד, ואפשר להוסיף ולמחוק."],
  [/תעסוקה/, "עבודה והכנסה, כדי להבין את התמונה הכללית."],
  [/תושבות/, "שאלה קצרה על מקום המגורים."],
  [/קופת חולים/, "באיזו קופה אתם, ואם יש ביטוח משלים."],
  [/מטרות והעדפות/, "מה חשוב לכם. אין תשובה נכונה, זו רק נקודת פתיחה לשיחה."],
  [/סינון ראשוני/, "שאלה אחת לכל תחום. 'לא' מספיק, ורק על 'כן' נשאל עוד."],
  [/מידע גופני/, "שני מספרים פשוטים."],
  [/אורח חיים/, "כמה שאלות כלליות על הרגלים."],
  [/בירור צרכים/, "בלי תשובות נכונות או לא נכונות, רק כיוון לשיחה."],
];
export function sectionCopy(title: string): string | null {
  return SECTION_COPY.find(([re]) => re.test(title))?.[1] ?? null;
}

export const HEALTH_PRIVACY_NOTE = "המידע הבריאותי לא נשמר מראש, לא נשלח לשום מקום בשלב זה, ונמחק מהדפדפן כשסוגרים או לוחצים 'ניקוי'.";
export const NOT_SENT_NOTICE = "בשלב זה התשובות לא נשלחות ולא נשמרות בשרת. הן נשארות רק בדפדפן הזה, ונמחקות בסיום או בלחיצה על 'ניקוי'.";
