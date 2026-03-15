import { useState, useMemo } from "react";
import { Home, Calculator, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Loan Amount */}
        <div className="space-y-4">
          <Label htmlFor="loanAmount" className="flex items-center gap-2 text-base font-medium">
            <Home className="w-4 h-4" />
            סכום המשכנתא
          </Label>
          <Input
            id="loanAmount"
            type="text"
            value={loanAmount.toLocaleString("he-IL")}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[loanAmount]}
            onValueChange={([value]) => setLoanAmount(value)}
            min={100000}
            max={5000000}
            step={50000}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₪100,000</span>
            <span>₪5,000,000</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-4">
          <Label htmlFor="interestRate" className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[interestRate]}
            onValueChange={([value]) => setInterestRate(value)}
            min={0}
            max={10}
            step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Loan Term */}
        <div className="space-y-4">
          <Label htmlFor="loanTerm" className="flex items-center gap-2 text-base font-medium">
            <Calendar className="w-4 h-4" />
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
            className="text-lg font-medium text-left"
            dir="ltr"
          />
          <Slider
            value={[loanTerm]}
            onValueChange={([value]) => setLoanTerm(value)}
            min={5}
            max={30}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 שנים</span>
            <span>30 שנים</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Payment - Highlighted */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              החזר חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(result.monthlyPayment)}
            </p>
          </CardContent>
        </Card>

        {/* Total Payment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה"כ תשלום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(result.totalPayment)}</p>
          </CardContent>
        </Card>

        {/* Total Interest */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה"כ ריבית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(result.totalInterest)}
            </p>
          </CardContent>
        </Card>

        {/* Number of Payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              מספר תשלומים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loanTerm * 12}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            פירוט התשלום
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="h-8 rounded-full overflow-hidden flex">
            <div
              className="bg-primary transition-all duration-500 flex items-center justify-center text-primary-foreground text-xs font-medium"
              style={{ width: `${result.principalPercent}%` }}
            >
              {result.principalPercent > 15 && `קרן ${result.principalPercent.toFixed(0)}%`}
            </div>
            <div
              className="bg-destructive transition-all duration-500 flex items-center justify-center text-destructive-foreground text-xs font-medium"
              style={{ width: `${result.interestPercent}%` }}
            >
              {result.interestPercent > 15 && `ריבית ${result.interestPercent.toFixed(0)}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>קרן: {formatCurrency(loanAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive" />
              <span>ריבית: {formatCurrency(result.totalInterest)}</span>
            </div>
          </div>

          {/* Personalized Tips */}
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
              <p>
                💡 <strong>טיפ:</strong> הורדת הריבית ב-0.5% תחסוך לכם{" "}
                <strong>
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
              </p>
            </div>
            
            {loanTerm > 20 && (
              <div className="p-4 bg-secondary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ⏱️ <strong>קיצור תקופה:</strong> אם תקצרו את המשכנתא ל-{loanTerm - 5} שנים, 
                  ההחזר החודשי יעלה ב-
                  <strong>
                    {formatCurrency(
                      (() => {
                        const shorterN = (loanTerm - 5) * 12;
                        const rate = interestRate / 100 / 12;
                        if (rate === 0) return loanAmount / shorterN - result.monthlyPayment;
                        const shorterPayment = (loanAmount * (rate * Math.pow(1 + rate, shorterN))) / (Math.pow(1 + rate, shorterN) - 1);
                        return shorterPayment - result.monthlyPayment;
                      })()
                    )}
                  </strong> אבל תחסכו <strong>
                    {formatCurrency(
                      (() => {
                        const shorterN = (loanTerm - 5) * 12;
                        const rate = interestRate / 100 / 12;
                        if (rate === 0) return 0;
                        const shorterPayment = (loanAmount * (rate * Math.pow(1 + rate, shorterN))) / (Math.pow(1 + rate, shorterN) - 1);
                        return result.totalPayment - (shorterPayment * shorterN);
                      })()
                    )}
                  </strong> בסה"כ!
                </p>
              </div>
            )}
            
              {result.interestPercent > 40 && (
              <div className="p-4 bg-destructive/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  ⚠️ <strong>שימו לב:</strong> הריבית מהווה {result.interestPercent.toFixed(0)}% מהתשלום הכולל. 
                  שקלו לבחון מסלולים עם ריבית נמוכה יותר או להקדים תשלומים.
                </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MortgageCalculator;
