// Questionnaire registry: lazy JSON loaders (one chunk per definition) + hub metadata.
import type { Questionnaire, QuestionnaireKey } from "./types";

const LOADERS: Record<QuestionnaireKey, () => Promise<{ default: unknown }>> = {
  "direct-debit": () => import("@/data/questionnaires/direct-debit.json"),
  personal: () => import("@/data/questionnaires/personal.json"),
  "personal-extended": () => import("@/data/questionnaires/personal-extended.json"),
  health: () => import("@/data/questionnaires/health.json"),
  "needs-assessment": () => import("@/data/questionnaires/needs-assessment.json"),
  "retirement-planning": () => import("@/data/questionnaires/retirement-planning.json"),
  "insurance-need": () => import("@/data/questionnaires/insurance-need.json"),
  "occupation-income": () => import("@/data/questionnaires/occupation-income.json"),
  "hazardous-activities": () => import("@/data/questionnaires/hazardous-activities.json"),
  "accidents-disability": () => import("@/data/questionnaires/accidents-disability.json"),
  "savings-join": () => import("@/data/questionnaires/savings-join.json"),
  "travel-trip": () => import("@/data/questionnaires/travel-trip.json"),
};

export const CORE_KEYS: QuestionnaireKey[] = ["direct-debit", "personal", "personal-extended", "health"];
export const EXTRA_KEYS: QuestionnaireKey[] = [
  "needs-assessment", "retirement-planning", "insurance-need", "occupation-income", "hazardous-activities", "accidents-disability", "savings-join", "travel-trip",
];
export const isQuestionnaireKey = (k: string | undefined): k is QuestionnaireKey => !!k && k in LOADERS;

const cache = new Map<string, Promise<Questionnaire>>();
export function loadQuestionnaire(key: QuestionnaireKey): Promise<Questionnaire> {
  let p = cache.get(key);
  if (!p) {
    p = LOADERS[key]().then((m) => m.default as Questionnaire);
    cache.set(key, p);
  }
  return p;
}
/** Health content must not linger in memory objects longer than needed: callers drop the reference on leave. */
export const HEALTH_KEY: QuestionnaireKey = "health";
