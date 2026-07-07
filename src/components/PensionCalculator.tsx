import { useState, useMemo } from "react";
import { User, Banknote, Calendar, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ, TURQ_TEXT } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, CSS bar chart with mono LTR values.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

interface PensionResult {
  totalSavings: number;
  monthlyPension: number;
  totalDeposits: number;
  totalReturns: number;
  yearsToRetirement: number;
}

const PensionCalculator = () => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(67);
  const [monthlySalary, setMonthlySalary] = useState(15000);
  const [employeeDeposit, setEmployeeDeposit] = useState(6);
  const [employerDeposit, setEmployerDeposit] = useState(6.5);
  const [severanceDeposit, setSeveranceDeposit] = useState(8.33);
  const [annualReturn, setAnnualReturn] = useState(4);
  const [currentSavings, setCurrentSavings] = useState(0);

  const result: PensionResult = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;

    // Total monthly deposit percentage
    const totalDepositPercent = employeeDeposit + employerDeposit + severanceDeposit;
    const monthlyDeposit = (monthlySalary * totalDepositPercent) / 100;

    // Monthly return rate
    const monthlyReturnRate = annualReturn / 100 / 12;

    // Future Value of current savings
    const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyReturnRate, monthsToRetirement);

    // Future Value of monthly deposits (annuity)
    let fvDeposits = 0;
    if (monthlyReturnRate > 0) {
      fvDeposits = monthlyDeposit * ((Math.pow(1 + monthlyReturnRate, monthsToRetirement) - 1) / monthlyReturnRate);
    } else {
      fvDeposits = monthlyDeposit * monthsToRetirement;
    }

    const totalSavings = fvCurrentSavings + fvDeposits;
    const totalDeposits = currentSavings + (monthlyDeposit * monthsToRetirement);
    const totalReturns = totalSavings - totalDeposits;

    // Estimate monthly pension (assuming 20 years of retirement, 3% annual withdrawal rate adjusted)
    // Using standard pension calculation: total / (expected retirement years * 12)
    const retirementYears = 20;
    const monthlyPension = totalSavings / (retirementYears * 12);

    return {
      totalSavings,
      monthlyPension,
      totalDeposits,
      totalReturns,
      yearsToRetirement,
    };
  }, [currentAge, retirementAge, monthlySalary, employeeDeposit, employerDeposit, severanceDeposit, annualReturn, currentSavings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const depositsPercent = result.totalSavings > 0 ? (result.totalDeposits / result.totalSavings) * 100 : 0;
  const returnsPercent = result.totalSavings > 0 ? (result.totalReturns / result.totalSavings) * 100 : 0;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Age */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <User className="w-4 h-4" style={{ color: TURQ }} />
            גיל נוכחי
          </Label>
          <Input
            type="number"
            value={currentAge}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 18 && val < retirementAge) setCurrentAge(val);
            }}
            min={18}
            max={66}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[currentAge]}
            onValueChange={([value]) => value < retirementAge && setCurrentAge(value)}
            min={18}
            max={66}
            step={1}
            className={sliderClass}
          />
        </div>

        {/* Retirement Age */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
            גיל פרישה
          </Label>
          <Input
            type="number"
            value={retirementAge}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > currentAge && val <= 75) setRetirementAge(val);
            }}
            min={60}
            max={75}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[retirementAge]}
            onValueChange={([value]) => value > currentAge && setRetirementAge(value)}
            min={60}
            max={75}
            step={1}
            className={sliderClass}
          />
        </div>

        {/* Monthly Salary */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <Banknote className="w-4 h-4" style={{ color: TURQ }} />
            משכורת חודשית
          </Label>
          <Input
            type="text"
            value={monthlySalary.toLocaleString("he-IL")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0 && num <= 200000) setMonthlySalary(num);
            }}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[monthlySalary]}
            onValueChange={([value]) => setMonthlySalary(value)}
            min={5000}
            max={80000}
            step={1000}
            className={sliderClass}
          />
        </div>

        {/* Current Savings */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <PiggyBank className="w-4 h-4" style={{ color: TURQ }} />
            חיסכון קיים
          </Label>
          <Input
            type="text"
            value={currentSavings.toLocaleString("he-IL")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0) setCurrentSavings(num);
            }}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[currentSavings]}
            onValueChange={([value]) => setCurrentSavings(value)}
            min={0}
            max={2000000}
            step={10000}
            className={sliderClass}
          />
        </div>
      </div>

      {/* Deposit Rates */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          אחוזי הפקדה
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-[#1D2D3D]">הפקדת עובד (%)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[employeeDeposit]}
                onValueChange={([value]) => setEmployeeDeposit(value)}
                min={0}
                max={10}
                step={0.5}
                className={`flex-1 ${sliderClass}`}
              />
              <span className="text-sm font-medium w-12 text-left tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
                {employeeDeposit}%
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm text-[#1D2D3D]">הפקדת מעסיק (%)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[employerDeposit]}
                onValueChange={([value]) => setEmployerDeposit(value)}
                min={0}
                max={10}
                step={0.5}
                className={`flex-1 ${sliderClass}`}
              />
              <span className="text-sm font-medium w-12 text-left tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
                {employerDeposit}%
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm text-[#1D2D3D]">פיצויים (%)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[severanceDeposit]}
                onValueChange={([value]) => setSeveranceDeposit(value)}
                min={0}
                max={8.33}
                step={0.33}
                className={`flex-1 ${sliderClass}`}
              />
              <span className="text-sm font-medium w-12 text-left tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
                {severanceDeposit.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm text-[#1D2D3D]">תשואה שנתית צפויה (%)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[annualReturn]}
                onValueChange={([value]) => setAnnualReturn(value)}
                min={0}
                max={10}
                step={0.5}
                className={`flex-1 ${sliderClass}`}
              />
              <span className="text-sm font-medium w-12 text-left tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
                {annualReturn}%
              </span>
            </div>
          </div>
        </div>
        <div className="dna-callout mt-5 text-sm text-center">
          סה"כ הפקדה חודשית:{" "}
          <strong style={{ color: NAVY }}>
            {formatCurrency((monthlySalary * (employeeDeposit + employerDeposit + severanceDeposit)) / 100)}
          </strong>{" "}
          ({(employeeDeposit + employerDeposit + severanceDeposit).toFixed(2)}% מהשכר)
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Pension - standout stat */}
        <div className="dna-concept col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>פנסיה חודשית צפויה</p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.9rem, 3vw, 2.3rem)", lineHeight: 1.15 }}
          >
            {formatCurrency(result.monthlyPension)}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            {((result.monthlyPension / monthlySalary) * 100).toFixed(0)}% מהשכר הנוכחי
          </p>
        </div>

        {/* Total Savings */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>סה"כ חיסכון בפרישה</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {formatCurrency(result.totalSavings)}
          </p>
        </div>

        {/* Total Returns */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>רווחי השקעה</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: TURQ_TEXT }}>
            {formatCurrency(result.totalReturns)}
          </p>
        </div>

        {/* Years to Retirement */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>שנים עד פרישה</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {result.yearsToRetirement}
          </p>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          פירוט החיסכון
        </h3>

        {/* Deposits / returns split — kit CSS bar pattern */}
        <div
          className="h-3 rounded-full overflow-hidden flex"
          style={{ backgroundColor: "#EEF3F6" }}
          role="img"
          aria-label={`הפקדות ${depositsPercent.toFixed(0)} אחוז, רווחים ${returnsPercent.toFixed(0)} אחוז`}
        >
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{ width: `${depositsPercent}%`, backgroundColor: NAVY }}
          />
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{ width: `${returnsPercent}%`, backgroundColor: TURQ }}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]" style={{ color: NAVY }}>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: NAVY }} aria-hidden="true" />
            הפקדות:{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(result.totalDeposits)}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: TURQ }} aria-hidden="true" />
            רווחים:{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO }}>{formatCurrency(result.totalReturns)}</span>
          </span>
        </div>

        {/* Personalized Tips */}
        <div className="mt-6 space-y-3">
          <div className="dna-callout text-sm">
            <strong style={{ color: NAVY }}>טיפ:</strong> הגדלת הפקדת העובד ב-1% תוסיף לחיסכון שלכם כ-
            <strong style={{ color: NAVY }}>
              {formatCurrency(
                (() => {
                  const extraMonthly = monthlySalary * 0.01;
                  const months = result.yearsToRetirement * 12;
                  const rate = annualReturn / 100 / 12;
                  if (rate === 0) return extraMonthly * months;
                  return extraMonthly * ((Math.pow(1 + rate, months) - 1) / rate);
                })()
              )}
            </strong>{" "}
            עד גיל הפרישה.
          </div>

          {result.yearsToRetirement > 25 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>יתרון הזמן:</strong> עוד {result.yearsToRetirement} שנים עד הפרישה.
              זה הזמן המושלם להגדיל סיכון במסלול ההשקעות ולהניב תשואות גבוהות יותר.
            </div>
          )}

          {result.yearsToRetirement <= 10 && result.yearsToRetirement > 0 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>קרבה לפרישה:</strong> עם {result.yearsToRetirement} שנים בלבד עד הפרישה,
              כדאי לשקול מעבר למסלול סולידי יותר כדי להגן על החיסכון.
            </div>
          )}

          {(result.monthlyPension / monthlySalary) < 0.5 && (
            <div className="dna-quote gold">
              <div className="dna-ql">פער פנסיוני</div>
              <div className="dna-qt">
                הפנסיה הצפויה היא רק {((result.monthlyPension / monthlySalary) * 100).toFixed(0)}% מהשכר.
                שקלו להגדיל הפקדות או לבדוק קרן השתלמות נוספת.
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <SaveCalculationButton
              calculatorType="pension"
              inputData={{ currentAge, retirementAge, monthlySalary, employeeDeposit, employerDeposit, severanceDeposit, annualReturn, currentSavings }}
              resultData={{
                totalSavings: result.totalSavings,
                monthlyPension: result.monthlyPension,
                totalDeposits: result.totalDeposits,
                totalReturns: result.totalReturns,
                yearsToRetirement: result.yearsToRetirement,
              }}
              tips={[
                `הגדלת הפקדת העובד ב-1% תוסיף לחיסכון`,
                result.yearsToRetirement > 25 ? `יתרון הזמן - עוד ${result.yearsToRetirement} שנים` : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="dna-quote gold">
        <div className="dna-ql">הבהרה</div>
        <div className="dna-qt">
          החישוב מבוסס על הנחות תיאורטיות ואינו מהווה ייעוץ פנסיוני. לקבלת תחזית מדויקת, פנו ליועץ פנסיוני מוסמך.
        </div>
      </div>
    </div>
  );
};

export default PensionCalculator;
