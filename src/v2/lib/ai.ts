/**
 * Seeld v2 — AI insight layer.
 *
 * Two tiers:
 *  1. deterministicInsights() — always available, personalized Hebrew analysis
 *     derived directly from the financial engine. No network, never fails.
 *  2. streamInsights() — streams a richer, conversational analysis from the
 *     live "אריק" advisor (finance-chat → Gemini). Lights up automatically once
 *     GOOGLE_AI_API_KEY is configured on the Supabase function.
 */
import {
  FinancialProfile,
  ReportResult,
  shekels,
  shekelsCompact,
  percent,
  readinessLabel,
} from "./finance";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

export function buildInsightPrompt(profile: FinancialProfile, r: ReportResult): string {
  return [
    "נתח את הפרופיל הפיננסי הבא של לקוח וכתוב סקירה אישית, חמה ומקצועית בעברית.",
    "השתמש בכותרות קצרות (##) ובנקודות. התייחס למספרים הספציפיים. אורך: 4-6 פסקאות.",
    "",
    `גיל: ${profile.age}, גיל פרישה מתוכנן: ${profile.retirementAge}`,
    `הכנסה חודשית: ${shekels(profile.monthlyIncome)}`,
    `צבירה פנסיונית: ${shekels(profile.pensionBalance)}, הפקדה חודשית: ${shekels(profile.monthlyDeposit)}`,
    `דמי ניהול: ${profile.feeOnBalance}% מצבירה, ${profile.feeOnDeposit}% מהפקדה`,
    `צבירה צפויה בפרישה: ${shekels(r.balanceAtRetirement)}`,
    `קצבה חודשית צפויה: ${shekels(r.monthlyPension)} (${percent(r.replacementRatio)} מההכנסה)`,
    `ציון מוכנות לפרישה: ${r.readinessScore}/100`,
    `אובדן לאורך השנים מדמי ניהול גבוהים: ${shekels(r.lostToFees)}`,
    `פערי ביטוח: ${r.coverageGaps.map((g) => g.label).join(", ") || "אין"}`,
    "",
    "סיים בהמלצה ברורה לקבוע פגישת ייעוץ עם צוות SeelD.",
  ].join("\n");
}

export interface StreamHandle {
  promise: Promise<string>;
  abort: () => void;
}

/** Stream a live analysis. Throws if the backend AI is unavailable. */
export function streamInsights(
  profile: FinancialProfile,
  result: ReportResult,
  onToken: (full: string) => void
): StreamHandle {
  const controller = new AbortController();
  const prompt = buildInsightPrompt(profile, result);

  const promise = (async () => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let msg = "AI_UNAVAILABLE";
      try {
        const j = await response.json();
        if (j?.error) msg = j.error;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("AI_UNAVAILABLE");
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || "";
          if (content) {
            full += content;
            onToken(full);
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    return full;
  })();

  return { promise, abort: () => controller.abort() };
}

/** Always-available personalized analysis built from the numbers. */
export function deterministicInsights(profile: FinancialProfile, r: ReportResult): string {
  const ready = readinessLabel(r.readinessScore);
  const parts: string[] = [];

  parts.push(
    `## תמונת המצב שלך\n` +
      `בגיל ${profile.age}, עם צבירה פנסיונית של ${shekels(profile.pensionBalance)} והפקדה חודשית של ${shekels(
        profile.monthlyDeposit
      )}, אתה צפוי לצבור כ-${shekelsCompact(r.balanceAtRetirement)} עד גיל ${profile.retirementAge}. ` +
      `מתוך הסכום הזה, כ-${shekelsCompact(r.totalGrowth)} צפויים להגיע מתשואה — כוחה של ריבית דריבית לאורך ${r.yearsToRetirement} שנים.`
  );

  parts.push(
    `## פרישה והכנסה עתידית\n` +
      `הקצבה החודשית הצפויה שלך היא כ-${shekels(r.monthlyPension)}, שהם **${percent(
        r.replacementRatio
      )}** מההכנסה הנוכחית שלך. ` +
      `ציון המוכנות לפרישה שלך הוא **${r.readinessScore}/100** — ${ready.label}. ` +
      (r.replacementRatio < 0.7
        ? `שיעור התחלופה המומלץ הוא כ-70%, כך שכדאי לבחון הגדלת הפקדות או אופטימיזציה של מסלול ההשקעה כדי לסגור את הפער.`
        : `אתה נמצא בשיעור תחלופה בריא — המשך לשמר את ההפקדות והמסלול.`)
  );

  if (r.lostToFees > 0) {
    parts.push(
      `## דמי ניהול — ההדלפה השקטה\n` +
        `דמי הניהול הנוכחיים שלך (${profile.feeOnBalance}% מצבירה, ${profile.feeOnDeposit}% מהפקדה) צפויים לעלות לך כ-**${shekels(
          r.lostToFees
        )}** עד הפרישה, בהשוואה לדמי ניהול תחרותיים. ` +
        `במונחי קצבה — זה פער של כ-${shekels(r.extraMonthlyIfOptimized)} בכל חודש, לכל החיים. זו אחת ההזדמנויות הקלות ביותר לשיפור.`
    );
  }

  if (r.coverageGaps.length > 0) {
    const gapLines = r.coverageGaps
      .map((g) => `- **${g.label}** — ${g.reason}`)
      .join("\n");
    parts.push(`## פערים בכיסוי הביטוחי\nזיהינו ${r.coverageGaps.length} פערים שכדאי לבחון:\n${gapLines}`);
  } else {
    parts.push(`## כיסוי ביטוחי\nהכיסוי הביטוחי שלך נראה מקיף ביחס לפרופיל שלך. כל הכבוד — זו עמדה יציבה.`);
  }

  const steps: string[] = [];
  if (r.lostToFees > 5000) steps.push("בקשת הצעה לאופטימיזציית דמי ניהול מול 12 חברות.");
  if (r.replacementRatio < 0.7) steps.push("בחינת הגדלת הפקדה חודשית או מסלול השקעה מותאם.");
  if (r.coverageGaps.length > 0) steps.push(`השלמת הכיסויים החסרים: ${r.coverageGaps.map((g) => g.label).join(", ")}.`);
  steps.push("פגישת ייעוץ ראשונה — על חשבוננו — לבניית תוכנית אישית.");

  parts.push(`## הצעדים הבאים\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);

  return parts.join("\n\n");
}
