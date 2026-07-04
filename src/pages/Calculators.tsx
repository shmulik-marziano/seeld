import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MortgageCalculator from "@/components/MortgageCalculator";
import PensionCalculator from "@/components/PensionCalculator";
import SavingsCalculator from "@/components/SavingsCalculator";
import GoalCalculator from "@/components/GoalCalculator";
import CompareCalculator from "@/components/CompareCalculator";
import { Link } from "react-router-dom";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-sm sm:text-base font-medium text-[#171717]/40 border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const tabHeadClass = "border-t border-[#171717]/20 pt-5 mb-8 text-right";

const Calculators = () => {
  const comingSoon = [
    {
      title: "מחשבון ביטוח חיים",
      description: "כמה כיסוי ביטוחי אתם באמת צריכים?",
    },
    {
      title: "מחשבון ביטוח רכב",
      description: "השוו מחירי ביטוח רכב בהתאם לפרופיל שלכם",
    },
    {
      title: "מחשבון מס הכנסה",
      description: "חשבו את גובה המס והחזרים אפשריים",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">מחשבונים</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              כלים פיננסיים
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            מחשבונים פיננסיים
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9]">
            כלים חכמים לתכנון פיננסי. חשבו משכנתא, פנסיה, חיסכון ועוד בקלות.
          </p>
        </div>
      </section>

      <main>
        {/* Calculator Tabs */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
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
                    <p className="text-[#171717]/55 text-[14px] leading-[1.85]">חשבו החזר חודשי ועלות כוללת של המשכנתא</p>
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
                    <p className="text-[#171717]/55 text-[14px] leading-[1.85]">חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות</p>
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
                    <p className="text-[#171717]/55 text-[14px] leading-[1.85]">חשבו כמה תצברו עם ריבית דריבית</p>
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
                    <p className="text-[#171717]/55 text-[14px] leading-[1.85]">כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?</p>
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
                    <p className="text-[#171717]/55 text-[14px] leading-[1.85]">ראו איך הכסף שלכם גדל בכל מסלול</p>
                  </div>
                  <CompareCalculator />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Coming Soon */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                בקרוב
              </div>
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                מחשבונים נוספים בקרוב
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-x-16">
              {comingSoon.map((calc) => (
                <div
                  key={calc.title}
                  className="flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-[#171717] mb-1">{calc.title}</h3>
                    <p className="text-[13px] text-[#171717]/40 leading-relaxed">{calc.description}</p>
                  </div>
                  <span className="text-[11px] tracking-[0.22em] font-medium shrink-0" style={{ color: BRONZE }}>
                    בקרוב
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
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
                לשיחת ייעוץ
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
