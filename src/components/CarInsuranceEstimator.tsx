import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Car, CircleAlert, FileText, IdCard, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

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

  const range = (low: number, high: number) => (
    <span dir="ltr" className="tabular-nums">{`${formatCurrency(low)}–${formatCurrency(high)}`}</span>
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Driver age */}
        <div className="space-y-4">
          <Label htmlFor="carDriverAge" className="flex items-center gap-2 text-base font-medium">
            <UserRound className="w-4 h-4" />
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
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[driverAge]}
            onValueChange={([value]) => setDriverAge(value)}
            min={17}
            max={80}
            step={1}
            aria-label="גיל הנהג"
          />
        </div>

        {/* License years */}
        <div className="space-y-4">
          <Label htmlFor="carLicenseYears" className="flex items-center gap-2 text-base font-medium">
            <IdCard className="w-4 h-4" />
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
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[effectiveLicenseYears]}
            onValueChange={([value]) => setLicenseYears(value)}
            min={0}
            max={Math.min(60, maxLicenseYears)}
            step={1}
            aria-label="ותק רישיון"
          />
        </div>

        {/* Car value */}
        <div className="space-y-4">
          <Label htmlFor="carValue" className="flex items-center gap-2 text-base font-medium">
            <Car className="w-4 h-4" />
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
            className="text-lg font-medium text-left tabular-nums"
            dir="ltr"
          />
          <Slider
            value={[carValue]}
            onValueChange={([value]) => setCarValue(value)}
            min={20000}
            max={500000}
            step={5000}
            aria-label="שווי הרכב"
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums" dir="ltr">
            <span>₪20,000</span>
            <span>₪500,000</span>
          </div>
        </div>

        {/* Claims */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <FileText className="w-4 h-4" />
            תביעות בשלוש השנים האחרונות
          </Label>
          <RadioGroup
            value={claims}
            onValueChange={(value) => setClaims(value as ClaimsCount)}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="0" id="carClaims0" />
              <Label htmlFor="carClaims0" className="font-normal cursor-pointer">ללא תביעות</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="carClaims1" />
              <Label htmlFor="carClaims1" className="font-normal cursor-pointer">תביעה אחת</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2+" id="carClaims2" />
              <Label htmlFor="carClaims2" className="font-normal cursor-pointer">שתי תביעות או יותר</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Coverage type */}
        <div className="space-y-4 lg:col-span-2">
          <Label className="flex items-center gap-2 text-base font-medium">
            <CircleAlert className="w-4 h-4" />
            סוג הכיסוי
          </Label>
          <RadioGroup
            value={coverage}
            onValueChange={(value) => setCoverage(value as CoverageType)}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-1"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="mandatory" id="carCovMandatory" />
              <Label htmlFor="carCovMandatory" className="font-normal cursor-pointer">חובה בלבד</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="third-party" id="carCovThirdParty" />
              <Label htmlFor="carCovThirdParty" className="font-normal cursor-pointer">צד ג'</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="comprehensive" id="carCovComprehensive" />
              <Label htmlFor="carCovComprehensive" className="font-normal cursor-pointer">מקיף</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Annual range - highlighted */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              טווח פרמיה שנתי משוער ({coverageLabels[coverage]})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {range(result.annualLow, result.annualHigh)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">לשנה, לפי הפרופיל שהזנתם</p>
          </CardContent>
        </Card>

        {/* Monthly equivalent */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              שווה ערך חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{range(result.monthlyLow, result.monthlyHigh)}</p>
            <p className="text-xs text-muted-foreground mt-1">בחלוקה ל-12 תשלומים שווים</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage tiers comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">השוואת שלוש רמות הכיסוי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            {result.tiers.map(({ tier, low, high }) => (
              <div
                key={tier}
                className="flex items-baseline justify-between gap-4 py-3 border-b border-border text-sm last:border-b-0"
              >
                <span className={tier === coverage ? "font-medium" : "text-muted-foreground"}>
                  {coverageLabels[tier]}
                  {tier === coverage && " (נבחר)"}
                </span>
                <span dir="ltr" className="tabular-nums font-medium">
                  {`${formatCurrency(low)}–${formatCurrency(high)}`}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted rounded-xl text-sm text-muted-foreground">
            <p>
              הערכה סטטיסטית בלבד, לפי טווחי שוק מקובלים. המחיר בפועל תלוי בדגם הרכב, בהיסטוריית
              הביטוח המלאה ובחברת הביטוח. הצעה אמיתית מותאמת אישית, תוך{" "}
              <span dir="ltr" className="tabular-nums">48</span> שעות:{" "}
              <Link to="/contact" className="font-medium text-primary underline underline-offset-4">
                השאירו פרטים
              </Link>
              {" "}או קראו עוד על{" "}
              <Link to="/insurance/vehicle" className="font-medium text-primary underline underline-offset-4">
                ביטוח רכב
              </Link>
              .
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CarInsuranceEstimator;
