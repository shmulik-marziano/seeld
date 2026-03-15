import { useState, useMemo, useEffect, useRef } from "react";
import { Wallet, TrendingUp, Calendar, PiggyBank, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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
      const startBalance = currentBalance;
      const startDeposits = totalDepositsToDate;
      
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
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Initial Amount */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Wallet className="w-4 h-4" />
            סכום התחלתי
          </Label>
          <Input
            type="text"
            value={initialAmount.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setInitialAmount, 10000000)}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[initialAmount]}
            onValueChange={([value]) => setInitialAmount(value)}
            min={0}
            max={500000}
            step={5000}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₪0</span>
            <span>₪500,000</span>
          </div>
        </div>

        {/* Monthly Deposit */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <PiggyBank className="w-4 h-4" />
            הפקדה חודשית
          </Label>
          <Input
            type="text"
            value={monthlyDeposit.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value, setMonthlyDeposit, 100000)}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[monthlyDeposit]}
            onValueChange={([value]) => setMonthlyDeposit(value)}
            min={0}
            max={20000}
            step={100}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₪0</span>
            <span>₪20,000</span>
          </div>
        </div>

        {/* Annual Interest */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[annualInterest]}
            onValueChange={([value]) => setAnnualInterest(value)}
            min={0}
            max={15}
            step={0.5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>15%</span>
          </div>
        </div>

        {/* Years */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Calendar className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[years]}
            onValueChange={([value]) => setYears(value)}
            min={1}
            max={30}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>שנה</span>
            <span>30 שנים</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Savings - Highlighted */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              סה"כ חיסכון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              <AnimatedNumber value={result.totalSavings} format={formatCurrency} />
            </p>
          </CardContent>
        </Card>

        {/* Total Deposits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה"כ הפקדות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <AnimatedNumber value={result.totalDeposits} format={formatCurrency} />
            </p>
          </CardContent>
        </Card>

        {/* Total Interest */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              רווחי ריבית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              <AnimatedNumber value={result.totalInterest} format={formatCurrency} />
            </p>
          </CardContent>
        </Card>

        {/* Interest Multiplier */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              תשואה על ההפקדות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <AnimatedNumber 
                value={(result.totalInterest / result.totalDeposits) * 100} 
                format={(n) => `${n.toFixed(1)}%`} 
              />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            צמיחת החיסכון לאורך השנים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bar Chart with animated bars */}
          <div className="flex items-end gap-1 h-48 mb-4">
            {result.yearlyBreakdown.map((yearData, index) => {
              const depositsHeight = (yearData.deposits / maxBalance) * 100;
              const interestHeight = (yearData.interest / maxBalance) * 100;
              
              return (
                <div
                  key={yearData.year}
                  className="flex-1 flex flex-col justify-end group relative"
                  style={{ 
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <p className="font-bold">שנה {yearData.year}</p>
                    <p>סה"כ: {formatCurrency(yearData.balance)}</p>
                    <p>הפקדות: {formatCurrency(yearData.deposits)}</p>
                    <p>ריבית: {formatCurrency(yearData.interest)}</p>
                  </div>
                  
                  {/* Animated Bar */}
                  <div className="w-full flex flex-col rounded-t-sm overflow-hidden">
                    <div
                      className="w-full bg-accent transition-all duration-700 ease-out origin-bottom"
                      style={{ 
                        height: `${interestHeight * 1.9}px`,
                        transitionDelay: `${index * 20}ms`,
                      }}
                    />
                    <div
                      className="w-full bg-primary transition-all duration-700 ease-out origin-bottom"
                      style={{ 
                        height: `${depositsHeight * 1.9}px`,
                        transitionDelay: `${index * 20}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1 text-xs text-muted-foreground">
            {result.yearlyBreakdown.map((yearData, index) => (
              <div key={yearData.year} className="flex-1 text-center">
                {years <= 15 || index % 2 === 0 ? yearData.year : ""}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 justify-center text-sm mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>הפקדות: {formatCurrency(result.totalDeposits)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent" />
              <span>ריבית דריבית: {formatCurrency(result.totalInterest)}</span>
            </div>
          </div>

          {/* Personalized Tips */}
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
              <p>
                💡 <strong>כוח הריבית דריבית:</strong> עם הפקדה חודשית של {formatCurrency(monthlyDeposit)} בריבית {annualInterest}%, 
                אחרי {years} שנים הכסף שלכם יגדל ב-
                <strong> {((result.totalInterest / result.totalDeposits) * 100).toFixed(0)}%</strong> מעבר להפקדות!
              </p>
            </div>
            
            {monthlyDeposit > 0 && monthlyDeposit < 2000 && (
              <div className="p-4 bg-secondary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  📈 <strong>הזדמנות לגדול:</strong> הוספת עוד {formatCurrency(500)} בחודש תוסיף 
                  <strong> {formatCurrency(
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
                  )}</strong> לחיסכון שלכם!
                </p>
              </div>
            )}
            
            {years >= 15 && annualInterest < 5 && (
              <div className="p-4 bg-accent/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🎯 <strong>אופק ארוך:</strong> עם {years} שנות חיסכון, שקלו מסלול השקעות אגרסיבי יותר 
                  שעשוי להניב תשואה גבוהה יותר.
                </p>
              </div>
            )}
            
            {result.totalInterest > result.totalDeposits && (
              <div className="p-4 bg-primary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🎉 <strong>נקודת מפנה!</strong> הריבית דריבית עשתה את שלה - הרווחים גדולים מההפקדות! 
                  זה הכוח של השקעה לטווח ארוך.
                </p>
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
        </CardContent>
      </Card>

      {/* Yearly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            פירוט שנתי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-2 font-medium">שנה</th>
                  <th className="text-center py-3 px-2 font-medium">יתרה</th>
                  <th className="text-center py-3 px-2 font-medium">הפקדות</th>
                  <th className="text-center py-3 px-2 font-medium">ריבית מצטברת</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlyBreakdown.map((yearData) => (
                  <tr key={yearData.year} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{yearData.year}</td>
                    <td className="py-3 px-2 text-center font-bold">{formatCurrency(yearData.balance)}</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{formatCurrency(yearData.deposits)}</td>
                    <td className="py-3 px-2 text-center text-accent font-medium">{formatCurrency(yearData.interest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsCalculator;
