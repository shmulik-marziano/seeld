import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Banknote, Calendar, GraduationCap, Landmark, ShieldCheck, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

// Needs-based (DIME-style) planning assumptions; review yearly.
const DISCOUNT_RATE = 0.03; // annual real discount rate on the income-replacement annuity
const DEFAULT_EDUCATION_FUND_PER_CHILD = 150000; // ILS per child

interface LifeInsuranceResult {
  incomeReplacementPV: number;
  debtsTotal: number;
  educationTotal: number;
  existingTotal: number;
  recommendedCover: number;
}

const LifeInsuranceCalculator = () => {
  const [monthlyNeed, setMonthlyNeed] = useState(12000);
  const [supportYears, setSupportYears] = useState(15);
  const [debts, setDebts] = useState(500000);
  const [children, setChildren] = useState(2);
  const [educationFund, setEducationFund] = useState(DEFAULT_EDUCATION_FUND_PER_CHILD);
  const [existingCover, setExistingCover] = useState(0);

  const result: LifeInsuranceResult = useMemo(() => {
    // Present value of an annual annuity of monthlyNeed*12 for supportYears at DISCOUNT_RATE
    const incomeReplacementPV =
      monthlyNeed * 12 * ((1 - Math.pow(1 + DISCOUNT_RATE, -supportYears)) / DISCOUNT_RATE);
    const educationTotal = children * educationFund;
    const recommendedCover = Math.max(
      0,
      incomeReplacementPV + debts + educationTotal - existingCover,
    );

    return {
      incomeReplacementPV,
      debtsTotal: debts,
      educationTotal,
      existingTotal: existingCover,
      recommendedCover,
    };
  }, [monthlyNeed, supportYears, debts, children, educationFund, existingCover]);

  const formatCurrency = (value: number) => `₪${Math.round(value).toLocaleString("en-US")}`;

  const money = (value: number) => (
    <span dir="ltr" className="tabular-nums">{formatCurrency(value)}</span>
  );

  const handleAmountChange = (value: string, setter: (v: number) => void, max: number) => {
    const num = parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num) && num >= 0 && num <= max) setter(num);
  };

  const breakdownRows: { label: string; value: number; negative?: boolean }[] = [
    { label: "החלפת הכנסה (ערך נוכחי)", value: result.incomeReplacementPV },
    { label: "חובות ומשכנתא", value: result.debtsTotal },
    { label: "קרן לימודים לילדים", value: result.educationTotal },
    { label: "בניכוי כיסוי וחיסכון קיימים", value: result.existingTotal, negative: true },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Monthly need */}
        <div className="space-y-4">
          <Label htmlFor="lifeMonthlyNeed" className="flex items-center gap-2 text-base font-medium">
            <Banknote className="w-4 h-4" />
            הכנסה חודשית שהמשפחה תצטרך
          </Label>
          <Input
            id="lifeMonthlyNeed"
            type="text"
            value={monthlyNeed.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setMonthlyNeed, 100000)}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[monthlyNeed]}
            onValueChange={([value]) => setMonthlyNeed(value)}
            min={3000}
            max={50000}
            step={500}
            aria-label="הכנסה חודשית שהמשפחה תצטרך"
          />
        </div>

        {/* Years of support */}
        <div className="space-y-4">
          <Label htmlFor="lifeSupportYears" className="flex items-center gap-2 text-base font-medium">
            <Calendar className="w-4 h-4" />
            שנות תמיכה נדרשות
          </Label>
          <Input
            id="lifeSupportYears"
            type="number"
            value={supportYears}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 5 && val <= 30) setSupportYears(val);
            }}
            min={5}
            max={30}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[supportYears]}
            onValueChange={([value]) => setSupportYears(value)}
            min={5}
            max={30}
            step={1}
            aria-label="שנות תמיכה נדרשות"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            נקודת ייחוס מקובלת: עד שהילד הצעיר ביותר יגיע לגיל{" "}
            <span dir="ltr" className="tabular-nums">21</span>.
          </p>
        </div>

        {/* Debts */}
        <div className="space-y-4">
          <Label htmlFor="lifeDebts" className="flex items-center gap-2 text-base font-medium">
            <Landmark className="w-4 h-4" />
            יתרת משכנתא וחובות
          </Label>
          <Input
            id="lifeDebts"
            type="text"
            value={debts.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setDebts, 5000000)}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[debts]}
            onValueChange={([value]) => setDebts(value)}
            min={0}
            max={3000000}
            step={25000}
            aria-label="יתרת משכנתא וחובות"
          />
        </div>

        {/* Children */}
        <div className="space-y-4">
          <Label htmlFor="lifeChildren" className="flex items-center gap-2 text-base font-medium">
            <Users className="w-4 h-4" />
            מספר ילדים
          </Label>
          <Input
            id="lifeChildren"
            type="number"
            value={children}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0 && val <= 8) setChildren(val);
            }}
            min={0}
            max={8}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[children]}
            onValueChange={([value]) => setChildren(value)}
            min={0}
            max={8}
            step={1}
            aria-label="מספר ילדים"
          />
        </div>

        {/* Education fund per child */}
        <div className="space-y-4">
          <Label htmlFor="lifeEducationFund" className="flex items-center gap-2 text-base font-medium">
            <GraduationCap className="w-4 h-4" />
            קרן לימודים לכל ילד
          </Label>
          <Input
            id="lifeEducationFund"
            type="text"
            value={educationFund.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setEducationFund, 1000000)}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[educationFund]}
            onValueChange={([value]) => setEducationFund(value)}
            min={0}
            max={500000}
            step={10000}
            aria-label="קרן לימודים לכל ילד"
          />
        </div>

        {/* Existing cover + savings */}
        <div className="space-y-4">
          <Label htmlFor="lifeExistingCover" className="flex items-center gap-2 text-base font-medium">
            <ShieldCheck className="w-4 h-4" />
            כיסוי קיים וחיסכון נזיל
          </Label>
          <Input
            id="lifeExistingCover"
            type="text"
            value={existingCover.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setExistingCover, 10000000)}
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[existingCover]}
            onValueChange={([value]) => setExistingCover(value)}
            min={0}
            max={3000000}
            step={25000}
            aria-label="כיסוי קיים וחיסכון נזיל"
          />
        </div>
      </div>

      {/* Result: recommended cover */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            סכום הכיסוי המומלץ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{money(result.recommendedCover)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            כך שההכנסה, החובות ועתיד הילדים מכוסים גם בלעדיכם.
          </p>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">איך הגענו לסכום</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            {breakdownRows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 py-3 border-b border-border text-sm"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span dir="ltr" className="tabular-nums font-medium">
                  {row.negative ? `-${formatCurrency(row.value)}` : formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <span className="font-medium">סך הכיסוי המומלץ</span>
              <span dir="ltr" className="tabular-nums font-bold">
                {formatCurrency(result.recommendedCover)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
            <p>
              זו הערכת תכנון שממירה את צרכי המשפחה לסכום כיסוי, לא הצעת ביטוח. הסכום הסופי
              נקבע מול חברת הביטוח לפי גיל, מצב בריאותי ותנאי הפוליסה.{" "}
              <Link to="/insurance/life" className="font-medium text-primary underline underline-offset-4">
                לפרטים על ביטוח חיים
              </Link>
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <SaveCalculationButton
              calculatorType="life-insurance"
              inputData={{ monthlyNeed, supportYears, debts, children, educationFund, existingCover }}
              resultData={{
                recommendedCover: result.recommendedCover,
                incomeReplacementPV: result.incomeReplacementPV,
                debtsTotal: result.debtsTotal,
                educationTotal: result.educationTotal,
                existingTotal: result.existingTotal,
              }}
              tips={[
                "בדקו אם קיים כיסוי חיים דרך קרן הפנסיה או המעסיק לפני רכישת פוליסה חדשה",
                children > 0 ? "עדכנו את החישוב כשהילדים מתבגרים; הצורך בכיסוי קטן עם השנים" : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LifeInsuranceCalculator;
