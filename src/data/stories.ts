/**
 * The emotional moment of each page ("מה עומד מולכם"): who is reading, what they are afraid of or hoping for,
 * and the concrete situations they recognise. Rendered by SdStory next to the page's illustration.
 *
 * Writing rules (regulated advice site):
 *  - speak to the reader's situation and feeling first, product second; warm, plain Hebrew, no slogans;
 *  - no promises, guarantees, returns, prices, statistics or testimonials;
 *  - no claims about a single named agent (the agency is a team); do not name people;
 *  - `moments` are 3 short recognisable situations, each one sentence;
 *  - `caption` labels the illustration (one short human line).
 */
export type Story = {
  kicker: string;
  title: string;
  body: string;
  moments: string[];
  caption: string;
};

const base: Record<string, Story> = {
  "/insurance/life": {
    kicker: "רגע לפני שמחליטים",
    title: "אף אחד לא אוהב לחשוב על זה. בדיוק בגלל זה כדאי שמישהו יעשה את זה בשבילכם.",
    body: "ביטוח חיים הוא החלטה שמקבלים מתוך אהבה, לא מתוך פחד. הוא עונה על שאלה אחת: אם יקרה משהו, האם הבית, הלימודים והשגרה של מי שחשוב לכם ימשיכו להתנהל בשקט.",
    moments: [
      "הילדים עוד קטנים, יש משכנתא והכנסה עיקרית אחת, ורוצים לדעת שהבית נשאר של המשפחה.",
      "הפנסיה כוללת כיסוי לשאירים, ולא ברור אם הוא מספיק למה שבאמת צריך.",
      "משלמים על כמה פוליסות לאורך השנים ולא בטוחים שהן לא מכסות את אותו הדבר פעמיים.",
    ],
    caption: "ביטחון למשפחה, בלי להסתבך",
  },
  "/insurance/health": {
    kicker: "כשזה מגיע, צריך שמישהו יחזיק אתכם",
    title: "מהרגע שמקבלים אבחנה, כל הכוח צריך ללכת להחלמה, לא למאבק מול הטפסים.",
    body: "ביטוח בריאות טוב לא מורגש עד שצריכים אותו. ואז מגלים אם יש מסלול מהיר לרופא המומחה, אם ההתערבות מכוסה, ואם יש לצידכם מי שמסביר מה מגיע לכם ומאיפה.",
    moments: [
      "יש כבר קופת חולים וביטוח משלים, ולא ברור מה בדיוק מכוסה ומה לא.",
      "שמעתם על ניתוח בחו״ל או תרופה מחוץ לסל, ורוצים להבין מה האפשרויות.",
      "הילדים גדלים ורוצים שלא תהיה הפתעה כשיגיע הצורך ברופא מומחה.",
    ],
    caption: "לדעת שיש מי שבודק לכם את הפרטים הקטנים",
  },
  "/insurance/vehicle": {
    kicker: "בדרך",
    title: "ברוב הימים זה סתם רכב. ביום אחד זה כל הבוקר, וכל החודש.",
    body: "ביטוח רכב הוא החלטה על מה קורה ביום שבו משהו משתבש בכביש: מי מטפל, מה מכוסה, וכמה זה יעלה לכם בסוף. כדאי להבין את זה מראש ולא מול מוסך או שמאי.",
    moments: [
      "החידוש השנתי הגיע וההצעה קפצה, ולא ברור אם אפשר למצוא כיסוי טוב יותר.",
      "קניתם רכב חדש או משומש ורוצים לבחור כיסוי שמתאים לשימוש האמיתי שלכם.",
      "היה אירוע בעבר, ועכשיו רוצים לדעת איך זה משפיע על מה שמציעים לכם.",
    ],
    caption: "שקט נפשי בכל נסיעה",
  },
};

import { stories_ins_a } from "./stories-ins-a";
import { stories_ins_b } from "./stories-ins-b";
import { stories_sav } from "./stories-sav";
import { stories_pub } from "./stories-pub";

export const stories: Record<string, Story> = { ...base, ...stories_ins_a, ...stories_ins_b, ...stories_sav, ...stories_pub };
