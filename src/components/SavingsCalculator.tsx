import { useState, useMemo, useEffect, useRef } from "react";
import { Wallet, TrendingUp, Calendar, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ, TURQ_TEXT } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, kit CSS bar chart, table.dna-data.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

interface SavingsResult {
  totalSavings: number;
  totalDeposits: number;
  totalInterest: number;
  interestPercent: number;
  yearlyBreakdown: { year: number; balance: number; deposits: number; interest: number }[];
}

// Animated number component
const AnimatedNumber = ({ value, format }: { value: number; format: (n: number) => string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number>();
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return <>{format(displayValue)}</>;
};

const SavingsCalculator = () => {
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(1000);
  const [annualInterest, setAnnualInterest] = useState(5);
  const [years, setYears] = useState(10);

  const result: SavingsResult = useMemo(() => {
    const monthlyRate = annualInterest / 100 / 12;
    const totalMonths = years * 12;

    // Calculate yearly breakdown
    const yearlyBreakdown: SavingsResult["yearlyBreakdown"] = [];
    let currentBalance = initialAmount;
    let totalDepositsToDate = initialAmount;

    for (let year = 1; year <= years; year++) {
      // Calculate 12 months
      for (let month = 0; month < 12; month++) {
        currentBalance = currentBalance * (1 + monthlyRate) + monthlyDeposit;
        totalDepositsToDate += monthlyDeposit;
      }

      yearlyBreakdown.push({
        year,
        balance: currentBalance,
        deposits: totalDepositsToDate,
        interest: currentBalance - totalDepositsToDate,
      });
    }

    const totalSavings = currentBalance;
    const totalDeposits = totalDepositsToDate;
    const totalInterest = totalSavings - totalDeposits;
    const interestPercent = (totalInterest / totalSavings) * 100;

    return {
      totalSavings,
      totalDeposits,
      totalInterest,
      interestPercent,
      yearlyBreakdown,
    };
  }, [initialAmount, monthlyDeposit, annualInterest, years]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAmountChange = (value: string, setter: (val: number) => void, max: number) => {
    const num = parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num) && num >= 0 && num <= max) {
      setter(num);
    }
  };

  // Calculate max height for chart
  const maxBalance = result.yearlyBreakdown.length > 0
    ? Math.max(...result.yearlyBreakdown.map(y => y.balance))
    : 1;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Initial Amount */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <Wallet className="w-4 h-4" style={{ color: TURQ }} />
            סכום התחלתי
          </Label>
          <Input
            type="text"
            value={initialAmount.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setInitialAmount, 10000000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[initialAmount]}
            onValueChange={([value]) => setInitialAmount(value)}
            min={0}
            max={500000}
            step={5000}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪0</span>
            <span>₪500,000</span>
          </div>
        </div>

        {/* Monthly Deposit */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <PiggyBank className="w-4 h-4" style={{ color: TURQ }} />
            הפקדה חודשית
          </Label>
          <Input
            type="text"
            value={monthlyDeposit.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setMonthlyDeposit, 100000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[monthlyDeposit]}
            onValueChange={([value]) => setMonthlyDeposit(value)}
            min={0}
            max={20000}
            step={100}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪0</span>
            <span>₪20,000</span>
          </div>
        </div>

        {/* Annual Interest */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <TrendingUp className="w-4 h-4" style={{ color: TURQ }} />
            ריבית שנתית (%)
          </Label>
          <Input
            type="number"
            value={annualInterest}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 20) setAnnualInterest(val);
            }}
            step={0.5}
            min={0}
            max={20}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[annualInterest]}
            onValueChange={([value]) => setAnnualInterest(value)}
            min={0}
            max={15}
            step={0.5}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>0%</span>
            <span>15%</span>
          </div>
        </div>

        {/* Years */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
            תקופת חיסכון (שנים)
          </Label>
          <Input
            type="number"
            value={years}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 40) setYears(val);
            }}
            min={1}
            max={40}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[years]}
            onValueChange={([value]) => setYears(value)}
            min={1}
            max={30}
            step={1}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>שנה</span>
            <span>30 שנים</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Savings - standout stat */}
        <div className="dna-concept col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>סה"כ חיסכון</p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.9rem, 3vw, 2.3rem)", lineHeight: 1.15 }}
          >
            <AnimatedNumber value={result.totalSavings} format={formatCurrency} />
          </p>
        </div>

        {/* Total Deposits */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>סה"כ הפקדות</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            <AnimatedNumber value={result.totalDeposits} format={formatCurrency} />
          </p>
        </div>

        {/* Total Interest */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>רווחי ריבית</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: TURQ_TEXT }}>
            <AnimatedNumber value={result.totalInterest} format={formatCurrency} />
          </p>
        </div>

        {/* Interest Multiplier */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>תשואה על ההפקדות</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            <AnimatedNumber
              value={(result.totalInterest / result.totalDeposits) * 100}
              format={(n) => `${n.toFixed(1)}%`}
            />
          </p>
        </div>
      </div>

      {/* Visual Growth Chart — kit CSS bar pattern, stacked columns */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          צמיחת החיסכון לאורך השנים
        </h3>

        <div className="flex items-end gap-1 h-48 mb-2 rounded-lg p-2" style={{ backgroundColor: "#EEF3F6" }}>
          {result.yearlyBreakdown.map((yearData) => {
            const depositsHeight = (yearData.deposits / maxBalance) * 100;
            const interestHeight = (yearData.interest / maxBalance) * 100;

            return (
              <div
                key={yearData.year}
                className="flex-1 flex flex-col justify-end group relative h-full"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-[#E1EAF1] rounded-lg p-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg text-[#3a4c5a]">
                  <p className="font-bold" style={{ color: NAVY }}>שנה {yearData.year}</p>
                  <p>סה"כ: <span dir="ltr" className="tabular-nums" style={{ fontFamily: MONO }}>{formatCurrency(yearData.balance)}</span></p>
                  <p>הפקדות: <span dir="ltr" className="tabular-nums" style={{ fontFamily: MONO }}>{formatCurrency(yearData.deposits)}</span></p>
                  <p>ריבית: <span dir="ltr" className="tabular-nums" style={{ fontFamily: MONO }}>{formatCurrency(yearData.interest)}</span></p>
                </div>

                {/* Stacked bar: deposits navy, interest turquoise */}
                <div className="w-full flex flex-col rounded-t-sm overflow-hidden">
                  <div
                    className="w-full transition-all duration-200 ease-out"
                    style={{ height: `${interestHeight * 1.76}px`, backgroundColor: TURQ }}
                  />
                  <div
                    className="w-full transition-all duration-200 ease-out"
                    style={{ height: `${depositsHeight * 1.76}px`, backgroundColor: NAVY }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 text-xs tabular-nums" style={{ color: MUTED, fontFamily: MONO }} dir="ltr">
          {result.yearlyBreakdown.map((yearData, index) => (
            <div key={yearData.year} className="flex-1 text-center">
              {years <= 15 || index % 2 === 0 ? yearData.year : ""}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]" style={{ color: NAVY }}>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: NAVY }} aria-hidden="true" />
            הפקדות:{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(result.totalDeposits)}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: TURQ }} aria-hidden="true" />
            ריבית דריבית:{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(result.totalInterest)}</span>
          </span>
        </div>

        {/* Personalized Tips */}
        <div className="mt-6 space-y-3">
          <div className="dna-callout text-sm">
            <strong style={{ color: NAVY }}>כוח הריבית דריבית:</strong> עם הפקדה חודשית של {formatCurrency(monthlyDeposit)} בריבית {annualInterest}%,
            אחרי {years} שנים הכסף שלכם יגדל ב-
            <strong style={{ color: NAVY }}> {((result.totalInterest / result.totalDeposits) * 100).toFixed(0)}%</strong> מעבר להפקדות.
          </div>

          {monthlyDeposit > 0 && monthlyDeposit < 2000 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>הזדמנות לגדול:</strong> הוספת עוד {formatCurrency(500)} בחודש תוסיף
              <strong style={{ color: NAVY }}>
                {" "}
                {formatCurrency(
                  (() => {
                    const extraMonthly = 500;
                    const monthlyRate = annualInterest / 100 / 12;
                    const totalMonths = years * 12;
                    if (monthlyRate === 0) return extraMonthly * totalMonths;
                    let extra = 0;
                    for (let m = 0; m < totalMonths; m++) {
                      extra = extra * (1 + monthlyRate) + extraMonthly;
                    }
                    return extra;
                  })()
                )}
              </strong>{" "}
              לחיסכון שלכם.
            </div>
          )}

          {years >= 15 && annualInterest < 5 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>אופק ארוך:</strong> עם {years} שנות חיסכון, שקלו מסלול השקעות אגרסיבי יותר
              שעשוי להניב תשואה גבוהה יותר.
            </div>
          )}

          {result.totalInterest > result.totalDeposits && (
            <div className="dna-quote">
              <div className="dna-ql">נקודת מפנה</div>
              <div className="dna-qt">
                הריבית דריבית עשתה את שלה, הרווחים גדולים מההפקדות. זה הכוח של השקעה לטווח ארוך.
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <SaveCalculationButton
              calculatorType="savings"
              inputData={{ initialAmount, monthlyDeposit, annualInterest, years }}
              resultData={{
                totalSavings: result.totalSavings,
                totalDeposits: result.totalDeposits,
                totalInterest: result.totalInterest,
                interestPercent: result.interestPercent,
              }}
              tips={[
                `תשואה על ההפקדות: ${((result.totalInterest / result.totalDeposits) * 100).toFixed(0)}%`,
                result.totalInterest > result.totalDeposits ? `הריבית דריבית עשתה את שלה!` : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </div>
      </div>

      {/* Yearly Breakdown Table — the data craft */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          פירוט שנתי
        </h3>
        <div className="overflow-x-auto">
          <table className="dna-data">
            <thead>
              <tr>
                <th>שנה</th>
                <th>יתרה</th>
                <th>הפקדות</th>
                <th>ריבית מצטברת</th>
              </tr>
            </thead>
            <tbody>
              {result.yearlyBreakdown.map((yearData) => (
                <tr key={yearData.year}>
                  <td className="num">{yearData.year}</td>
                  <td className="num font-bold">{formatCurrency(yearData.balance)}</td>
                  <td className="num">{formatCurrency(yearData.deposits)}</td>
                  <td className="num" style={{ color: TURQ_TEXT, fontWeight: 500 }}>{formatCurrency(yearData.interest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SavingsCalculator;
