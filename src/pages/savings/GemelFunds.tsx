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
import { BONE, PINE, BRONZE, SERIF, MONO } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

const tabTriggerClass =
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#6e6e6e] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

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
        "ב-SEELD אנחנו מנתחים את כל קופות הגמל שלכם, בודקים דמי ניהול, תשואות ומסלולי השקעה, ומוודאים שכל שקל עובד בשבילכם. הייעוץ ללא עלות, וללא תלות באף חברה.",
      ],
    },
  ];

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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#6e6e6e]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">קופות גמל</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            גמישות מקסימלית בחיסכון שלכם
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ניתוח קופות גמל חינם
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קופות גמל? היועץ מחובר</StatusPill>
          </button>
        </div>
      </section>

      <main>
        {/* ══════ THE KNOWLEDGE — one tabbed section ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
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
                    <div key={idx} className={idx > 0 ? 'mt-14' : ''}>
                      <div className="border-t border-[#171717]/15 pt-5 mb-6">
                        <SectionTitle>{article.title}</SectionTitle>
                      </div>
                      <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base">
                        {article.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* — Benefits — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>יתרונות קופת גמל</SectionTitle>
                  <p className="text-[#6e6e6e] mt-2 text-base leading-relaxed max-w-xl">
                    חיסכון חכם עם גמישות מקסימלית והטבות מס
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="border-t border-[#171717]/10 pt-4">
                      <span
                        className="text-[11px] tabular-nums tracking-[0.2em] block mb-4"
                        dir="ltr"
                        style={{ color: BRONZE, fontFamily: MONO }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {benefit.title}
                      </h3>
                      <p className="text-[#5c5c5c] text-[14px] leading-[1.8] mb-3.5">{benefit.description}</p>
                      <ul className="space-y-2">
                        {benefit.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-[#5c5c5c] text-[14px] leading-relaxed flex gap-2.5">
                            <span style={{ color: BRONZE }}>—</span>
                            {item}
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
                        className="border-b border-[#171717]/10 rounded-none px-0"
                      >
                        <AccordionTrigger className="text-start text-base font-medium text-[#171717] hover:no-underline py-5">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[#5c5c5c] leading-[1.85] pb-6 text-[14px]">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ══════ COMPANIES ══════ */}
        <CompanyLogos variant="grid" />

        {/* ══════ ANALYSIS FORM ══════ */}
        <section id="analysis-form" className="scroll-mt-24" style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5 mb-10 text-center sm:text-right">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים ניתוח קופות גמל חינמי?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ניתוח קופות גמל"
                description="הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GemelFunds;
