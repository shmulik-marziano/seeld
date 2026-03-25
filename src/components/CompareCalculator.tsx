import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart3, Calendar, Banknote, TrendingUp, AlertTriangle, Rocket, Scale, Baby, Star, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SaveCalculationButton from "@/components/SaveCalculationButton";

interface Track {
  name: string;
  rate: number;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface TrackResult {
  name: string;
  rate: number;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  finalValue: number;
  profit: number;
  color: string;
  bgColor: string;
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

const CompareCalculator = () => {
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [years, setYears] = useState(5);

  // Investment tracks with their average annual returns (based on 5-year averages)
  const tracks: Track[] = [
    { name: "מניות", rate: 12.25, emoji: "🚀", icon: Rocket, color: "text-secondary", bgColor: "bg-secondary/10" },
    { name: "כללי", rate: 8.21, emoji: "⚖️", icon: Scale, color: "text-primary", bgColor: "bg-primary/10" },
    { name: "לבני 50-", rate: 9.03, emoji: "👶", icon: Baby, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { name: "הלכתי", rate: 6.96, emoji: "✡️", icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { name: "אג\"ח", rate: 3.21, emoji: "🛡️", icon: Shield, color: "text-accent", bgColor: "bg-accent/10" },
  ];

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
      <div className="relative">
        <div className="absolute -top-3 right-4 bg-background px-3 py-1 rounded-full text-sm font-semibold text-secondary z-10 border border-secondary/20">
          כמה תרצה להשקיע?
        </div>
        <div className="relative">
          <Input
            type="text"
            value={investmentAmount.toLocaleString("he-IL")}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="text-center text-3xl md:text-4xl font-bold h-20 rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 focus:border-secondary"
            dir="ltr"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-semibold text-secondary">
            ₪
          </span>
        </div>
      </div>

      {/* Years Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Calendar className="w-4 h-4" />
            לכמה שנים?
          </Label>
          <span className="text-2xl font-bold text-secondary">{years} שנים</span>
        </div>
        <Slider
          value={[years]}
          onValueChange={([value]) => setYears(value)}
          min={1}
          max={20}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
          <span>שנה</span>
          <span>20 שנים</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {results.map((track, index) => {
          const Icon = track.icon;
          const isBest = track.profit === maxProfit;
          const isWorst = track.profit === minProfit;
          
          return (
            <Card 
              key={track.name}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${track.bgColor} border-2 ${
                isBest ? 'border-secondary ring-2 ring-secondary/30' : 'border-transparent'
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {isBest && (
                <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full font-medium">
                  הטוב ביותר
                </div>
              )}
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{track.emoji}</div>
                <h3 className="text-lg font-bold mb-1">{track.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{track.rate}% בשנה</p>
                
                <p className={`text-2xl md:text-3xl font-extrabold ${track.color} mb-2`}>
                  <AnimatedNumber value={track.finalValue} format={formatCurrency} />
                </p>
                
                <p className="text-sm text-accent font-medium">
                  +<AnimatedNumber value={track.profit} format={formatCurrency} /> רווח
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            סיכום השוואה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Bar Comparison */}
          <div className="space-y-3">
            {results.map((track) => {
              const barWidth = (track.profit / maxProfit) * 100;
              
              return (
                <div key={track.name} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium flex items-center gap-2">
                    <span>{track.emoji}</span>
                    {track.name}
                  </span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-primary to-secondary transition-all duration-700 flex items-center justify-end px-2"
                      style={{ width: `${Math.max(10, barWidth)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">
                        {formatCurrency(track.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Difference Summary */}
          <div className="mt-6 p-4 bg-muted rounded-xl text-sm">
            <p className="font-medium mb-2">
              ההפרש בין מסלול <strong>מניות</strong> ל<strong>אג"ח</strong> לאורך {years} שנים:
            </p>
            <p className="text-2xl font-bold text-secondary">
              <AnimatedNumber value={maxProfit - minProfit} format={formatCurrency} />
            </p>
          </div>

          {/* Personalized Tips */}
          <div className="mt-4 space-y-3">
            {years >= 10 && (
              <div className="p-4 bg-primary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🚀 <strong>אופק ארוך מצוין!</strong> עם {years} שנות השקעה, מסלול מניות יכול להניב תשואה גבוהה משמעותית 
                  למרות התנודתיות הקצרת טווח.
                </p>
              </div>
            )}
            
            {years <= 3 && (
              <div className="p-4 bg-secondary/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  🛡️ <strong>טווח קצר:</strong> עם {years} שנים בלבד, מסלול אג"ח או כללי עשוי להיות בטוח יותר 
                  ולהגן על ההשקעה שלכם מתנודות שוק.
                </p>
              </div>
            )}
            
            {investmentAmount >= 500000 && (
              <div className="p-4 bg-accent/10 rounded-xl text-sm text-muted-foreground">
                <p>
                  💰 <strong>סכום משמעותי:</strong> עם השקעה של {formatCurrency(investmentAmount)}, 
                  שקלו לפזר בין מספר מסלולים כדי להקטין סיכון.
                </p>
              </div>
            )}
            
            <div className="p-4 bg-accent/10 rounded-xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm mb-1">שים לב!</h4>
                <p className="text-sm text-muted-foreground">
                  התשואות מבוססות על ממוצע 5 שנים אחרונות ואינן מבטיחות תשואה עתידית.
                </p>
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
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground text-center">
        * התשואות מבוססות על נתוני עבר ואינן מבטיחות תשואה עתידית. החישוב לצורכי הדגמה בלבד.
      </div>
    </div>
  );
};

export default CompareCalculator;
