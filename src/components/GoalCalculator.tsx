import { useState, useMemo, useEffect, useRef } from "react";
import { Target, Calendar, PiggyBank, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, kit CSS progress bar.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

interface GoalResult {
  monthlyNeeded: number;
  totalNeeded: number;
  gap: number;
  yearsToRetirement: number;
  futureBalance: number;
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

const GoalCalculator = () => {
  const [targetMonthlyPension, setTargetMonthlyPension] = useState(10000);
  const [currentAge, setCurrentAge] = useState(35);
  const [currentBalance, setCurrentBalance] = useState(100000);
  const [retirementAge, setRetirementAge] = useState(67);
  const [annualReturn, setAnnualReturn] = useState(3);

  const result: GoalResult = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;

    // Factor for converting total savings to monthly pension (based on ~20 years retirement)
    const pensionFactor = 200;
    const totalNeeded = targetMonthlyPension * pensionFactor;

    // Calculate future value of current balance
    const rate = annualReturn / 100;
    const futureBalance = currentBalance * Math.pow(1 + rate, yearsToRetirement);

    // Calculate gap
    const gap = Math.max(0, totalNeeded - futureBalance);

    // Calculate monthly deposit needed
    let monthlyNeeded = 0;
    if (gap > 0 && yearsToRetirement > 0) {
      const annuityFactor = (Math.pow(1 + rate, yearsToRetirement) - 1) / rate;
      monthlyNeeded = gap / (12 * annuityFactor);
    }

    return {
      monthlyNeeded,
      totalNeeded,
      gap,
      yearsToRetirement,
      futureBalance,
    };
  }, [targetMonthlyPension, currentAge, currentBalance, retirementAge, annualReturn]);

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

  const progressPercent = Math.min(100, (result.futureBalance / result.totalNeeded) * 100);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Main Target Input - Big and Prominent */}
      <div className="space-y-3">
        <Label htmlFor="goalTarget" className={labelClass}>
          <Target className="w-4 h-4" style={{ color: TURQ }} />
          כמה תרצו לקבל בחודש בפנסיה?
        </Label>
        <div className="relative max-w-xl">
          <Input
            id="goalTarget"
            type="text"
            value={targetMonthlyPension.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setTargetMonthlyPension, 100000)}
            className="h-20 text-center text-3xl md:text-4xl font-bold tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]"
            dir="ltr"
          />
          <span
            className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-semibold"
            style={{ color: TURQ, fontFamily: MONO }}
            aria-hidden="true"
          >
            ₪
          </span>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Age */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
            הגיל שלך היום
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
            <Target className="w-4 h-4" style={{ color: TURQ }} />
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

        {/* Current Balance */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <PiggyBank className="w-4 h-4" style={{ color: TURQ }} />
            כמה יש לך כבר?
          </Label>
          <Input
            type="text"
            value={currentBalance.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setCurrentBalance, 10000000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[currentBalance]}
            onValueChange={([value]) => setCurrentBalance(value)}
            min={0}
            max={2000000}
            step={10000}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪0</span>
            <span>₪2,000,000</span>
          </div>
        </div>

        {/* Annual Return */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <TrendingUp className="w-4 h-4" style={{ color: TURQ }} />
            תשואה שנתית צפויה (%)
          </Label>
          <Input
            type="number"
            value={annualReturn}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 15) setAnnualReturn(val);
            }}
            step={0.5}
            min={0}
            max={15}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[annualReturn]}
            onValueChange={([value]) => setAnnualReturn(value)}
            min={0}
            max={10}
            step={0.5}
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Needed - standout stat */}
        <div className="dna-concept col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>צריך להפקיד בחודש</p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.9rem, 3vw, 2.3rem)", lineHeight: 1.15 }}
          >
            <AnimatedNumber value={result.monthlyNeeded} format={formatCurrency} />
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>כדי להגיע ליעד שלך</p>
        </div>

        {/* Total Needed */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>צבירה נדרשת</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            <AnimatedNumber value={result.totalNeeded} format={formatCurrency} />
          </p>
        </div>

        {/* Gap to Bridge */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>פער לגישור</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: "#a04a5c" }}>
            <AnimatedNumber value={result.gap} format={formatCurrency} />
          </p>
        </div>

        {/* Years to Retirement */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>שנים להפקדה</p>
          <p className="text-[22px] font-semibold tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {result.yearsToRetirement}
          </p>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          התקדמות ליעד
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline gap-4 text-sm" style={{ color: NAVY }}>
            <span>חיסכון קיים (ערך עתידי)</span>
            <span className="font-medium tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>
              {formatCurrency(result.futureBalance)}
            </span>
          </div>
          {/* Kit CSS progress bar: track #EEF3F6, fill turquoise */}
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: "#EEF3F6" }}
            role="img"
            aria-label={`${progressPercent.toFixed(0)} אחוז מהיעד`}
          >
            <div
              className="h-full rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%`, backgroundColor: TURQ }}
            />
          </div>
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED, fontFamily: MONO }} dir="ltr">
            <span>₪0</span>
            <span>{formatCurrency(result.totalNeeded)}</span>
          </div>
          <p className="text-[13px]" style={{ color: MUTED }}>
            החיסכון הקיים מכסה{" "}
            <span dir="ltr" className="tabular-nums font-medium" style={{ fontFamily: MONO, color: NAVY }}>
              {progressPercent.toFixed(0)}%
            </span>{" "}
            מהיעד.
          </p>
        </div>

        {/* Personalized Tips */}
        <div className="mt-6 space-y-3">
          {result.monthlyNeeded <= 3000 && result.gap > 0 && (
            <div className="dna-quote">
              <div className="dna-ql">יעד ריאלי</div>
              <div className="dna-qt">
                הפקדה של {formatCurrency(result.monthlyNeeded)} בחודש היא סכום סביר
                עבור רוב המשפחות. אתם בדרך הנכונה.
              </div>
            </div>
          )}

          {result.monthlyNeeded > 5000 && result.monthlyNeeded <= 10000 && (
            <div className="dna-quote blue">
              <div className="dna-ql">יש אפשרויות נוספות</div>
              <div className="dna-qt">
                הסכום הנדרש גבוה יחסית. שקלו לשלב קרן השתלמות, ביטוח מנהלים או חיסכון פרטי נוסף.
              </div>
            </div>
          )}

          {result.monthlyNeeded > 10000 && (
            <div className="dna-quote gold">
              <div className="dna-ql">יעד מאתגר</div>
              <div className="dna-qt">
                הסכום הנדרש ({formatCurrency(result.monthlyNeeded)} לחודש) גבוה מאוד.
                שקלו להוריד את יעד הפנסיה או לבדוק מקורות הכנסה נוספים בפרישה.
              </div>
            </div>
          )}

          {result.futureBalance > result.totalNeeded * 0.5 && result.futureBalance < result.totalNeeded && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>בדרך הנכונה:</strong> החיסכון הקיים שלכם כבר מכסה {((result.futureBalance / result.totalNeeded) * 100).toFixed(0)}% מהיעד.
              רק צריך להשלים את היתרה.
            </div>
          )}

          <div className="dna-callout text-sm">
            <strong style={{ color: NAVY }}>טיפ:</strong> כל שנה של התחלה מוקדמת יותר חוסכת לכם כ-
            <strong style={{ color: NAVY }}>{formatCurrency(result.monthlyNeeded * 12 * 0.12)}</strong> בהפקדות בזכות הריבית דריבית.
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <SaveCalculationButton
              calculatorType="goal"
              inputData={{ targetMonthlyPension, currentAge, currentBalance, retirementAge, annualReturn }}
              resultData={{
                monthlyNeeded: result.monthlyNeeded,
                totalNeeded: result.totalNeeded,
                gap: result.gap,
                yearsToRetirement: result.yearsToRetirement,
                futureBalance: result.futureBalance,
              }}
              tips={[
                `צריך להפקיד ${formatCurrency(result.monthlyNeeded)} בחודש`,
                result.futureBalance > result.totalNeeded * 0.5 ? `בדרך הנכונה! ${((result.futureBalance / result.totalNeeded) * 100).toFixed(0)}% מהיעד` : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="dna-quote gold">
        <div className="dna-ql">הבהרה</div>
        <div className="dna-qt">
          החישוב מבוסס על הנחת תשואה קבועה ואינו מהווה ייעוץ פנסיוני. לקבלת תחזית מדויקת, פנו ליועץ פנסיוני מוסמך.
        </div>
      </div>
    </div>
  );
};

export default GoalCalculator;
