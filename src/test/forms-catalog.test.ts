import { describe, it, expect } from "vitest";
import { CARD_KEYS, cardOf, cardPath, cardStatus, FORMS_CARDS, nextCardAfter, nextQuestionnaireOf, questionnaireKeysOf, RISK_QUESTIONNAIRE_KEY, type SubmissionSummary } from "@/forms/catalog";
import { isQuestionnaireKey } from "@/questionnaires/registry";
import { SPOTS } from "@/components/sd/spots";
import index from "@/data/questionnaires.index.json";

describe("forms catalog: the six cards the owner named, in his order", () => {
  it("has the six keys in order and a title each", () => {
    expect(FORMS_CARDS.map((c) => c.key)).toEqual(["reports", "personal", "health", "financial", "financial-extended", "risk"]);
    expect(FORMS_CARDS.map((c) => c.title)).toEqual(["הזמנת מידעים", "פרטים אישיים ומסמכים", "שאלון בריאות", "שאלון פיננסי", "שאלון פיננסי מורחב", "אפיון סיכון"]);
    expect(CARD_KEYS.length).toBe(6);
  });
  it("maps every questionnaire card to live definitions of the registry, and only the health card is sensitive", () => {
    const live = new Set((index as { key: string; status: string }[]).filter((r) => r.status === "live").map((r) => r.key));
    for (const c of FORMS_CARDS) {
      for (const q of c.questionnaires) {
        expect(isQuestionnaireKey(q)).toBe(true);
        expect(live.has(q)).toBe(true);
      }
      expect(c.sensitive).toBe(c.key === "health");
      expect(c.spot in SPOTS).toBe(true);
      expect(c.minutes).toBeGreaterThan(0);
    }
    expect(cardOf("personal")?.documents).toEqual(["id_copy", "payslip", "statement", "other"]);
    expect(cardOf("financial-extended")?.questionnaires).toEqual(["occupation-income", "retirement-planning", "savings-join"]);
    expect(questionnaireKeysOf(cardOf("risk")!)).toEqual([RISK_QUESTIONNAIRE_KEY]);
  });
  it("the POA card opens the wizard with its entry context; the others run under /forms", () => {
    expect(cardPath(cardOf("reports")!)).toBe("/report/start/order?from=forms");
    expect(cardPath(cardOf("health")!)).toBe("/forms/health");
  });
  it("status per card follows the session's submissions", () => {
    const subs: SubmissionSummary[] = [
      { card: "personal", questionnaire: "personal", status: "submitted", completion: 100 },
      { card: "financial-extended", questionnaire: "occupation-income", status: "submitted", completion: 100 },
      { card: "financial-extended", questionnaire: "retirement-planning", status: "draft", completion: 40 },
      { card: "risk", questionnaire: RISK_QUESTIONNAIRE_KEY, status: "reviewed", completion: 100 },
    ];
    expect(cardStatus(cardOf("reports")!, subs)).toBe("unknown");
    expect(cardStatus(cardOf("personal")!, subs)).toBe("submitted");
    expect(cardStatus(cardOf("health")!, subs)).toBe("not-started");
    expect(cardStatus(cardOf("financial-extended")!, subs)).toBe("in-progress");
    expect(cardStatus(cardOf("risk")!, subs)).toBe("submitted");
    expect(nextQuestionnaireOf(cardOf("financial-extended")!, subs)).toBe("retirement-planning");
    expect(nextQuestionnaireOf(cardOf("personal")!, subs)).toBeNull();
    expect(nextCardAfter("personal", subs)?.key).toBe("health");
    expect(nextCardAfter("risk", subs)?.key).toBe("health");
    const all = FORMS_CARDS.filter((c) => c.kind !== "poa").flatMap((c) => questionnaireKeysOf(c).map((q) => ({ card: c.key, questionnaire: q, status: "submitted" as const, completion: 100 })));
    expect(nextCardAfter("personal", all)).toBeNull();
  });
});
