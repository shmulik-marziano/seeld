// Client download guides. Sources are listed in docs/product/REPORTS.md. Official sites block automated fetching (HTTP 403),
// so every step comes from public guides written about them; each step that could not be confirmed on the official page carries todoVerify.
export interface GuideStep { title: string; text: string; todoVerify?: boolean }
export interface Guide {
  id: "har" | "maslaka";
  title: string;
  fileLabel: string;
  art: string;
  steps: GuideStep[];
  notes: string[];
  sources: { label: string; url: string }[];
}

export const GUIDES: Guide[] = [
  {
    id: "har",
    title: "איך מורידים את קובץ הר הביטוח",
    fileLabel: "קובץ אקסל (xlsx) מהר הביטוח",
    art: "29-onboarding-door",
    steps: [
      { title: "פותחים את האתר הרשמי", text: "הכתובת היא harb.cma.gov.il, האתר של רשות שוק ההון, ביטוח וחיסכון. כדאי לוודא שהכתובת מסתיימת ב-gov.il." },
      { title: "מזדהים דרך ההזדהות הלאומית", text: "מקלידים מספר זהות וסיסמה, ומקבלים קוד ב-SMS. מי שאין לו עדיין סיסמה יכול להשתמש בכפתור ההרשמה במסך ההזדהות." },
      { title: "נפתח התיק הביטוחי", text: "מוצגת רשימת הפוליסות שנמצאו על שם תעודת הזהות, לפי הדיווח האחרון של חברות הביטוח." },
      { title: "מייצאים לאקסל", text: "בראש המסך יש כפתורים להדפסה, לשליחה במייל ולייצוא לאקסל. לוחצים על הייצוא לאקסל, והקובץ יורד למכשיר.", todoVerify: true },
      { title: "מעלים אותו כאן", text: "גוררים את הקובץ לאזור ההעלאה למטה. הקובץ נקרא במכשיר שלכם בלבד." },
    ],
    notes: [
      "הר הביטוח מציג מה קיים, לא את פירוט הכיסויים: מוטבים, סכומי ביטוח והחרגות אינם מופיעים בו.",
      "הדוח משקף את המצב בחודש שעבר, והוא משתנה. כדאי לשמור עותק.",
      "אם הכפתורים בפועל נראים אחרת, כתבו לנו ונעדכן את ההסבר.",
    ],
    sources: [
      { label: "הר הביטוח, האתר הרשמי של רשות שוק ההון", url: "https://harb.cma.gov.il/" },
      { label: "מדריך מלא להר הביטוח (MSL, מעודכן ספטמבר 2026)", url: "https://msl.org.il/har-habituach/" },
    ],
  },
  {
    id: "maslaka",
    title: "איך מקבלים את קובץ המסלקה הפנסיונית",
    fileLabel: "קובץ המסלקה (XML אחיד, או קובץ דחוס שמכיל אותו)",
    art: "30-rights-found-key",
    steps: [
      { title: "נכנסים לאתר המסלקה הפנסיונית", text: "המסלקה מופעלת על ידי חברת סוויפטנס בפיקוח רשות שוק ההון. הכתובת שדווחה במדריכים היא swiftness.co.il.", todoVerify: true },
      { title: "נרשמים פעם אחת", text: "ההרשמה נעשית ממחשב. הזיהוי לפי כרטיס אשראי (בלי חיוב) או לפי קוד שנמסר בסניף דואר ישראל.", todoVerify: true },
      { title: "נכנסים עם קוד חד-פעמי", text: "בכניסות הבאות מקבלים קוד חד-פעמי לטלפון הנייד." },
      { title: "מבקשים מידע פנסיוני מכל הגופים", text: "באזור האישי בוחרים בבקשת מידע פנסיוני מכל הגופים. הבקשה כרוכה בתשלום לפי המחירון של המסלקה.", todoVerify: true },
      { title: "ממתינים לקובץ", text: "לפי המדריכים, המסלקה מתחייבת למסור את הקובץ עד שלושה ימי עסקים, ובפועל לעיתים מהר יותר. כדאי לחזור לאזור האישי ולבדוק.", todoVerify: true },
      { title: "מורידים ומעלים כאן", text: "מורידים את הקובץ ומעלים אותו לאזור ההעלאה. אם קיבלתם רק קובץ PDF, כתבו לנו: אנחנו זקוקים לקובץ הנתונים (XML).", todoVerify: true },
    ],
    notes: [
      "הבקשה היא תצלום של הרגע שבו בוצעה, ולכן כדאי לשמור את הקובץ.",
      "פורמט הקובץ שמקבל חוסך פרטי (XML אחיד או PDF) טרם אומת מול האתר הרשמי. ראו את סעיף השאלות הפתוחות בתיעוד.",
      "הר הכסף של משרד האוצר הוא שירות אחר: הוא מראה אם קיים חשבון, ולא יתרות.",
    ],
    sources: [
      { label: "איך מוציאים לבד את דוח המסלקה הפנסיונית (הון)", url: "https://www.hon.co.il/?p=282538" },
      { label: "המסלקה הפנסיונית: מה זה ואיך מפיקים דוח (פרוטוקול)", url: "https://protocol.co.il/pension-clearing-house/" },
      { label: "מידע על החשבונות הפנסיוניים באמצעות המסלקה הפנסיונית (כל זכות)", url: "https://www.kolzchut.org.il/he/מידע_על_החשבונות_הפנסיוניים_וקרנות_השתלמות_באמצעות_המסלקה_הפנסיונית" },
    ],
  },
];
