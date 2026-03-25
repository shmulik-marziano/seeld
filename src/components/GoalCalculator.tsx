import { useState, useMemo, useEffect, useRef } from "react";
import { Target, Calendar, PiggyBank, Banknote, TrendingUp, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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

  return (
    <div className="space-y-8" dir="rtl">
      {/* Main Target Input - Big and Prominent */}
      <div className="relative">
        <div className="absolute -top-3 right-4 bg-background px-3 py-1 rounded-full text-sm font-semibold text-secondary z-10 border border-secondary/20">
          כמה תרצה לקבל בחודש בפנסיה?
        </div>
        <div className="relative">
          <Input
            type="text"
            value={targetMonthlyPension.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setTargetMonthlyPension, 100000)}
            className="text-center text-3xl md:text-4xl font-bold h-20 rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 focus:border-secondary"
            dir="ltr"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-semibold text-secondary">
            ₪
          </span>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Age */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Calendar className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[currentAge]}
            onValueChange={([value]) => value < retirementAge && setCurrentAge(value)}
            min={18}
            max={66}
            step={1}
          />
        </div>

        {/* Retirement Age */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[retirementAge]}
            onValueChange={([value]) => value > currentAge && setRetirementAge(value)}
            min={60}
            max={75}
            step={1}
          />
        </div>

        {/* Current Balance */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <PiggyBank className="w-4 h-4" />
            כמה יש לך כבר?
          </Label>
          <Input
            type="text"
            value={currentBalance.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setCurrentBalance, 10000000)}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[currentBalance]}
            onValueChange={([value]) => setCurrentBalance(value)}
            min={0}
            max={2000000}
            step={10000}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>₪0</span>
            <span>₪2,000,000</span>
          </div>
        </div>

        {/* Annual Return */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[annualReturn]}
            onValueChange={([value]) => setAnnualReturn(value)}
            min={0}
            max={10}
            step={0.5}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Needed - Highlighted */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              צריך להפקיד בחודש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              <AnimatedNumber value={result.monthlyNeeded} format={formatCurrency} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              כדי להגיע ליעד שלך 🎯
            </p>
          </CardContent>
        </Card>

        {/* Total Needed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              צבירה נדרשת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <AnimatedNumber value={result.totalNeeded} format={formatCurrency} />
            </p>
          </CardContent>
        </Card>

        {/* Gap to Bridge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              פער לגישור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              <AnimatedNumber value={result.gap} format={formatCurrency} />
            </p>
          </CardContent>
        </Card>

        {/* Years to Retirement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              שנים להפקדה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{result.yearsToRetirement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            התקדמות ליעד
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>חיסכון קיים (ערך עתידי)</span>
              <span className="font-medium">{formatCurrency(result.futureBalance)}</span>
            </div>
            <div className="h-8 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full bg-gradient-to-l from-primary to-secondary transition-all duration-700 flex items-center justify-end px-3"
                style={{ width: `${Math.min(100, (result.futureBalance / result.totalNeeded) * 100)}%` }}
              >
                {(result.futureBalance / result.totalNeeded) * 100 > 20 && (
                  <span className="text-xs font-medium text-primary-foreground">
                    {((result.futureBalance / result.totalNeeded) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
              <span>₪0</span>
              <span>יעד: {formatCurrency(result.totalNeeded)}</span>
            </div>
          </div>

          {/* Personalized Tips */}
          <div className="mt-6 space-y-3">
            {result.monthlyNeeded <= 3000 && result.gap > 0 && (
              <div className="p-4 bg-primary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ✅ <strong>יעד ריאלי!</strong> הפקדה של {formatCurrency(result.monthlyNeeded)} בחודש היא סכום סביר 
                  עבור רוב המשפחות. אתם בדרך הנכונה!
                </p>
              </div>
            )}
            
            {result.monthlyNeeded > 5000 && result.monthlyNeeded <= 10000 && (
              <div className="p-4 bg-accent/10 rounded-xl flex gap-4">
                <AlertCircle className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm mb-1">יש אפשרויות נוספות!</h4>
                  <p className="text-sm text-muted-foreground">
                    הסכום הנדרש גבוה יחסית. שקלו לשלב קרן השתלמות, ביטוח מנהלים או חיסכון פרטי נוסף.
                  </p>
                </div>
              </div>
            )}
            
            {result.monthlyNeeded > 10000 && (
              <div className="p-4 bg-destructive/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ⚠️ <strong>יעד מאתגר:</strong> הסכום הנדרש ({formatCurrency(result.monthlyNeeded)}/חודש) גבוה מאוד. 
                  שקלו להוריד את יעד הפנסיה או לבדוק מקורות הכנסה נוספים בפרישה.
                </p>
              </div>
            )}
            
            {result.futureBalance > result.totalNeeded * 0.5 && result.futureBalance < result.totalNeeded && (
              <div className="p-4 bg-secondary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🎯 <strong>בדרך הנכונה:</strong> החיסכון הקיים שלכם כבר מכסה {((result.futureBalance / result.totalNeeded) * 100).toFixed(0)}% מהיעד! 
                  רק צריך להשלים את היתרה.
                </p>
              </div>
            )}
            
            <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
              <p>
                💡 <strong>טיפ:</strong> כל שנה של התחלה מוקדמת יותר חוסכת לכם כ-
                <strong>{formatCurrency(result.monthlyNeeded * 12 * 0.12)}</strong> בהפקדות בזכות הריבית דריבית.
              </p>
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
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground text-center">
        * החישוב מבוסס על הנחת תשואה קבועה ואינו מהווה ייעוץ פנסיוני. לקבלת תחזית מדויקת, פנו ליועץ פנסיוני מוסמך.
      </div>
    </div>
  );
};

export default GoalCalculator;
