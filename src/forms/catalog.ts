// The six cards of /forms, in the order the owner named them (2026-11-23), each mapped to what runs behind it:
// the POA wizard, one or more definitions of src/questionnaires, or the risk quiz. Dependency-light on purpose: the hub,
// the flow page and the staff tab all read this file; tests check the mapping against the registry.
import type { QuestionnaireKey } from "@/questionnaires/types";
import type { SpotName } from "@/components/sd/spots";
import { POA_ROUTE } from "@/lib/poa/config";

export type CardKey = "reports" | "personal" | "health" | "financial" | "financial-extended" | "risk";
export const CARD_KEYS: readonly CardKey[] = ["reports", "personal", "health", "financial", "financial-extended", "risk"];
export type DocumentKind = "id_copy" | "payslip" | "statement" | "other";
/** the questionnaire key the risk quiz is stored under (not a src/questionnaires definition) */
export const RISK_QUESTIONNAIRE_KEY = "risk-profile";

export interface FormsCard {
  key: CardKey;
  title: string;
  description: string;
  /** rounded minutes, shown on the card */
  minutes: number;
  spot: SpotName;
  kind: "poa" | "questionnaire" | "risk";
  /** definitions run one after another under this card (questionnaire cards) */
  questionnaires: QuestionnaireKey[];
  /** document kinds offered after the questionnaires (the personal card) */
  documents: DocumentKind[];
  /** health data: never prefilled, stored only when the server says so */
  sensitive: boolean;
}

export const FORMS_CARDS: readonly FormsCard[] = [
  {
    key: "reports", title: "הזמנת מידעים", kind: "poa", minutes: 6, spot: "scroll-ribbon",
    description: "ייפוי כוח למסלקה הפנסיונית, להר הביטוח ולחברות הביטוח, כדי שהמידע על התיק שלכם יגיע אלינו מהגופים עצמם.",
    questionnaires: [], documents: [], sensitive: false,
  },
  {
    key: "personal", title: "פרטים אישיים ומסמכים", kind: "questionnaire", minutes: 5, spot: "passport",
    description: "פרטי זיהוי, כתובת ודרכי קשר, ואחר כך צילום תעודת זהות ומסמכים שכדאי שיהיו אצלנו.",
    questionnaires: ["personal"], documents: ["id_copy", "payslip", "statement", "other"], sensitive: false,
  },
  {
    key: "health", title: "שאלון בריאות", kind: "questionnaire", minutes: 5, spot: "heart-pink",
    description: "סינון קצר לפי תחומים. 'לא' מספיק, ורק על 'כן' נשאל עוד. המידע הבריאותי מטופל בנפרד ובזהירות.",
    questionnaires: ["health"], documents: [], sensitive: true,
  },
  {
    key: "financial", title: "שאלון פיננסי", kind: "questionnaire", minutes: 3, spot: "coins-stacks",
    description: "יחס לסיכון ותמונה פיננסית: הכנסות, הוצאות, חסכונות והתחייבויות. כיוון לשיחה, בלי ציון.",
    questionnaires: ["needs-assessment"], documents: [], sensitive: false,
  },
  {
    key: "financial-extended", title: "שאלון פיננסי מורחב", kind: "questionnaire", minutes: 10, spot: "treasure-chest",
    description: "תעסוקה והכנסה, תכנון פרישה והצטרפות לחיסכון פנסיוני, בזה אחר זה. אפשר לעצור ולהמשיך אחר כך.",
    questionnaires: ["occupation-income", "retirement-planning", "savings-join"], documents: [], sensitive: false,
  },
  {
    key: "risk", title: "אפיון סיכון", kind: "risk", minutes: 2, spot: "compass",
    description: "ארבע שאלות קצרות שמסמנות את רמת הסיכון שמתאימה לכם בהשקעות, עם המסלולים המתאימים.",
    questionnaires: [], documents: [], sensitive: false,
  },
];

export const cardOf = (key: string | undefined): FormsCard | undefined => FORMS_CARDS.find((c) => c.key === key);
export const isCardKey = (k: string | undefined): k is CardKey => !!k && (CARD_KEYS as readonly string[]).includes(k);

/** where a card starts: the POA wizard carries its entry context; the others run under /forms/<card> */
export function cardPath(card: FormsCard): string {
  return card.kind === "poa" ? `${POA_ROUTE}?from=forms` : `/forms/${card.key}`;
}

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  id_copy: "צילום תעודת זהות (שני הצדדים)",
  payslip: "תלוש שכר אחרון",
  statement: "דוח שנתי או דף פירוט",
  other: "מסמך אחר",
};

// ---------------------------------------------------------------- status of a card for one client session
export type CardStatus = "not-started" | "in-progress" | "submitted" | "unknown";
export const CARD_STATUS_LABEL: Record<CardStatus, string> = { "not-started": "לא התחיל", "in-progress": "בתהליך", submitted: "נשלח", unknown: "" };

export interface SubmissionSummary { card: string; questionnaire: string; status: "draft" | "submitted" | "reviewed"; completion: number }

/** the keys a card stores under (the risk quiz has its own) */
export function questionnaireKeysOf(card: FormsCard): string[] {
  return card.kind === "risk" ? [RISK_QUESTIONNAIRE_KEY] : card.questionnaires;
}

export function cardStatus(card: FormsCard, submissions: readonly SubmissionSummary[]): CardStatus {
  if (card.kind === "poa") return "unknown";
  const keys = questionnaireKeysOf(card);
  const mine = submissions.filter((s) => keys.includes(s.questionnaire));
  if (!mine.length) return "not-started";
  const done = keys.every((k) => mine.some((s) => s.questionnaire === k && s.status !== "draft"));
  return done ? "submitted" : "in-progress";
}

/** the next questionnaire of a card still to do, or null when every one is submitted */
export function nextQuestionnaireOf(card: FormsCard, submissions: readonly SubmissionSummary[]): QuestionnaireKey | null {
  return card.questionnaires.find((k) => !submissions.some((s) => s.questionnaire === k && s.status !== "draft")) ?? null;
}

/** the first card after `after` (in catalog order, wrapping) that is not submitted; the POA card is never suggested */
export function nextCardAfter(after: CardKey, submissions: readonly SubmissionSummary[]): FormsCard | null {
  const i = CARD_KEYS.indexOf(after);
  for (let n = 1; n < CARD_KEYS.length; n++) {
    const c = FORMS_CARDS[(i + n) % CARD_KEYS.length];
    if (c.kind !== "poa" && cardStatus(c, submissions) !== "submitted") return c;
  }
  return null;
}
