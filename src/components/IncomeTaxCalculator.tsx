import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Banknote, Percent, Receipt, UserRound, BadgePercent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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
          <Label htmlFor="taxGrossSalary" className="flex items-center gap-2 text-base font-medium">
            <Banknote className="w-4 h-4" />
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
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[grossMonthly]}
            onValueChange={([value]) => setGrossMonthly(value)}
            min={5000}
            max={100000}
            step={500}
            aria-label="שכר חודשי ברוטו"
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums" dir="ltr">
            <span>₪5,000</span>
            <span>₪100,000</span>
          </div>
        </div>

        {/* Gender (determines base credit points) */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <UserRound className="w-4 h-4" />
            מין (קובע נקודות בסיס)
          </Label>
          <RadioGroup
            value={gender}
            onValueChange={(value) => setGender(value as "male" | "female")}
            className="flex flex-col gap-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="taxGenderMale" />
              <Label htmlFor="taxGenderMale" className="font-normal cursor-pointer">
                גבר תושב ישראל (<span dir="ltr" className="tabular-nums">2.25</span> נקודות)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="taxGenderFemale" />
              <Label htmlFor="taxGenderFemale" className="font-normal cursor-pointer">
                אישה תושבת ישראל (<span dir="ltr" className="tabular-nums">2.75</span> נקודות)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Additional Credit Points */}
        <div className="space-y-4">
          <Label htmlFor="taxExtraPoints" className="flex items-center gap-2 text-base font-medium">
            <BadgePercent className="w-4 h-4" />
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
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            ילדים, עולה חדש ותואר אקדמי מוסיפים כל אחד נקודות זיכוי. כל נקודה שווה{" "}
            {money(CREDIT_POINT_VALUE_2026)} בחודש.
          </p>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Monthly Tax - Highlighted */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              מס חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{money(result.monthlyTax)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              אחרי זיכוי של {money(result.creditValue)} (
              <span dir="ltr" className="tabular-nums">{result.creditPoints}</span> נקודות)
            </p>
          </CardContent>
        </Card>

        {/* Net after income tax */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              נטו ממס הכנסה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{money(result.netAfterIncomeTax)}</p>
          </CardContent>
        </Card>

        {/* Annual Tax */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">מס שנתי</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{money(result.annualTax)}</p>
          </CardContent>
        </Card>

        {/* Marginal Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              מס שולי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <span dir="ltr" className="tabular-nums">{result.marginalRate.toFixed(0)}%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">על השקל הבא שתרוויחו</p>
          </CardContent>
        </Card>

        {/* Effective Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              מס אפקטיבי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <span dir="ltr" className="tabular-nums">{result.effectiveRate.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">מתוך הברוטו בפועל</p>
          </CardContent>
        </Card>
      </div>

      {/* Scope + refund teaser */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            החישוב כולל מס הכנסה בלבד, ללא ביטוח לאומי ודמי בריאות. הנטו בפועל בתלוש יהיה נמוך
            יותר, כי הניכויים האלה מחושבים בנפרד.
          </p>
          <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
            <p>
              עבדתם חלק מהשנה או לא ניצלתם נקודות זיכוי? ייתכן שמגיע לכם החזר מס.{" "}
              <Link to="/rights-extraction" className="font-medium text-primary underline underline-offset-4">
                בדקו זכאות להחזר
              </Link>
            </p>
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
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground text-center">
        * מדרגות המס ונקודות הזיכוי לפי פרמטרי ינואר 2026 של רשות המסים. החישוב הוא הערכה
        לתכנון, לא ייעוץ מס. לחבות מס מדויקת פנו לרואה חשבון או יועץ מס.
      </div>
    </div>
  );
};

export default IncomeTaxCalculator;
