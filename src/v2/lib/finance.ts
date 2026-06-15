/**
 * Seeld v2 — Financial engine.
 * Pure, deterministic functions powering the Report Studio and tools.
 * All math is monthly-compounded and intentionally transparent.
 */

export interface Coverage {
  life: boolean; // ביטוח חיים (ריסק)
  disability: boolean; // אובדן כושר עבודה
  health: boolean; // ביטוח בריאות פרטי
  critical: boolean; // מחלות קשות
  longTermCare: boolean; // סיעוד
  mortgage: boolean; // ביטוח משכנתא
}

export interface FinancialProfile {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  pensionBalance: number; // צבירה פנסיונית נוכחית
  monthlyDeposit: number; // הפקדה חודשית כוללת (עובד+מעסיק+פיצויים)
  feeOnBalance: number; // דמי ניהול מצבירה (% לשנה)
  feeOnDeposit: number; // דמי ניהול מהפקדה (%)
  annualReturn: number; // תשואה שנתית נומינלית (%)
  otherSavings: number; // חיסכון נוסף / נזיל
  dependents: number;
  hasMortgage: boolean;
  coverage: Coverage;
}

export interface YearPoint {
  age: number;
  balance: number;
  optimizedBalance: number;
  contributions: number; // cumulative net contributions
}

export interface CoverageGap {
  key: keyof Coverage;
  label: string;
  severity: "high" | "medium" | "low";
  reason: string;
}

export interface ReportResult {
  series: YearPoint[];
  balanceAtRetirement: number;
  optimizedBalanceAtRetirement: number;
  monthlyPension: number;
  optimizedMonthlyPension: number;
  replacementRatio: number; // monthlyPension / income
  readinessScore: number; // 0..100
  lostToFees: number; // לכל אורך החיים עד פרישה
  extraMonthlyIfOptimized: number;
  totalContributions: number;
  totalGrowth: number;
  coverageScore: number; // 0..100
  coverageGaps: CoverageGap[];
  coverageCovered: string[];
  yearsToRetirement: number;
}

/** Annuity conversion factor (מקדם המרה לקצבה) — typical default. */
const ANNUITY_FACTOR = 200;

/** Competitive "optimized" fees we benchmark against. */
const OPTIMIZED_FEE_BALANCE = 0.2;
const OPTIMIZED_FEE_DEPOSIT = 1.0;

export const DEFAULT_PROFILE: FinancialProfile = {
  age: 35,
  retirementAge: 67,
  monthlyIncome: 14000,
  pensionBalance: 220000,
  monthlyDeposit: 2900,
  feeOnBalance: 0.5,
  feeOnDeposit: 2.0,
  annualReturn: 5,
  otherSavings: 60000,
  dependents: 2,
  hasMortgage: true,
  coverage: {
    life: true,
    disability: false,
    health: false,
    critical: false,
    longTermCare: false,
    mortgage: true,
  },
};

interface ProjectionInput {
  startBalance: number;
  monthlyDeposit: number;
  months: number;
  annualReturn: number;
  feeOnBalance: number;
  feeOnDeposit: number;
}

/** Monthly-compounded projection returning the final balance. */
function projectFinal(p: ProjectionInput): number {
  const monthlyReturn = Math.pow(1 + p.annualReturn / 100, 1 / 12) - 1;
  const monthlyFeeBal = p.feeOnBalance / 100 / 12;
  const netDeposit = p.monthlyDeposit * (1 - p.feeOnDeposit / 100);
  let bal = p.startBalance;
  for (let m = 0; m < p.months; m++) {
    bal += netDeposit;
    bal *= 1 + monthlyReturn;
    bal *= 1 - monthlyFeeBal;
  }
  return bal;
}

const COVERAGE_LABELS: Record<keyof Coverage, string> = {
  life: "ביטוח חיים (ריסק)",
  disability: "אובדן כושר עבודה",
  health: "ביטוח בריאות פרטי",
  critical: "ביטוח מחלות קשות",
  longTermCare: "ביטוח סיעודי",
  mortgage: "ביטוח משכנתא",
};

/** Which covers are *recommended* for this profile, with reasoning. */
function recommendedCoverage(profile: FinancialProfile): {
  key: keyof Coverage;
  severity: CoverageGap["severity"];
  reason: string;
}[] {
  const recs: { key: keyof Coverage; severity: CoverageGap["severity"]; reason: string }[] = [
    { key: "disability", severity: "high", reason: "מגן על ההכנסה שלך אם לא תוכל לעבוד — קריטי לכל שכיר ועצמאי." },
    { key: "health", severity: "medium", reason: "השלמה לסל הבריאות הציבורי: ניתוחים, תרופות וייעוץ פרטי." },
  ];
  if (profile.dependents > 0) {
    recs.push({ key: "life", severity: "high", reason: `יש לך ${profile.dependents} תלויים — ביטוח חיים מבטיח את עתידם הכלכלי.` });
  }
  if (profile.hasMortgage) {
    recs.push({ key: "mortgage", severity: "high", reason: "משכנתא פעילה מחייבת כיסוי שמונע נטל חוב על המשפחה." });
  }
  if (profile.age >= 40) {
    recs.push({ key: "critical", severity: "medium", reason: "החל מגיל 40 הסיכון למחלות קשות עולה — פיצוי חד-פעמי מעניק חופש כלכלי." });
  }
  if (profile.age >= 45) {
    recs.push({ key: "longTermCare", severity: "low", reason: "כדאי להבטיח כיסוי סיעודי בעודך צעיר ובריא, לפני שהפרמיות מתייקרות." });
  }
  return recs;
}

export function analyzeCoverage(profile: FinancialProfile): {
  score: number;
  gaps: CoverageGap[];
  covered: string[];
} {
  const recs = recommendedCoverage(profile);
  const gaps: CoverageGap[] = [];
  const covered: string[] = [];
  for (const r of recs) {
    if (profile.coverage[r.key]) covered.push(COVERAGE_LABELS[r.key]);
    else gaps.push({ key: r.key, label: COVERAGE_LABELS[r.key], severity: r.severity, reason: r.reason });
  }
  const score = recs.length === 0 ? 100 : Math.round((covered.length / recs.length) * 100);
  return { score, gaps, covered };
}

export function buildReport(profile: FinancialProfile): ReportResult {
  const yearsToRetirement = Math.max(0, profile.retirementAge - profile.age);
  const monthlyReturn = Math.pow(1 + profile.annualReturn / 100, 1 / 12) - 1;
  const monthlyFeeBal = profile.feeOnBalance / 100 / 12;
  const optFeeBal = Math.min(profile.feeOnBalance, OPTIMIZED_FEE_BALANCE) / 100 / 12;
  const netDeposit = profile.monthlyDeposit * (1 - profile.feeOnDeposit / 100);
  const optNetDeposit = profile.monthlyDeposit * (1 - Math.min(profile.feeOnDeposit, OPTIMIZED_FEE_DEPOSIT) / 100);

  let bal = profile.pensionBalance;
  let optBal = profile.pensionBalance;
  let cumContrib = 0;
  const series: YearPoint[] = [
    { age: profile.age, balance: bal, optimizedBalance: optBal, contributions: 0 },
  ];

  const totalMonths = yearsToRetirement * 12;
  for (let m = 1; m <= totalMonths; m++) {
    bal += netDeposit;
    bal *= 1 + monthlyReturn;
    bal *= 1 - monthlyFeeBal;

    optBal += optNetDeposit;
    optBal *= 1 + monthlyReturn;
    optBal *= 1 - optFeeBal;

    cumContrib += netDeposit;

    if (m % 12 === 0) {
      series.push({
        age: profile.age + m / 12,
        balance: bal,
        optimizedBalance: optBal,
        contributions: cumContrib,
      });
    }
  }

  const balanceAtRetirement = bal;
  const optimizedBalanceAtRetirement = optBal;
  const monthlyPension = balanceAtRetirement / ANNUITY_FACTOR;
  const optimizedMonthlyPension = optimizedBalanceAtRetirement / ANNUITY_FACTOR;
  const replacementRatio = profile.monthlyIncome > 0 ? monthlyPension / profile.monthlyIncome : 0;
  const readinessScore = Math.max(0, Math.min(100, Math.round((replacementRatio / 0.7) * 100)));
  const lostToFees = Math.max(0, optimizedBalanceAtRetirement - balanceAtRetirement);
  const extraMonthlyIfOptimized = lostToFees / ANNUITY_FACTOR;
  const totalContributions = profile.pensionBalance + cumContrib;
  const totalGrowth = Math.max(0, balanceAtRetirement - totalContributions);

  const cov = analyzeCoverage(profile);

  return {
    series,
    balanceAtRetirement,
    optimizedBalanceAtRetirement,
    monthlyPension,
    optimizedMonthlyPension,
    replacementRatio,
    readinessScore,
    lostToFees,
    extraMonthlyIfOptimized,
    totalContributions,
    totalGrowth,
    coverageScore: cov.score,
    coverageGaps: cov.gaps,
    coverageCovered: cov.covered,
    yearsToRetirement,
  };
}

/* ── Formatting helpers ─────────────────────────────────────── */

export function shekels(n: number): string {
  return "₪" + Math.round(n).toLocaleString("he-IL");
}

/** Compact: ₪1.24M / ₪450K / ₪980 */
export function shekelsCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return "₪" + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1_000) return "₪" + Math.round(n / 1000) + "K";
  return "₪" + Math.round(n).toLocaleString("he-IL");
}

export function percent(n: number, digits = 0): string {
  return (n * 100).toFixed(digits) + "%";
}

export function readinessLabel(score: number): { label: string; tone: "good" | "ok" | "low" } {
  if (score >= 75) return { label: "מצוין — אתה בכיוון הנכון", tone: "good" };
  if (score >= 45) return { label: "סביר — יש מקום לשיפור", tone: "ok" };
  return { label: "דורש תשומת לב", tone: "low" };
}
