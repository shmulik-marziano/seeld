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
import { LiveDot } from "@/components/brand/Live";
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline separators.

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-sm sm:text-base font-medium text-[#5a6a78] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        <div className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 220, height: 220, top: 380, right: -110, backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 240, height: 240, bottom: -130, left: "30%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>

          <div className="relative z-10">
            {/* Hero */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-14">
              <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
                <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
                <span aria-hidden="true">←</span>
                <span className="font-medium text-[#1D2D3D]">מחשבונים</span>
              </nav>

              <h1
                className="dna-display leading-[1.15] mb-5 max-w-3xl"
                style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)" }}
              >
                מחשבונים פיננסיים
              </h1>
              <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
                משכנתא, פנסיה, חיסכון, מס, ביטוח והשוואת מסלולים. חופשי, ללא רישום.
              </p>
            </section>

            {/* Standalone mono ticker band — hairlines top and bottom */}
            <section className="border-t border-b" style={{ borderColor: LINE }}>
              <div
                className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4"
                dir="ltr"
              >
                <span
                  className="inline-flex items-center gap-3 text-[12px] sm:text-[13px] font-semibold tracking-[0.24em] whitespace-nowrap tabular-nums"
                  style={{ fontFamily: MONO, color: NAVY }}
                >
                  <LiveDot size={7} />
                  NO SIGNUP · FREE
                </span>
                <span
                  className="hidden sm:inline-flex text-[11px] font-semibold tracking-[0.24em] whitespace-nowrap tabular-nums"
                  style={{ fontFamily: MONO, color: MUTED }}
                >
                  8 TOOLS · ILS
                </span>
              </div>
            </section>

            {/* Calculator tabs */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <Tabs defaultValue="mortgage" dir="rtl">
                <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto scrollbar-hide">
                  {tabDefs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabDefs.map(({ value, title, lede, Component }) => (
                  <TabsContent key={value} value={value} className="mt-0">
                    <div className="text-right">
                      <div className="mb-8">
                        <h2
                          className="dna-display leading-tight mb-2"
                          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                        >
                          {title}
                        </h2>
                        <p className="text-[14.5px] leading-[1.85]" style={{ color: MUTED }}>{lede}</p>
                      </div>
                      <Component />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>
        </div>

        {/* Closing CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2
              className="text-white leading-tight mb-3"
              style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
            >
              צריכים עזרה בתכנון?
            </h2>
            <p className="text-base leading-[1.85] mb-8 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              המחשבונים הם נקודת התחלה. לתכנון פיננסי מקיף, דברו עם המומחים שלנו.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
            >
              קביעת פגישת ייעוץ
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
