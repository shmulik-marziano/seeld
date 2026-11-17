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
import { stories } from "@/data/stories";
import { SdBand, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubClose, PubHero } from "@/components/sd/pub";
import { LINE } from "@/lib/brand";
import "@/components/sd/sd.css";

// Calculators in the kit design: the tool stays central (tabs + the unchanged calculators inside a white panel);
// hero, story and closing carry the kit look. Calculator logic and components are untouched.

const tabTriggerClass =
  "rounded-none bg-transparent min-w-[44px] min-h-[44px] justify-center px-0 pb-4 text-[15px] sm:text-[16px] font-bold text-[#55677C] border-b-2 border-transparent data-[state=active]:border-[#203957] data-[state=active]:text-[#203957] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

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
  useSdFont();
  const topic = PUB_TOPICS.calculators;
  const [p1, p2] = topic.palette;
  const story = stories["/calculators"];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          compact
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "מחשבונים" }]}
          eyebrow="משכנתא, פנסיה, חיסכון ומס"
          title="מחשבונים פיננסיים"
          lead="משכנתא, פנסיה, חיסכון, מס, ביטוח והשוואת מסלולים. חופשי, ללא רישום. התוצאות הן הערכה לפי ההנחות שבכל מחשבון, לא תחליף לבדיקה של התיק."
          art={topic.art}
          tint={p1}
        />

        <SdBand tone="cream" id="tools" className="!pt-8 sm:!pt-12">
          <div className="sd-wrap">
            <div className="sd-pub-panel">
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
                        <h2 className="sd-h2 mb-1.5" style={{ fontSize: "clamp(24px, 3vw, 32px)" }}>
                          {title}
                        </h2>
                        <p className="text-[16px] leading-[1.7]" style={{ color: "var(--muted)" }}>{lede}</p>
                      </div>
                      <Component />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </SdBand>

        {story && (
          <SdBand tone={p2} id="moment">
            <SdStory story={story} art={topic.art2} flip />
          </SdBand>
        )}

        <PubClose
          title="המחשבון נותן הערכה. התיק נותן תשובה."
          text="רוצים לראות את המספרים האמיתיים שלכם? בדיקת תיק 360 מסדרת את הביטוחים, הפנסיה והחיסכון בתמונה אחת."
          art="05-retirement"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
