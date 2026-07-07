import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Car, CircleAlert, FileText, IdCard, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stat, table.dna-data tier comparison.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";
const radioItemClass = "border-[#1D2D3D] text-[#1D2D3D]";

// הערכה סטטיסטית לפי טווחי שוק מקובלים — לא הצעת מחיר.
// Typical-market heuristics (annual, ILS); review yearly against market data.
const MANDATORY_BASE = 1900; // חובה base premium per year
const THIRD_PARTY_ADDON = 1400; // צד ג' addon on top of חובה
const COMPREHENSIVE_VALUE_RATE = 0.022; // מקיף addon: 2.2% of car value per year
// Risk multipliers applied to the non-חובה part of the premium:
const ageMultiplier = (age: number) => (age < 24 ? 1.6 : age <= 30 ? 1.25 : age <= 65 ? 1.0 : 1.15);
const licenseMultiplier = (years: number) => (years < 2 ? 1.4 : years <= 5 ? 1.15 : 1.0);
const claimsMultiplier = (claims: "0" | "1" | "2+") => (claims === "0" ? 1.0 : claims === "1" ? 1.2 : 1.5);
const RANGE_LOW = 0.85; // range around the mid estimate
const RANGE_HIGH = 1.2;

type CoverageType = "mandatory" | "third-party" | "comprehensive";
type ClaimsCount = "0" | "1" | "2+";

const coverageLabels: Record<CoverageType, string> = {
  mandatory: "חובה בלבד",
  "third-party": "צד ג'",
  comprehensive: "מקיף",
};

const roundTo50 = (value: number) => Math.round(value / 50) * 50;

const estimateAnnualMid = (
  coverage: CoverageType,
  carValue: number,
  age: number,
  licenseYears: number,
  claims: ClaimsCount,
) => {
  const addon =
    coverage === "mandatory"
      ? 0
      : coverage === "third-party"
        ? THIRD_PARTY_ADDON
        : THIRD_PARTY_ADDON + carValue * COMPREHENSIVE_VALUE_RATE;
  const riskMultiplier = ageMultiplier(age) * licenseMultiplier(licenseYears) * claimsMultiplier(claims);
  return MANDATORY_BASE + addon * riskMultiplier;
};

const CarInsuranceEstimator = () => {
  const [driverAge, setDriverAge] = useState(35);
  const [licenseYears, setLicenseYears] = useState(10);
  const [claims, setClaims] = useState<ClaimsCount>("0");
  const [carValue, setCarValue] = useState(120000);
  const [coverage, setCoverage] = useState<CoverageType>("comprehensive");

  const maxLicenseYears = Math.max(0, driverAge - 16);
  const effectiveLicenseYears = Math.min(licenseYears, maxLicenseYears);

  const result = useMemo(() => {
    const mid = estimateAnnualMid(coverage, carValue, driverAge, effectiveLicenseYears, claims);
    const annualLow = roundTo50(mid * RANGE_LOW);
    const annualHigh = roundTo50(mid * RANGE_HIGH);
    const tiers = (["mandatory", "third-party", "comprehensive"] as CoverageType[]).map((tier) => {
      const tierMid = estimateAnnualMid(tier, carValue, driverAge, effectiveLicenseYears, claims);
      return {
        tier,
        low: roundTo50(tierMid * RANGE_LOW),
        high: roundTo50(tierMid * RANGE_HIGH),
      };
    });
    return { annualLow, annualHigh, monthlyLow: annualLow / 12, monthlyHigh: annualHigh / 12, tiers };
  }, [coverage, carValue, driverAge, effectiveLicenseYears, claims]);

  const formatCurrency = (value: number) => `₪${Math.round(value).toLocaleString("en-US")}`;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Driver age */}
        <div className="space-y-4">
          <Label htmlFor="carDriverAge" className={labelClass}>
            <UserRound className="w-4 h-4" style={{ color: TURQ }} />
            גיל הנהג הצעיר ברכב
          </Label>
          <Input
            id="carDriverAge"
            type="number"
            value={driverAge}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 17 && val <= 80) setDriverAge(val);
            }}
            min={17}
            max={80}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[driverAge]}
            onValueChange={([value]) => setDriverAge(value)}
            min={17}
            max={80}
            step={1}
            aria-label="גיל הנהג"
            className={sliderClass}
          />
        </div>

        {/* License years */}
        <div className="space-y-4">
          <Label htmlFor="carLicenseYears" className={labelClass}>
            <IdCard className="w-4 h-4" style={{ color: TURQ }} />
            ותק רישיון (שנים)
          </Label>
          <Input
            id="carLicenseYears"
            type="number"
            value={effectiveLicenseYears}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0 && val <= 60) setLicenseYears(Math.min(val, maxLicenseYears));
            }}
            min={0}
            max={Math.min(60, maxLicenseYears)}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[effectiveLicenseYears]}
            onValueChange={([value]) => setLicenseYears(value)}
            min={0}
            max={Math.min(60, maxLicenseYears)}
            step={1}
            aria-label="ותק רישיון"
            className={sliderClass}
          />
        </div>

        {/* Car value */}
        <div className="space-y-4">
          <Label htmlFor="carValue" className={labelClass}>
            <Car className="w-4 h-4" style={{ color: TURQ }} />
            שווי הרכב
          </Label>
          <Input
            id="carValue"
            type="text"
            value={carValue.toLocaleString("en-US")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/,/g, ""), 10);
              if (!isNaN(num) && num >= 0 && num <= 500000) setCarValue(num);
            }}
            className={inputClass}
            dir="ltr"
          />
          <Slider
            value={[carValue]}
            onValueChange={([value]) => setCarValue(value)}
            min={20000}
            max={500000}
            step={5000}
            aria-label="שווי הרכב"
            className={sliderClass}
          />
          <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
            <span>₪20,000</span>
            <span>₪500,000</span>
          </div>
        </div>

        {/* Claims */}
        <div className="space-y-4">
          <Label className={labelClass}>
            <FileText className="w-4 h-4" style={{ color: TURQ }} />
            תביעות בשלוש השנים האחרונות
          </Label>
          <RadioGroup
            value={claims}
            onValueChange={(value) => setClaims(value as ClaimsCount)}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="0" id="carClaims0" className={radioItemClass} />
              <Label htmlFor="carClaims0" className="font-normal cursor-pointer text-[#3a4c5a]">ללא תביעות</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="carClaims1" className={radioItemClass} />
              <Label htmlFor="carClaims1" className="font-normal cursor-pointer text-[#3a4c5a]">תביעה אחת</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2+" id="carClaims2" className={radioItemClass} />
              <Label htmlFor="carClaims2" className="font-normal cursor-pointer text-[#3a4c5a]">שתי תביעות או יותר</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Coverage type */}
        <div className="space-y-4 lg:col-span-2">
          <Label className={labelClass}>
            <CircleAlert className="w-4 h-4" style={{ color: TURQ }} />
            סוג הכיסוי
          </Label>
          <RadioGroup
            value={coverage}
            onValueChange={(value) => setCoverage(value as CoverageType)}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="mandatory" id="carCovMandatory" className={radioItemClass} />
              <Label htmlFor="carCovMandatory" className="font-normal cursor-pointer text-[#3a4c5a]">חובה בלבד</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="third-party" id="carCovThirdParty" className={radioItemClass} />
              <Label htmlFor="carCovThirdParty" className="font-normal cursor-pointer text-[#3a4c5a]">צד ג'</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="comprehensive" id="carCovComprehensive" className={radioItemClass} />
              <Label htmlFor="carCovComprehensive" className="font-normal cursor-pointer text-[#3a4c5a]">מקיף</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Annual range - standout stat */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>
            טווח פרמיה שנתי משוער ({coverageLabels[coverage]})
          </p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.8rem, 3vw, 2.2rem)", lineHeight: 1.15, whiteSpace: "nowrap" }}
          >
            {`${formatCurrency(result.annualLow)}–${formatCurrency(result.annualHigh)}`}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>לשנה, לפי הפרופיל שהזנתם</p>
        </div>

        {/* Monthly equivalent */}
        <div className="dna-concept">
          <p className="text-[13px] mb-2" style={{ color: MUTED }}>שווה ערך חודשי</p>
          <p
            className="text-[22px] font-semibold tabular-nums"
            dir="ltr"
            style={{ fontFamily: MONO, color: NAVY, whiteSpace: "nowrap" }}
          >
            {`${formatCurrency(result.monthlyLow)}–${formatCurrency(result.monthlyHigh)}`}
          </p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>בחלוקה ל-12 תשלומים שווים</p>
        </div>
      </div>

      {/* Coverage tiers comparison — the data craft */}
      <div className="dna-concept !p-6 space-y-5">
        <h3 className="text-[19px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          השוואת שלוש רמות הכיסוי
        </h3>

        <div className="overflow-x-auto">
          <table className="dna-data">
            <thead>
              <tr>
                <th>רמת כיסוי</th>
                <th>טווח שנתי משוער</th>
              </tr>
            </thead>
            <tbody>
              {result.tiers.map(({ tier, low, high }) => (
                <tr key={tier}>
                  <td>
                    {coverageLabels[tier]}
                    {tier === coverage && " (נבחר)"}
                  </td>
                  <td className="num" style={tier === coverage ? { color: "#356d60", fontWeight: 700 } : undefined}>
                    {`${formatCurrency(low)}–${formatCurrency(high)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dna-quote gold">
          <div className="dna-ql">הבהרה</div>
          <div className="dna-qt">
            הערכה סטטיסטית בלבד, לפי טווחי שוק מקובלים. המחיר בפועל תלוי בדגם הרכב, בהיסטוריית
            הביטוח המלאה ובחברת הביטוח. הצעה אמיתית מותאמת אישית, תוך{" "}
            <span dir="ltr" className="tabular-nums">48</span> שעות:{" "}
            <Link
              to="/contact"
              className="font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/30 pb-0.5 hover:border-[#1D2D3D] transition-colors"
            >
              השאירו פרטים
            </Link>
            {" "}או קראו עוד על{" "}
            <Link
              to="/insurance/vehicle"
              className="font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/30 pb-0.5 hover:border-[#1D2D3D] transition-colors"
            >
              ביטוח רכב
            </Link>
            .
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <SaveCalculationButton
            calculatorType="car-insurance"
            inputData={{ driverAge, licenseYears: effectiveLicenseYears, claims, carValue, coverage }}
            resultData={{
              annualLow: result.annualLow,
              annualHigh: result.annualHigh,
              monthlyLow: Math.round(result.monthlyLow),
              monthlyHigh: Math.round(result.monthlyHigh),
              coverage,
            }}
            tips={[
              "השוו לפחות שלוש הצעות לפני חידוש; פערי המחיר בין חברות מגיעים לעשרות אחוזים",
              claims !== "0" ? "אחרי שלוש שנים ללא תביעות הפרמיה יורדת משמעותית" : undefined,
            ].filter(Boolean) as string[]}
          />
        </div>
      </div>
    </div>
  );
};

export default CarInsuranceEstimator;
