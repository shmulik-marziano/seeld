import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MortgageCalculator from "@/components/MortgageCalculator";
import PensionCalculator from "@/components/PensionCalculator";
import SavingsCalculator from "@/components/SavingsCalculator";
import GoalCalculator from "@/components/GoalCalculator";
import CompareCalculator from "@/components/CompareCalculator";
import IncomeTaxCalculator from "@/components/IncomeTaxCalculator";
import LifeInsuranceCalculator from "@/components/LifeInsuranceCalculator";
import CarInsuranceEstimator from "@/components/CarInsuranceEstimator";
import { Link } from "react-router-dom";
import { BalancedStones } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, SAGE_ON_GREEN } from "@/lib/brand";

// Calculator page: inputs and results stay central. One small vector element in
// the hero corner, no full illustration (kit p.06: operational screens stay clean).

const tabTriggerClass =
  "rounded-none bg-transparent min-w-[44px] justify-center px-0 pb-4 text-[15px] sm:text-[16px] font-bold text-[#476356] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const tabDefs = [
  { value: "mortgage", label: "משכנתא", title: "מחשבון משכנתא", lede: "חשבו החזר חודשי ועלות כוללת של המשכנתא", Component: MortgageCalculator },
  { value: "pension", label: "פנסיה", title: "מחשבון פנסיה", lede: "חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות", Component: PensionCalculator },
  { value: "savings", label: "חיסכון", title: "מחשבון חיסכון", lede: "חשבו כמה תצברו עם ריבית דריבית", Component: SavingsCalculator },
  { value: "goal", label: "יעד", title: "מחשבון יעד כלכלי", lede: "כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?", Component: GoalCalculator },
  { value: "compare", label: "השוואה", title: "השוואת מסלולי השקעה", lede: "ראו איך הכסף שלכם גדל בכל מסלול", Component: CompareCalculator },
  { value: "income-tax", label: "מס הכנסה", title: "מחשבון מס הכנסה", lede: "חשבו את מס ההכנסה החודשי והשנתי לפי מדרגות 2026", Component: IncomeTaxCalculator },
  { value: "life-insurance", label: "ביטוח חיים", title: "מחשבון ביטוח חיים", lede: "כמה כיסוי ביטוחי המשפחה שלכם באמת צריכה?", Component: LifeInsuranceCalculator },
  { value: "car-insurance", label: "ביטוח רכב", title: "מחשבון ביטוח רכב", lede: "הערכת טווח פרמיה שנתי לפי הפרופיל שלכם", Component: CarInsuranceEstimator },
];

const Calculators = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        <div className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10">
            {/* Hero */}
            <section className="max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-10">
              <nav className="flex items-center gap-2 text-[14px] mb-8" style={{ color: MUTED }} aria-label="ניווט משני">
                <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
                <BrandIcon name="arrow-left" size={14} />
                <span className="font-bold" style={{ color: GREEN }} aria-current="page">מחשבונים</span>
              </nav>

              <div className="flex items-start justify-between gap-8">
                <div>
                  <h1 className="dna-display leading-[1.15] mb-4 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                    מחשבונים פיננסיים
                  </h1>
                  <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                    משכנתא, פנסיה, חיסכון, מס, ביטוח והשוואת מסלולים. חופשי, ללא רישום.
                    התוצאות הן הערכה לפי ההנחות שבכל מחשבון, לא תחליף לבדיקה של התיק.
                  </p>
                </div>
                <BalancedStones className="hidden lg:block w-40 shrink-0" />
              </div>
            </section>

            {/* Calculator tabs */}
            <section className="max-w-brand mx-auto px-5 sm:px-8 pb-12 sm:pb-16">
              <Tabs defaultValue="mortgage" dir="rtl">
                <TabsList className="flex w-full flex-wrap justify-start gap-x-6 gap-y-1 sm:gap-x-8 h-auto bg-transparent p-0 mb-8 border-b rounded-none" style={{ borderColor: LINE }}>
                  {tabDefs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabDefs.map(({ value, title, lede, Component }) => (
                  <TabsContent key={value} value={value} className="mt-0">
                    <div className="text-right">
                      <div className="mb-6">
                        <h2 className="dna-display leading-tight mb-1.5" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
                          {title}
                        </h2>
                        <p className="text-[16px] leading-[1.7]" style={{ color: MUTED }}>{lede}</p>
                      </div>
                      <Component />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>
        </div>

        {/* Closing — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3vw, 34px)" }}>
              המחשבון נותן הערכה. התיק נותן תשובה.
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              רוצים לראות את המספרים האמיתיים שלכם? בדיקת תיק 360 מסדרת את הביטוחים, הפנסיה והחיסכון בתמונה אחת.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                בדיקת תיק 360
              </Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                תיאום פגישה
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
