import { useState, useMemo } from "react";
import { Home, TrendingUp, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { CORAL, CORAL_TEXT, DISPLAY, MONO, MUTED, NAVY, TURQ } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, CSS bar chart with mono LTR values.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  principalPercent: number;
  interestPercent: number;
}

const MortgageCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(25);

  // PMT formula: PMT = P * (r * (1+r)^n) / ((1+r)^n - 1)
  const result: MortgageResult = useMemo(() => {
    const principal = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      const monthlyPayment = principal / numberOfPayments;
      return {
        monthlyPayment,
        totalPayment: principal,
        totalInterest: 0,
        principalPercent: 100,
        interestPercent: 0,
      };
    }

    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;
    const principalPercent = (principal / totalPayment) * 100;
    const interestPercent = (totalInterest / totalPayment) * 100;

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      principalPercent,
      interestPercent,
    };
  }, [loanAmount, interestRate, loanTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleLoanAmountChange = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num) && num >= 0 && num <= 10000000) {
      setLoanAmount(num);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Loan Amount */}
        <div className="space-y-4">
          <Label htmlFor="loanAmount" className={labelClass}>
            <Home className="w-4 h-4" style={{ color: TURQ }} />
            סכום המשכנתא
          </Label>
          <Input
            id="loanAmount"
            type="text"
            value={loanAmount.toLocaleString("he-IL")}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[loanAmount]}
            onValueChange={([value]) => setLoanAmount(value)}
            min={100000}
            max={5000000}
            step={50000}
            className={`mt-2 ${sliderClass}`}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪100,000</span>
            <span>₪5,000,000</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-4">
          <Label htmlFor="interestRate" className={labelClass}>
            <TrendingUp className="w-4 h-4" style={{ color: TURQ }} />
            ריבית שנתית (%)
          </Label>
          <Input
            id="interestRate"
            type="number"
            value={interestRate}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 15) setInterestRate(val);
            }}
            step={0.1}
            min={0}
            max={15}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[interestRate]}
            onValueChange={([value]) => setInterestRate(value)}
            min={0}
            max={10}
            step={0.1}
            className={`mt-2 ${sliderClass}`}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Loan Term */}
        <div className="space-y-4">
          <Label htmlFor="loanTerm" className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
            תקופת ההלוואה (שנים)
          </Label>
          <Input
            id="loanTerm"
            type="number"
            value={loanTerm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 30) setLoanTerm(val);
            }}
            min={1}
            max={30}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[loanTerm]}
            onValueChange={([value]) => setLoanTerm(value)}
            min={5}
            max={30}
            step={1}
            className={`mt-2 ${sliderClass}`}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>5 שנים</span>
            <span>30 שנים</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Payment - standout stat */}
        <div className="dna-concept col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>החזר חודשי</p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.9rem, 3vw, 2.3rem)", lineHeight: 1.15 }}
          >
            {formatCurrency(result.monthlyPayment)}
          </p>
        </div>

        {/* Total Payment */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>סה"כ תשלום</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {formatCurrency(result.totalPayment)}
          </p>
        </div>

        {/* Total Interest */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>סה"כ ריבית</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: CORAL_TEXT }}>
            {formatCurrency(result.totalInterest)}
          </p>
        </div>

        {/* Number of Payments */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>מספר תשלומים</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {loanTerm * 12}
          </p>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          פירוט התשלום
        </h3>

        {/* Principal / interest split — kit CSS bar pattern */}
        <div
          className="h-3 rounded-full overflow-hidden flex"
          style={{ backgroundColor: "#EEF3F6" }}
          role="img"
          aria-label={`קרן ${result.principalPercent.toFixed(0)} אחוז, ריבית ${result.interestPercent.toFixed(0)} אחוז`}
        >
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{ width: `${result.principalPercent}%`, backgroundColor: TURQ }}
          />
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{ width: `${result.interestPercent}%`, backgroundColor: CORAL }}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]" style={{ color: NAVY }}>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: TURQ }} aria-hidden="true" />
            קרן ({result.principalPercent.toFixed(0)}%):{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(loanAmount)}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: CORAL }} aria-hidden="true" />
            ריבית ({result.interestPercent.toFixed(0)}%):{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(result.totalInterest)}</span>
          </span>
        </div>

        {/* Personalized Tips */}
        <div className="mt-6 space-y-3">
          <div className="dna-callout text-sm">
            <strong style={{ color: NAVY }}>טיפ:</strong> הורדת הריבית ב-0.5% תחסוך לכם{" "}
            <strong style={{ color: NAVY }}>
              {formatCurrency(
                (() => {
                  const lowerRate = (interestRate - 0.5) / 100 / 12;
                  const n = loanTerm * 12;
                  if (lowerRate <= 0) return 0;
                  const lowerPayment =
                    (loanAmount * (lowerRate * Math.pow(1 + lowerRate, n))) /
                    (Math.pow(1 + lowerRate, n) - 1);
                  return (result.monthlyPayment - lowerPayment) * n;
                })()
              )}
            </strong>{" "}
            לאורך חיי ההלוואה.
          </div>

          {loanTerm > 20 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>קיצור תקופה:</strong> אם תקצרו את המשכנתא ל-{loanTerm - 5} שנים,
              ההחזר החודשי יעלה ב-
              <strong style={{ color: NAVY }}>
                {formatCurrency(
                  (() => {
                    const shorterN = (loanTerm - 5) * 12;
                    const rate = interestRate / 100 / 12;
                    if (rate === 0) return loanAmount / shorterN - result.monthlyPayment;
                    const shorterPayment = (loanAmount * (rate * Math.pow(1 + rate, shorterN))) / (Math.pow(1 + rate, shorterN) - 1);
                    return shorterPayment - result.monthlyPayment;
                  })()
                )}
              </strong>{" "}
              אבל תחסכו{" "}
              <strong style={{ color: NAVY }}>
                {formatCurrency(
                  (() => {
                    const shorterN = (loanTerm - 5) * 12;
                    const rate = interestRate / 100 / 12;
                    if (rate === 0) return 0;
                    const shorterPayment = (loanAmount * (rate * Math.pow(1 + rate, shorterN))) / (Math.pow(1 + rate, shorterN) - 1);
                    return result.totalPayment - (shorterPayment * shorterN);
                  })()
                )}
              </strong>{" "}
              בסה"כ.
            </div>
          )}

          {result.interestPercent > 40 && (
            <div className="dna-quote gold">
              <div className="dna-ql">שימו לב</div>
              <div className="dna-qt">
                הריבית מהווה {result.interestPercent.toFixed(0)}% מהתשלום הכולל.
                שקלו לבחון מסלולים עם ריבית נמוכה יותר או להקדים תשלומים.
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <SaveCalculationButton
              calculatorType="mortgage"
              inputData={{ loanAmount, interestRate, loanTerm }}
              resultData={{
                monthlyPayment: result.monthlyPayment,
                totalPayment: result.totalPayment,
                totalInterest: result.totalInterest,
                principalPercent: result.principalPercent,
                interestPercent: result.interestPercent,
              }}
              tips={[
                `הורדת הריבית ב-0.5% תחסוך ${formatCurrency(result.totalInterest * 0.1)}`,
                loanTerm > 20 ? `קיצור תקופה יחסוך בריבית` : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
