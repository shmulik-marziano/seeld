// Dated, owner-editable configuration for plausibility thresholds. NOTHING here is a legal ceiling:
// salary ceilings, insured-salary caps, deposit limits and health-fund switching rules change by law and
// by year, so they are NOT hardcoded anywhere in the questionnaires. When the owner confirms a number
// from an official source, fill it in below together with the date and the source.
export interface LimitEntry {
  /** null = not configured: no warning is shown */
  value: number | null;
  asOf: string | null;
  source: string | null;
}
export const LIMITS: Record<string, LimitEntry> = {
  monthlyIncomeWarnAbove: { value: null, asOf: null, source: null },
  annualIncomeWarnAbove: { value: null, asOf: null, source: null },
  depositWarnAbove: { value: null, asOf: null, source: null },
};
/** Age of majority used for the adult check and the BMI band (owner-confirmed in REFERENCE-DATA.md section 5). */
export const ADULT_AGE = 18;
/** Health fund switching rules and waiting periods: intentionally absent until confirmed from an official source. */
export const HEALTH_FUND_SWITCH_RULES: null = null;

export const limitFor = (key: string): number | null => LIMITS[key]?.value ?? null;
