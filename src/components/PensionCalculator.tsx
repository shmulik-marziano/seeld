import { useState, useMemo } from "react";
import { User, Banknote, Percent, Calendar, TrendingUp, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Age */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <User className="w-4 h-4" />
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
            <Calendar className="w-4 h-4" />
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

        {/* Monthly Salary */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Banknote className="w-4 h-4" />
            משכורת חודשית
          </Label>
          <Input
            type="text"
            value={monthlySalary.toLocaleString("he-IL")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0 && num <= 200000) setMonthlySalary(num);
            }}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[monthlySalary]}
            onValueChange={([value]) => setMonthlySalary(value)}
            min={5000}
            max={80000}
            step={1000}
          />
        </div>

        {/* Current Savings */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <PiggyBank className="w-4 h-4" />
            חיסכון קיים
          </Label>
          <Input
            type="text"
            value={currentSavings.toLocaleString("he-IL")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0) setCurrentSavings(num);
            }}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[currentSavings]}
            onValueChange={([value]) => setCurrentSavings(value)}
            min={0}
            max={2000000}
            step={10000}
          />
        </div>
      </div>

      {/* Deposit Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="w-5 h-5" />
            אחוזי הפקדה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <Label className="text-sm">הפקדת עובד (%)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[employeeDeposit]}
                  onValueChange={([value]) => setEmployeeDeposit(value)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-left">{employeeDeposit}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm">הפקדת מעסיק (%)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[employerDeposit]}
                  onValueChange={([value]) => setEmployerDeposit(value)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-left">{employerDeposit}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm">פיצויים (%)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[severanceDeposit]}
                  onValueChange={([value]) => setSeveranceDeposit(value)}
                  min={0}
                  max={8.33}
                  step={0.33}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-left">{severanceDeposit.toFixed(2)}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm">תשואה שנתית צפויה (%)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[annualReturn]}
                  onValueChange={([value]) => setAnnualReturn(value)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-left">{annualReturn}%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
            סה"כ הפקדה חודשית: <strong>{formatCurrency((monthlySalary * (employeeDeposit + employerDeposit + severanceDeposit)) / 100)}</strong>
            {" "}({(employeeDeposit + employerDeposit + severanceDeposit).toFixed(2)}% מהשכר)
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Pension - Highlighted */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              פנסיה חודשית צפויה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(result.monthlyPension)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((result.monthlyPension / monthlySalary) * 100).toFixed(0)}% מהשכר הנוכחי
            </p>
          </CardContent>
        </Card>

        {/* Total Savings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה"כ חיסכון בפרישה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(result.totalSavings)}</p>
          </CardContent>
        </Card>

        {/* Total Returns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              רווחי השקעה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(result.totalReturns)}
            </p>
          </CardContent>
        </Card>

        {/* Years to Retirement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              שנים עד פרישה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{result.yearsToRetirement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" />
            פירוט החיסכון
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="h-8 rounded-full overflow-hidden flex">
            <div
              className="bg-primary transition-all duration-500 flex items-center justify-center text-primary-foreground text-xs font-medium"
              style={{ width: `${(result.totalDeposits / result.totalSavings) * 100}%` }}
            >
              {(result.totalDeposits / result.totalSavings) * 100 > 20 && "הפקדות"}
            </div>
            <div
              className="bg-accent transition-all duration-500 flex items-center justify-center text-accent-foreground text-xs font-medium"
              style={{ width: `${(result.totalReturns / result.totalSavings) * 100}%` }}
            >
              {(result.totalReturns / result.totalSavings) * 100 > 20 && "רווחים"}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>הפקדות: {formatCurrency(result.totalDeposits)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent" />
              <span>רווחים: {formatCurrency(result.totalReturns)}</span>
            </div>
          </div>

          {/* Personalized Tips */}
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
              <p>
                💡 <strong>טיפ:</strong> הגדלת הפקדת העובד ב-1% תוסיף לחיסכון שלכם כ-
                <strong>
                  {formatCurrency(
                    (() => {
                      const extraMonthly = monthlySalary * 0.01;
                      const months = result.yearsToRetirement * 12;
                      const rate = annualReturn / 100 / 12;
                      if (rate === 0) return extraMonthly * months;
                      return extraMonthly * ((Math.pow(1 + rate, months) - 1) / rate);
                    })()
                  )}
                </strong>
                {" "}עד גיל הפרישה.
              </p>
            </div>
            
            {result.yearsToRetirement > 25 && (
              <div className="p-4 bg-secondary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🎯 <strong>יתרון הזמן:</strong> עוד {result.yearsToRetirement} שנים עד הפרישה! 
                  זה הזמן המושלם להגדיל סיכון במסלול ההשקעות ולהניב תשואות גבוהות יותר.
                </p>
              </div>
            )}
            
            {result.yearsToRetirement <= 10 && result.yearsToRetirement > 0 && (
              <div className="p-4 bg-accent/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ⏰ <strong>קרבה לפרישה:</strong> עם {result.yearsToRetirement} שנים בלבד עד הפרישה, 
                  כדאי לשקול מעבר למסלול סולידי יותר כדי להגן על החיסכון.
                </p>
              </div>
            )}
            
            {(result.monthlyPension / monthlySalary) < 0.5 && (
              <div className="p-4 bg-destructive/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ⚠️ <strong>פער פנסיוני:</strong> הפנסיה הצפויה היא רק {((result.monthlyPension / monthlySalary) * 100).toFixed(0)}% מהשכר. 
                  שקלו להגדיל הפקדות או לבדוק קרן השתלמות נוספת.
                </p>
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
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground text-center">
        * החישוב מבוסס על הנחות תיאורטיות ואינו מהווה ייעוץ פנסיוני. לקבלת תחזית מדויקת, פנו ליועץ פנסיוני מוסמך.
      </div>
    </div>
  );
};

export default PensionCalculator;
