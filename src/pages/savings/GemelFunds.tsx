import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN } from "@/lib/brand";

// Brand service page (kit p.05): the saving-and-growth art beside the headline
// and the action; the analysis form stays central in the closing green band.

// Figures inside Hebrew copy (sums, percentages, ranges) render tabular and LTR-safe.
const FIGURE_RE = /(?:₪\s?)?\d(?:[\d,.:/\-–]*\d)?(?:\s?[%₪])?/g;

const FigureText = ({ text }: { text: string }) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE_RE)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    nodes.push(
      <span key={i} dir="ltr" className="tabular-nums whitespace-nowrap">
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last === 0) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
};

const tabTriggerClass =
  "rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-[16px] font-bold text-[#476356] hover:text-[#003D30] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
    {children}
  </h2>
);

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const GemelFunds = () => {
  const benefits = [
    {
      title: "ניהול מקצועי",
      description: "ניהול השקעות על ידי גופים מובילים בשוק ההון",
      items: ["מנהלי השקעות מנוסים", "פיזור סיכונים"],
    },
    {
      title: "גמישות מלאה",
      description: "בחירה בין משיכה הונית לקצבה",
      items: ["סכום חד פעמי", "קצבה חודשית"],
    },
    {
      title: "הטבות מס",
      description: "חיסכון משמעותי במס",
      items: ["זיכוי מס על הפקדות", "פטור ממס רווחי הון"],
    },
  ];

  const articles = [
    {
      title: "למה קופת גמל חשובה?",
      paragraphs: [
        "קופת גמל היא מכשיר חיסכון ייחודי המשלב גמישות מקסימלית עם הטבות מס משמעותיות. בניגוד לקרן פנסיה, קופת גמל מאפשרת לכם לבחור בפרישה בין משיכת הכסף כסכום חד פעמי (משיכה הונית) לבין קבלת קצבה חודשית - גמישות שלא קיימת במוצרים פנסיוניים אחרים.",
        "קופת גמל להשקעה, שהושקה בשנת 2016, היא מוצר חיסכון מעולה גם לטווח בינוני. היא מאפשרת הפקדות ללא תקרה, ניהול מקצועי של ההשקעות, ופטור ממס רווחי הון בעת משיכה כקצבה. זהו מכשיר חיסכון שכל משק בית צריך לשקול.",
      ],
    },
    {
      title: "מתי כדאי לפתוח קופת גמל?",
      paragraphs: [
        "קופת גמל מתאימה בכל שלב בחיים. עצמאים יכולים להפקיד לקופת גמל וליהנות מהטבות מס משמעותיות. שכירים יכולים להפקיד מעבר להפקדות החובה של המעסיק כדי להגדיל את החיסכון. גם הורים יכולים לפתוח קופת גמל להשקעה עבור הילדים כחיסכון לטווח ארוך.",
        "מומלץ לבצע ניתוח תקופתי של קופות הגמל הקיימות שלכם, לבדוק את דמי הניהול ואת ביצועי ההשקעות, ולוודא שהכסף שלכם מנוהל בצורה אופטימלית.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "ישנם מספר סוגי קופות גמל: קופת גמל לחיסכון (המשך הקופות הישנות), קופת גמל להשקעה (מוצר חדש וגמיש), וקופת גמל לתגמולים. לכל סוג תנאים שונים בנוגע למשיכה, מיסוי והטבות. חשוב לבחור את המוצר הנכון בהתאם למטרת החיסכון ולאופק ההשקעה.",
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו מנתחים את כל קופות הגמל שלכם, בודקים דמי ניהול, תשואות ומסלולי השקעה, ומוודאים שכל שקל עובד בשבילכם. הייעוץ ללא עלות, וללא תלות באף חברה.";

  const faqItems = [
    {
      q: "מה ההבדל בין קופת גמל לקרן פנסיה?",
      a: "קרן פנסיה כוללת כיסויים ביטוחיים (נכות ושאירים) ומחייבת קבלת קצבה חודשית. קופת גמל היא מוצר חיסכון טהור עם גמישות רבה יותר, כולל אפשרות למשיכה הונית. לרוב מומלץ שילוב של שניהם.",
    },
    {
      q: "מתי אפשר למשוך כסף מקופת גמל?",
      a: "קופת גמל לחיסכון ניתנת למשיכה בגיל 60. קופת גמל להשקעה ניתנת למשיכה בכל עת (לאחר 6 שנים מההפקדה הראשונה עם פטור ממס רווחי הון, או לפני כן עם תשלום מס).",
    },
    {
      q: "האם כדאי להעביר קופת גמל ישנה?",
      a: "במקרים רבים כן. קופות גמל ישנות עשויות לגבות דמי ניהול גבוהים ולהשקיע במסלולים שאינם אופטימליים. העברת קופת גמל היא תהליך פשוט וללא עלות, וניתוח מקצועי יחשוף האם כדאי לבצע מהלך כזה.",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      {/* HERO — the subject art beside the headline */}
      <section className="dna-page overflow-hidden">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 320, height: 320, top: -150, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 180, height: 180, bottom: -80, left: "36%", backgroundColor: PASTEL_SAND, opacity: 0.7 }}
          />
        </div>
        <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
          <nav className="mb-8 sm:mb-12 flex items-center gap-2 text-[14px]" style={{ color: MUTED }} aria-label="ניווט משני">
            <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
            <BrandIcon name="arrow-left" size={14} />
            <Link to="/savings" className="hover:underline underline-offset-4">חיסכון ופנסיה</Link>
            <BrandIcon name="arrow-left" size={14} />
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">קופות גמל</span>
          </nav>

          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                קופות גמל
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a href="#analysis-form" className="btn-primary sm:min-w-[220px]">
                  ניתוח קופות גמל חינם
                </a>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <button type="button" className="mt-6 link-rule text-[15px]" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>

            <Illustration name="03-saving-growth" priority sizes="(min-width: 1024px) 560px, 100vw" className="brand-hero-art" />
          </div>
        </div>
      </section>

      <main>
        {/* THE KNOWLEDGE — one tabbed section */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b rounded-none overflow-x-auto scrollbar-hide" style={{ borderColor: LINE }}>
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  היתרונות
                </TabsTrigger>
                <TabsTrigger value="faq" className={tabTriggerClass}>
                  שאלות נפוצות
                </TabsTrigger>
              </TabsList>

              {/* — Guide — */}
              <TabsContent value="guide" className="mt-0">
                <div className="max-w-3xl">
                  {articles.map((article, idx) => (
                    <div key={idx} className={idx > 0 ? "mt-14" : ""}>
                      <div className="mb-6">
                        <SectionTitle>{article.title}</SectionTitle>
                      </div>
                      <div className="space-y-4 leading-[1.8] text-[17px]" style={{ color: BODY }}>
                        {article.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}><FigureText text={p} /></p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="dna-quote mt-12">
                    <div className="dna-ql">בשורה התחתונה</div>
                    <div className="dna-qt"><FigureText text={bottomLine} /></div>
                  </div>
                </div>
              </TabsContent>

              {/* — Benefits — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>יתרונות קופת גמל</SectionTitle>
                  <p className="mt-2 text-[17px] leading-relaxed max-w-xl" style={{ color: MUTED }}>
                    חיסכון חכם עם גמישות מקסימלית והטבות מס
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="dna-concept">
                      <h3 className="text-[18px] mb-2" style={{ color: GREEN }}>{benefit.title}</h3>
                      <p className="text-[15px] leading-[1.7] mb-3" style={{ color: BODY }}><FigureText text={benefit.description} /></p>
                      <ul>
                        {benefit.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="dna-pill-item !py-1.5 text-[15px]">
                            <span><FigureText text={item} /></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* — FAQ — */}
              <TabsContent value="faq" className="mt-0">
                <div className="max-w-3xl">
                  <Accordion type="multiple">
                    {faqItems.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`faq-${idx}`}
                        className="border-b rounded-none px-0"
                        style={{ borderColor: LINE }}
                      >
                        <AccordionTrigger className="text-start text-[17px] font-bold hover:no-underline py-5 px-3 -mx-3 rounded-lg hover:bg-[#EEF2EC] transition-colors duration-150" style={{ color: GREEN }}>
                          <FigureText text={item.q} />
                        </AccordionTrigger>
                        <AccordionContent className="leading-[1.75] pb-6 text-[16px]" style={{ color: BODY }}>
                          <FigureText text={item.a} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* COMPANIES */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* ANALYSIS FORM — deep green band, the central path */}
        <section id="analysis-form" className="scroll-mt-24 dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-10">
              <BrandDots className="mb-4" />
              <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                רוצים ניתוח קופות גמל חינמי?
              </h2>
              <p className="text-[17px] leading-[1.7] max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור. אפשר גם להתחיל בבדיקת תיק 360 מלאה.
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ניתוח קופות גמל"
                description="הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור"
              />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
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

export default GemelFunds;
