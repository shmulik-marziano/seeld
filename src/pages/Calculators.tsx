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
import { SERIF, MONO } from "@/lib/brand";

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-sm sm:text-base font-medium text-[#5c5c5c] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const tabHeadClass = "border-t border-[#171717]/20 pt-5 mb-8 text-right";

const Calculators = () => {
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero tile */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-14 relative z-10">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">מחשבונים</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium text-[#5c5c5c]">
              כלים פיננסיים
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            מחשבונים פיננסיים
          </h1>
          <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9]">
            משכנתא, פנסיה, חיסכון, מס, ביטוח והשוואת מסלולים. חופשי, ללא רישום.
          </p>
        </div></div>
      </section>

      <main>
        {/* Slim mono ticker tile (the play) */}
        <section className="px-2 pt-2">
          <div className="bento-panel flex items-center justify-between gap-4 px-5 py-4" dir="ltr">
            <span
              className="relative z-10 text-[13px] sm:text-[15px] font-semibold tracking-[0.28em] text-[#171717] inline-flex items-center gap-3 whitespace-nowrap tabular-nums"
              style={{ fontFamily: MONO }}
            >
              <LiveDot size={7} />
              NO SIGNUP · FREE
            </span>
            <span
              className="relative z-10 hidden sm:inline-flex text-[11px] font-semibold tracking-[0.28em] text-[#171717]/70 whitespace-nowrap tabular-nums"
              style={{ fontFamily: MONO }}
            >
              08 TOOLS · ILS
            </span>
          </div>
        </section>

        {/* Calculator tabs — one paper tile, each tab panel inside it */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <Tabs defaultValue="mortgage" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="mortgage" className={tabTriggerClass}>
                  משכנתא
                </TabsTrigger>
                <TabsTrigger value="pension" className={tabTriggerClass}>
                  פנסיה
                </TabsTrigger>
                <TabsTrigger value="savings" className={tabTriggerClass}>
                  חיסכון
                </TabsTrigger>
                <TabsTrigger value="goal" className={tabTriggerClass}>
                  יעד
                </TabsTrigger>
                <TabsTrigger value="compare" className={tabTriggerClass}>
                  השוואה
                </TabsTrigger>
                <TabsTrigger value="income-tax" className={tabTriggerClass}>
                  מס הכנסה
                </TabsTrigger>
                <TabsTrigger value="life-insurance" className={tabTriggerClass}>
                  ביטוח חיים
                </TabsTrigger>
                <TabsTrigger value="car-insurance" className={tabTriggerClass}>
                  ביטוח רכב
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mortgage" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון משכנתא
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">חשבו החזר חודשי ועלות כוללת של המשכנתא</p>
                  </div>
                  <MortgageCalculator />
                </div>
              </TabsContent>

              <TabsContent value="pension" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון פנסיה
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות</p>
                  </div>
                  <PensionCalculator />
                </div>
              </TabsContent>

              <TabsContent value="savings" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון חיסכון
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">חשבו כמה תצברו עם ריבית דריבית</p>
                  </div>
                  <SavingsCalculator />
                </div>
              </TabsContent>

              <TabsContent value="goal" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון יעד כלכלי
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?</p>
                  </div>
                  <GoalCalculator />
                </div>
              </TabsContent>

              <TabsContent value="compare" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      השוואת מסלולי השקעה
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">ראו איך הכסף שלכם גדל בכל מסלול</p>
                  </div>
                  <CompareCalculator />
                </div>
              </TabsContent>

              <TabsContent value="income-tax" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון מס הכנסה
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">חשבו את מס ההכנסה החודשי והשנתי לפי מדרגות 2026</p>
                  </div>
                  <IncomeTaxCalculator />
                </div>
              </TabsContent>

              <TabsContent value="life-insurance" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון ביטוח חיים
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">כמה כיסוי ביטוחי המשפחה שלכם באמת צריכה?</p>
                  </div>
                  <LifeInsuranceCalculator />
                </div>
              </TabsContent>

              <TabsContent value="car-insurance" className="mt-0">
                <div className="text-right">
                  <div className={tabHeadClass}>
                    <h2
                      className="text-[#171717] leading-tight mb-2"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                    >
                      מחשבון ביטוח רכב
                    </h2>
                    <p className="text-[#4d4d4d] text-[14px] leading-[1.85]">הערכת טווח פרמיה שנתי לפי הפרופיל שלכם</p>
                  </div>
                  <CarInsuranceEstimator />
                </div>
              </TabsContent>
            </Tabs>
          </div></div>
        </section>

        {/* CTA — closing ink tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                צריכים עזרה בתכנון?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                המחשבונים הם נקודת התחלה. לתכנון פיננסי מקיף, דברו עם המומחים שלנו.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                קביעת פגישת ייעוץ
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
