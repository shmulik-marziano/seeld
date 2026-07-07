import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Banknote, UserRound, BadgePercent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, coral for the cost figure.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";
const radioItemClass = "border-[#1D2D3D] text-[#1D2D3D]";

// Tax parameters: January 2026 (רשות המסים); update yearly.
// Monthly brackets after the January 2026 reform: the 20% bracket widened to 19,000
// and the 31% bracket to 25,100; other thresholds frozen.
// Above 60,130/month the 47% rate carries an additional 3% surtax (מס יסף) = 50%.
const TAX_BRACKETS_2026: { upTo: number; rate: number }[] = [
  { upTo: 7010, rate: 0.1 },
  { upTo: 10060, rate: 0.14 },
  { upTo: 19000, rate: 0.2 },
  { upTo: 25100, rate: 0.31 },
  { upTo: 46690, rate: 0.35 },
  { upTo: 60130, rate: 0.47 },
  { upTo: Infinity, rate: 0.5 },
];
const CREDIT_POINT_VALUE_2026 = 242; // ILS per point, per month
const BASE_CREDIT_POINTS = { male: 2.25, female: 2.75 }; // תושב/ת ישראל

interface IncomeTaxResult {
  monthlyTax: number;
  netAfterIncomeTax: number;
  annualTax: number;
  marginalRate: number;
  effectiveRate: number;
  creditPoints: number;
  creditValue: number;
}

export const computeMonthlyIncomeTax = (
  grossMonthly: number,
  totalCreditPoints: number,
): IncomeTaxResult => {
  let grossTax = 0;
  let marginalRate = TAX_BRACKETS_2026[0].rate;
  let lower = 0;
  for (const bracket of TAX_BRACKETS_2026) {
    if (grossMonthly > lower) {
      const taxedInBracket = Math.min(grossMonthly, bracket.upTo) - lower;
      grossTax += taxedInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }
    lower = bracket.upTo;
  }

  const creditValue = totalCreditPoints * CREDIT_POINT_VALUE_2026;
  const monthlyTax = Math.max(0, grossTax - creditValue);

  return {
    monthlyTax,
    netAfterIncomeTax: grossMonthly - monthlyTax,
    annualTax: monthlyTax * 12,
    marginalRate: marginalRate * 100,
    effectiveRate: grossMonthly > 0 ? (monthlyTax / grossMonthly) * 100 : 0,
    creditPoints: totalCreditPoints,
    creditValue,
  };
};

const IncomeTaxCalculator = () => {
  const [grossMonthly, setGrossMonthly] = useState(15000);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [additionalPoints, setAdditionalPoints] = useState(0);

  const result = useMemo(
    () => computeMonthlyIncomeTax(grossMonthly, BASE_CREDIT_POINTS[gender] + additionalPoints),
    [grossMonthly, gender, additionalPoints],
  );

  const formatCurrency = (value: number) => `₪${Math.round(value).toLocaleString("en-US")}`;

  const money = (value: number) => (
    <span dir="ltr" className="tabular-nums">{formatCurrency(value)}</span>
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Monthly Salary */}
        <div className="space-y-4">
          <Label htmlFor="taxGrossSalary" className={labelClass}>
            <Banknote className="w-4 h-4" style={{ color: TURQ }} />
            שכר חודשי ברוטו
          </Label>
          <Input
            id="taxGrossSalary"
            type="text"
            value={grossMonthly.toLocaleString("en-US")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0 && num <= 200000) setGrossMonthly(num);
            }}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[grossMonthly]}
            onValueChange={([value]) => setGrossMonthly(value)}
            min={5000}
            max={100000}
            step={500}
            aria-label="שכר חודשי ברוטו"
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪5,000</span>
            <span>₪100,000</span>
          </div>
        </div>

        {/* Gender (determines base credit points) */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <UserRound className="w-4 h-4" style={{ color: TURQ }} />
            מין (קובע נקודות בסיס)
          </Label>
          <RadioGroup
            value={gender}
            onValueChange={(value) => setGender(value as "male" | "female")}
            className="flex flex-col gap-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="taxGenderMale" className={radioItemClass} />
              <Label htmlFor="taxGenderMale" className="font-normal cursor-pointer text-[#3a4c5a]">
                גבר תושב ישראל (<span dir="ltr" className="tabular-nums">2.25</span> נקודות)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="taxGenderFemale" className={radioItemClass} />
              <Label htmlFor="taxGenderFemale" className="font-normal cursor-pointer text-[#3a4c5a]">
                אישה תושבת ישראל (<span dir="ltr" className="tabular-nums">2.75</span> נקודות)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Additional Credit Points */}
        <div className="space-y-4">
          <Label htmlFor="taxExtraPoints" className={labelClass}>
            <BadgePercent className="w-4 h-4" style={{ color: TURQ }} />
            נקודות זיכוי נוספות
          </Label>
          <Input
            id="taxExtraPoints"
            type="number"
            value={additionalPoints}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 10) setAdditionalPoints(val);
            }}
            min={0}
            max={10}
            step={0.25}
            className={inputClass}
            dir="ltr"
          />
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            ילדים, עולה חדש ותואר אקדמי מוסיפים כל אחד נקודות זיכוי. כל נקודה שווה{" "}
            {money(CREDIT_POINT_VALUE_2026)} בחודש.
          </p>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Monthly Tax - standout stat */}
        <div className="dna-concept col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>מס חודשי</p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.9rem, 3vw, 2.3rem)", lineHeight: 1.15 }}
          >
            {formatCurrency(result.monthlyTax)}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            אחרי זיכוי של {money(result.creditValue)} (
            <span dir="ltr" className="tabular-nums">{result.creditPoints}</span> נקודות)
          </p>
        </div>

        {/* Net after income tax */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>נטו ממס הכנסה</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {formatCurrency(result.netAfterIncomeTax)}
          </p>
        </div>

        {/* Annual Tax */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>מס שנתי</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: "#a04a5c" }}>
            {formatCurrency(result.annualTax)}
          </p>
        </div>

        {/* Marginal Rate */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>מס שולי</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {result.marginalRate.toFixed(0)}%
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>על השקל הבא שתרוויחו</p>
        </div>

        {/* Effective Rate */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>מס אפקטיבי</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {result.effectiveRate.toFixed(1)}%
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>מתוך הברוטו בפועל</p>
        </div>
      </div>

      {/* Scope + refund teaser */}
      <div className="dna-concept !p-6 space-y-4">
        <p className="text-sm leading-[1.8]" style={{ color: "#3a4c5a" }}>
          החישוב כולל מס הכנסה בלבד, ללא ביטוח לאומי ודמי בריאות. הנטו בפועל בתלוש יהיה נמוך
          יותר, כי הניכויים האלה מחושבים בנפרד.
        </p>
        <div className="dna-callout text-sm">
          עבדתם חלק מהשנה או לא ניצלתם נקודות זיכוי? ייתכן שמגיע לכם החזר מס.{" "}
          <Link
            to="/rights-extraction"
            className="font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/30 pb-0.5 hover:border-[#1D2D3D] transition-colors"
          >
            בדקו זכאות להחזר
          </Link>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <SaveCalculationButton
            calculatorType="income-tax"
            inputData={{ grossMonthly, gender, additionalPoints }}
            resultData={{
              monthlyTax: result.monthlyTax,
              netAfterIncomeTax: result.netAfterIncomeTax,
              annualTax: result.annualTax,
              marginalRate: result.marginalRate,
              effectiveRate: result.effectiveRate,
            }}
            tips={[
              `המס השולי שלכם: ${result.marginalRate.toFixed(0)}%`,
              additionalPoints === 0
                ? "בדקו אם מגיעות לכם נקודות זיכוי נוספות (ילדים, תואר, עולה חדש)"
                : undefined,
            ].filter(Boolean) as string[]}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="dna-quote gold">
        <div className="dna-ql">הבהרה</div>
        <div className="dna-qt">
          מדרגות המס ונקודות הזיכוי לפי פרמטרי ינואר 2026 של רשות המסים. החישוב הוא הערכה
          לתכנון, לא ייעוץ מס. לחבות מס מדויקת פנו לרואה חשבון או יועץ מס.
        </div>
      </div>
    </div>
  );
};

export default IncomeTaxCalculator;
