// Knowledge section: the seven fixed categories (keys in ./types). A new category needs an owner
// decision. Ledes are digit-free and one sentence. Used by React pages only (not by Node scripts).
import type { ArtName, Pastel } from "@/components/sd/topics";
import type { GuideCategoryKey } from "./types";

export interface GuideCategory {
  key: GuideCategoryKey;
  title: string;
  lede: string;
  art: ArtName;
  tone: Pastel;
}

export const CATEGORIES: GuideCategory[] = [
  {
    key: "pension-employees",
    title: "פנסיה לשכירים",
    lede: "מה בעצם קונים בקרן הפנסיה, איך נקבעות ההפקדות ומה לבדוק כשמתחילים עבודה חדשה.",
    art: "24-pension-family-umbrella",
    tone: "sky",
  },
  {
    key: "pension-self-employed",
    title: "פנסיה לעצמאים",
    lede: "החובה לחסוך לפנסיה, ההטבות במס והדרך לשלב בין הכנסה משכר להכנסה מעסק.",
    art: "25-employer-employee",
    tone: "butter",
  },
  {
    key: "training-funds",
    title: "קרנות השתלמות",
    lede: "מתי כדאי לחסוך בקרן השתלמות, איך משיכה חלקית עובדת ומה ההבדל בין שכירים לעצמאים.",
    art: "23-training-desk",
    tone: "lavender",
  },
  {
    key: "retirement",
    title: "תכנון פרישה",
    lede: "ההכנסה בחודש הראשון אחרי הפרישה, קיבוע זכויות, קצבת זקנה ומשיכת פיצויים בין מקומות עבודה.",
    art: "26-pre-retirement-path",
    tone: "sage",
  },
  {
    key: "family-wealth",
    title: "ניהול הון משפחתי",
    lede: "כמה כסף זמין למשפחה, איך בונים כרית נזילות ואיפה כדאי להחזיק חסכונות לטווחים שונים.",
    art: "10-financial-planning",
    tone: "rose",
  },
  {
    key: "family-business-insurance",
    title: "ביטוח למשפחה ולעסק",
    lede: "איך לחשוב על אובדן כושר עבודה, ביטוח חיים, ביטוח בריאות ומחלות קשות בלי לשלם פעמיים.",
    art: "02-family-protection",
    tone: "sage",
  },
  {
    key: "pension-tax",
    title: "מיסוי החיסכון הפנסיוני",
    lede: "איך פועל המס בשלוש תחנות לאורך חיי החיסכון, ומה ההבדלים בין גמל, השתלמות, ביטוח מנהלים ופנסיה.",
    art: "37-object-hourglass",
    tone: "butter",
  },
];

export const CATEGORY_BY_KEY: Record<GuideCategoryKey, GuideCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<GuideCategoryKey, GuideCategory>;

/** The six categories of the guide collection (the tax series has its own hub). */
export const GUIDE_CATEGORIES: GuideCategory[] = CATEGORIES.filter((c) => c.key !== "pension-tax");

export const categoryFor = (key: GuideCategoryKey): GuideCategory => CATEGORY_BY_KEY[key];
