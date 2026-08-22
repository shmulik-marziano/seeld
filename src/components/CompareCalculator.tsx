import { useState, useMemo, useEffect, useRef } from "react";
import { Calendar, Banknote, Rocket, Scale, Baby, Star, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SaveCalculationButton from "@/components/SaveCalculationButton";
import { DISPLAY, MONO, MUTED, NAVY, TURQ, TURQ_TEXT } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): boxed inputs, .dna-concept result cards,
// Frank Ruhl 900 turquoise standout stats, kit CSS bar chart with mono LTR values.

const inputClass =
  "h-12 text-lg font-medium text-left tabular-nums bg-white border-[#E7EDF1] rounded-lg text-[#1D2D3D] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1D2D3D]";
const sliderClass =
  "[&>span:first-child]:bg-[#EEF3F6] [&>span:first-child>span]:bg-[#4E9D8F] [&_[role=slider]]:border-[#4E9D8F]";
const labelClass = "flex items-center gap-2 text-base font-medium text-[#1D2D3D]";

interface Track {
  name: string;
  rate: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface TrackResult extends Track {
  finalValue: number;
  profit: number;
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

// Investment tracks with their average annual returns (based on 5-year averages).
// Module scope on purpose: rebuilt inside the component this array was a fresh
// reference every render, which is why the memo below had to lie about its deps.
const tracks: Track[] = [
  { name: "מניות", rate: 12.25, icon: Rocket },
  { name: "כללי", rate: 8.21, icon: Scale },
  { name: "לבני 50-", rate: 9.03, icon: Baby },
  { name: "הלכתי", rate: 6.96, icon: Star },
  { name: "אג\"ח", rate: 3.21, icon: Shield },
];

const CompareCalculator = () => {
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [years, setYears] = useState(5);

  const results: TrackResult[] = useMemo(() => {
    return tracks.map((track) => {
      const finalValue = investmentAmount * Math.pow(1 + track.rate / 100, years);
      const profit = finalValue - investmentAmount;

      return {
        ...track,
        finalValue,
        profit,
      };
    });
  }, [investmentAmount, years]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAmountChange = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num) && num >= 0 && num <= 10000000) {
      setInvestmentAmount(num);
    }
  };

  // Find the best and worst performers
  const maxProfit = Math.max(...results.map(r => r.profit));
  const minProfit = Math.min(...results.map(r => r.profit));

  return (
    <div className="space-y-8" dir="rtl">
      {/* Main Investment Input - Big and Prominent */}
      <div className="space-y-3">
        <Label htmlFor="compareAmount" className={labelClass}>
          <Banknote className="w-4 h-4" style={{ color: TURQ }} />
          כמה תרצו להשקיע?
        </Label>
        <div className="relative max-w-xl">
          <Input
            id="compareAmount"
            type="text"
            value={investmentAmount.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value)}
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

      {/* Years Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className={labelClass}>
            <Calendar className="w-4 h-4" style={{ color: TURQ }} />
            לכמה שנים?
          </Label>
          <span
            className="text-2xl tabular-nums"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ }}
          >
            {years} שנים
          </span>
        </div>
        <Slider
          value={[years]}
          onValueChange={([value]) => setYears(value)}
          min={1}
          max={20}
          step={1}
          className={sliderClass}
        />
        <div className="flex justify-between text-xs tabular-nums" style={{ color: MUTED }} dir="ltr">
          <span>שנה</span>
          <span>20 שנים</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {results.map((track) => {
          const Icon = track.icon;
          const isBest = track.profit === maxProfit;

          return (
            <div
              key={track.name}
              className="dna-concept dna-hover relative text-center"
              style={isBest ? { borderColor: TURQ, boxShadow: "0 0 0 1px #4E9D8F" } : undefined}
            >
              {isBest && (
                <span
                  className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-white text-[11px] font-medium"
                  style={{ backgroundColor: TURQ_TEXT }}
                >
                  הטוב ביותר
                </span>
              )}
              <Icon className="w-6 h-6 mx-auto mt-1 mb-3" style={{ color: isBest ? TURQ : NAVY }} />
              <h3 className="text-[17px] mb-1" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                {track.name}
              </h3>
              <p className="text-[13px] mb-4" style={{ color: MUTED }}>
                <span dir="ltr" className="tabular-nums" style={{ fontFamily: MONO }}>{track.rate}%</span> בשנה
              </p>

              <p
                className="tabular-nums mb-1.5"
                dir="ltr"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  color: isBest ? TURQ : NAVY,
                  fontSize: "clamp(1.4rem, 2vw, 1.7rem)",
                  lineHeight: 1.15,
                }}
              >
                <AnimatedNumber value={track.finalValue} format={formatCurrency} />
              </p>

              <p className="text-[13px] font-medium tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: TURQ_TEXT }}>
                +<AnimatedNumber value={track.profit} format={formatCurrency} />
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparison Summary */}
      <div className="dna-concept !p-6">
        <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
          סיכום השוואה
        </h3>

        {/* Kit CSS bar chart: track #EEF3F6, fill turquoise, values mono LTR */}
        <div className="space-y-3">
          {results.map((track) => {
            const barWidth = maxProfit > 0 ? Math.max(0, (track.profit / maxProfit) * 100) : 0;
            const negative = track.profit < 0;

            return (
              <div key={track.name} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-sm font-medium" style={{ color: NAVY }}>
                  {track.name}
                </span>
                <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ backgroundColor: "#EEF3F6" }} dir="rtl">
                  <div
                    className="h-full rounded-md transition-all duration-200 ease-out"
                    style={{
                      width: `${negative ? Math.min(100, Math.abs(barWidth)) : barWidth}%`,
                      backgroundColor: negative ? "#d67a8a" : TURQ,
                    }}
                  />
                </div>
                <span
                  className="w-28 shrink-0 text-left text-[13px] font-medium tabular-nums"
                  dir="ltr"
                  style={{ fontFamily: MONO, color: negative ? "#a04a5c" : NAVY }}
                >
                  {formatCurrency(track.profit)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Difference Summary */}
        <div className="dna-callout mt-6 text-sm">
          <p className="font-medium mb-2" style={{ color: NAVY }}>
            ההפרש בין מסלול מניות למסלול אג"ח לאורך {years} שנים:
          </p>
          <p
            className="tabular-nums"
            dir="ltr"
            style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(1.6rem, 2.4vw, 2rem)", lineHeight: 1.15 }}
          >
            <AnimatedNumber value={maxProfit - minProfit} format={formatCurrency} />
          </p>
        </div>

        {/* Personalized Tips */}
        <div className="mt-4 space-y-3">
          {years >= 10 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>אופק ארוך מצוין:</strong> עם {years} שנות השקעה, מסלול מניות יכול להניב תשואה גבוהה משמעותית
              למרות התנודתיות הקצרת טווח.
            </div>
          )}

          {years <= 3 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>טווח קצר:</strong> עם {years} שנים בלבד, מסלול אג"ח או כללי עשוי להיות בטוח יותר
              ולהגן על ההשקעה שלכם מתנודות שוק.
            </div>
          )}

          {investmentAmount >= 500000 && (
            <div className="dna-callout text-sm">
              <strong style={{ color: NAVY }}>סכום משמעותי:</strong> עם השקעה של {formatCurrency(investmentAmount)},
              שקלו לפזר בין מספר מסלולים כדי להקטין סיכון.
            </div>
          )}

          <div className="dna-quote gold">
            <div className="dna-ql">שימו לב</div>
            <div className="dna-qt">
              התשואות מבוססות על ממוצע 5 שנים אחרונות ואינן מבטיחות תשואה עתידית.
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <SaveCalculationButton
              calculatorType="compare"
              inputData={{ investmentAmount, years }}
              resultData={{
                results: results.map(r => ({ name: r.name, finalValue: r.finalValue, profit: r.profit })),
                maxProfit,
                minProfit,
              }}
              tips={[
                `הפרש בין מניות לאג"ח: ${formatCurrency(maxProfit - minProfit)}`,
                years >= 10 ? `אופק ארוך - מסלול מניות מומלץ` : undefined,
              ].filter(Boolean) as string[]}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="dna-quote gold">
        <div className="dna-ql">הבהרה</div>
        <div className="dna-qt">
          התשואות מבוססות על נתוני עבר ואינן מבטיחות תשואה עתידית. החישוב לצורכי הדגמה בלבד.
        </div>
      </div>
    </div>
  );
};

export default CompareCalculator;
