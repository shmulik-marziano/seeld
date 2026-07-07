import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Banknote, Calendar, GraduationCap, Landmark, ShieldCheck, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, table.dna-data breakdown.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

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
          <Label htmlFor="lifeMonthlyNeed" className={labelClass}>
            <Banknote className="w-4 h-4" style={{ color: TURQ }} />
            הכנסה חודשית שהמשפחה תצטרך
          </Label>
          <Input
            id="lifeMonthlyNeed"
            type="text"
            value={monthlyNeed.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setMonthlyNeed, 100000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[monthlyNeed]}
            onValueChange={([value]) => setMonthlyNeed(value)}
            min={3000}
            max={50000}
            step={500}
            aria-label="הכנסה חודשית שהמשפחה תצטרך"
            className={sliderClass}
          />
        </div>

        {/* Years of support */}
        <div className="space-y-4">
          <Label htmlFor="lifeSupportYears" className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
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
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[supportYears]}
            onValueChange={([value]) => setSupportYears(value)}
            min={5}
            max={30}
            step={1}
            aria-label="שנות תמיכה נדרשות"
            className={sliderClass}
          />
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            נקודת ייחוס מקובלת: עד שהילד הצעיר ביותר יגיע לגיל{" "}
            <span dir="ltr" className="tabular-nums">21</span>.
          </p>
        </div>

        {/* Debts */}
        <div className="space-y-4">
          <Label htmlFor="lifeDebts" className={labelClass}>
            <Landmark className="w-4 h-4" style={{ color: TURQ }} />
            יתרת משכנתא וחובות
          </Label>
          <Input
            id="lifeDebts"
            type="text"
            value={debts.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setDebts, 5000000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[debts]}
            onValueChange={([value]) => setDebts(value)}
            min={0}
            max={3000000}
            step={25000}
            aria-label="יתרת משכנתא וחובות"
            className={sliderClass}
          />
        </div>

        {/* Children */}
        <div className="space-y-4">
          <Label htmlFor="lifeChildren" className={labelClass}>
            <Users className="w-4 h-4" style={{ color: TURQ }} />
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
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[children]}
            onValueChange={([value]) => setChildren(value)}
            min={0}
            max={8}
            step={1}
            aria-label="מספר ילדים"
            className={sliderClass}
          />
        </div>

        {/* Education fund per child */}
        <div className="space-y-4">
          <Label htmlFor="lifeEducationFund" className={labelClass}>
            <GraduationCap className="w-4 h-4" style={{ color: TURQ }} />
            קרן לימודים לכל ילד
          </Label>
          <Input
            id="lifeEducationFund"
            type="text"
            value={educationFund.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setEducationFund, 1000000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[educationFund]}
            onValueChange={([value]) => setEducationFund(value)}
            min={0}
            max={500000}
            step={10000}
            aria-label="קרן לימודים לכל ילד"
            className={sliderClass}
          />
        </div>

        {/* Existing cover + savings */}
        <div className="space-y-4">
          <Label htmlFor="lifeExistingCover" className={labelClass}>
            <ShieldCheck className="w-4 h-4" style={{ color: TURQ }} />
            כיסוי קיים וחיסכון נזיל
          </Label>
          <Input
            id="lifeExistingCover"
            type="text"
            value={existingCover.toLocaleString("en-US")}
            onChange={(e) => handleAmountChange(e.target.value, setExistingCover, 10000000)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[existingCover]}
            onValueChange={([value]) => setExistingCover(value)}
            min={0}
            max={3000000}
            step={25000}
            aria-label="כיסוי קיים וחיסכון נזיל"
            className={sliderClass}
          />
        </div>
      </div>

      {/* Result: recommended cover — standout stat */}
      <div className="dna-concept !p-6">
        <p className="text-[13px] mb-2" style={{ color: MUTED }}>סכום הכיסוי המומלץ</p>
        <p
          className="tabular-nums"
          dir="ltr"
          style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(2.2rem, 4vw, 2.9rem)", lineHeight: 1.15 }}
        >
          {formatCurrency(result.recommendedCover)}
        </p>
        <p className="text-xs mt-2" style={{ color: MUTED }}>
          כך שההכנסה, החובות ועתיד הילדים מכוסים גם בלעדיכם.
        </p>
      </div>

      {/* Breakdown — the data craft */}
      <div className="dna-concept !p-6 space-y-5">
        <h3 className="text-[19px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          איך הגענו לסכום
        </h3>

        <div className="overflow-x-auto">
          <table className="dna-data">
            <thead>
              <tr>
                <th>רכיב</th>
                <th>סכום</th>
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num" style={row.negative ? { color: "#a04a5c" } : undefined}>
                    {row.negative ? `-${formatCurrency(row.value)}` : formatCurrency(row.value)}
                  </td>
                </tr>
              ))}
              <tr>
                <td>סך הכיסוי המומלץ</td>
                <td className="num font-bold" style={{ color: NAVY }}>
                  {formatCurrency(result.recommendedCover)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="dna-callout text-sm">
          זו הערכת תכנון שממירה את צרכי המשפחה לסכום כיסוי, לא הצעת ביטוח. הסכום הסופי
          נקבע מול חברת הביטוח לפי גיל, מצב בריאותי ותנאי הפוליסה.{" "}
          <Link
            to="/insurance/life"
            className="font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/30 pb-0.5 hover:border-[#1D2D3D] transition-colors"
          >
            לפרטים על ביטוח חיים
          </Link>
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
      </div>
    </div>
  );
};

export default LifeInsuranceCalculator;
