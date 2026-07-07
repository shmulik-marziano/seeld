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
import { SERIF, MONO } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { SproutFigure } from "@/components/brand/Figures";

const tabTriggerClass =
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5c5c5c] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

const Investment = () => {
  const productTypes = [
    {
      title: "התאמה אישית",
      description: "תיק השקעות מותאם לצרכים שלכם",
      features: ["פרופיל סיכון אישי", "יעדים ברורים", "אסטרטגיה מותאמת"],
    },
    {
      title: "ניהול מקצועי",
      description: "צוות מנהלי השקעות מנוסים",
      features: ["ניטור שוטף", "איזון תיק אוטומטי", "דוחות ביצועים"],
    },
    {
      title: "מגוון אפיקים",
      description: "גישה למגוון רחב של השקעות",
      features: ["מניות ואג\"ח", "נדל\"ן וסחורות", "קרנות מחקות"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "השקעה חכמה היא המפתח לבניית עושר ואיתנות פיננסית לטווח ארוך. הכסף שיושב בעו״ש מאבד מערכו בגלל האינפלציה, בעוד כסף שמושקע נכון יכול לצמוח ולהכפיל את עצמו לאורך השנים. ההבדל בין חוסך להון משמעותי הוא לרוב לא כמה מרוויחים, אלא כמה חכם משקיעים.",
        "ניהול השקעות מקצועי מבטיח שהכסף שלכם עובד בצורה אופטימלית, עם פיזור סיכונים חכם, התאמה לפרופיל הסיכון שלכם, ומעקב שוטף אחרי ביצועי התיק. לא צריך להיות מומחה בשוק ההון כדי ליהנות מתשואות טובות.",
      ],
    },
    {
      title: "מתי כדאי להתחיל?",
      paragraphs: [
        "הזמן הטוב ביותר להתחיל להשקיע הוא אתמול. הזמן השני הטוב ביותר הוא היום. ככל שמתחילים מוקדם יותר, כך אפקט הריבית דריבית עובד חזק יותר לטובתכם. גם סכומים קטנים שמושקעים באופן עקבי לאורך שנים הופכים להון משמעותי.",
        "ייעוץ השקעות רלוונטי בכל שלב: בתחילת הדרך כשרוצים לבנות תיק ראשון, כשיש סכום חד-פעמי להשקעה, כשמגיעים לנקודת מפנה כלכלית, או כשרוצים לבדוק שהתיק הקיים באמת עובד בצורה אופטימלית.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "ניהול השקעות מוצלח מתחיל בהבנת פרופיל הסיכון שלכם: מהו אופק ההשקעה? כמה תנודתיות אתם מוכנים לספוג? מהם היעדים הכלכליים שלכם? על בסיס התשובות נבנה תיק מגוון שכולל מניות, אג״ח, נדל״ן ואפיקים נוספים בהתאמה אישית.",
        "ב-SEELD אנחנו מציעים ייעוץ השקעות מקצועי שמתבסס על ניתוח מעמיק של המצב הכלכלי והיעדים שלכם. נבנה תיק מותאם אישית, נלווה אתכם לאורך הדרך, ונוודא שההשקעות שלכם תמיד מנוהלות בצורה אופטימלית.",
      ],
    },
  ];

  const faqItems = [
    {
      q: "כמה כסף צריך כדי להתחיל להשקיע?",
      a: "אין סכום מינימלי. אפשר להתחיל עם מאות שקלים בחודש בהוראת קבע. הדבר החשוב הוא להתחיל. גם סכומים קטנים שמושקעים באופן עקבי צוברים סכומים משמעותיים לאורך זמן.",
    },
    {
      q: "מה הסיכון בהשקעות?",
      a: "כל השקעה כרוכה בסיכון. ככל שפוטנציאל התשואה גבוה יותר, כך הסיכון גדול יותר. ניהול סיכונים נכון כולל פיזור השקעות, התאמה לאופק ההשקעה, ומעקב שוטף. לא שמים את כל הביצים בסל אחד.",
    },
    {
      q: "מה ההבדל בין ייעוץ השקעות לניהול תיקים?",
      a: "בייעוץ השקעות, המומחה מייעץ ואתם מקבלים החלטות. בניהול תיקים, מנהל ההשקעות מקבל החלטות עבורכם על פי מדיניות שהוגדרה מראש. שתי האפשרויות לגיטימיות, הבחירה תלויה בכמה אתם רוצים להיות מעורבים.",
    },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">חיסכון והשקעה</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: "#5c5c5c" }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            בנו את העתיד הפיננסי שלכם
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            פתרונות השקעה מותאמים אישית לבניית תיק השקעות אופטימלי המתאים לפרופיל הסיכון והיעדים שלכם.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ השקעות חינם
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              פתרונות השקעה
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על השקעות? היועץ מחובר</StatusPill>
          </button>
        </div>
        {/* Bento play: line figure peeking from the tile corner */}
        <SproutFigure className="absolute -left-3 -bottom-4 w-16 h-16 opacity-70 rotate-12 pointer-events-none" />
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>פתרונות ההשקעה שלנו</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "התאמה אישית", desc: "תיק השקעות מותאם לפרופיל שלכם" },
                { title: "ניהול מקצועי", desc: "צוות מנהלי השקעות מנוסים" },
                { title: "פיזור סיכונים", desc: "אסטרטגיה חכמה להקטנת סיכון" },
                { title: "מגוון אפיקים", desc: "גישה למניות, אג\"ח, נדל\"ן ועוד" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/15 pt-5">
                  <span
                    className="text-[11px] tabular-nums tracking-[0.2em] block mb-4"
                    dir="ltr"
                    style={{ color: "#5c5c5c", fontFamily: MONO }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div></div>
        </section>

        {/* ══════ THE KNOWLEDGE — one tabbed section ══════ */}
        <section id="product-types" className="px-2 pt-2 scroll-mt-24">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  פתרונות ההשקעה
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
                      <div className="space-y-4 text-[#4d4d4d] leading-[1.9] text-base">
                        {article.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* — Solutions — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי פתרונות השקעה</SectionTitle>
                  <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">
                    בחרו את הפתרון המתאים ליעדים הכלכליים שלכם
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="border-t border-[#171717]/10 pt-4">
                      <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {type.title}
                      </h3>
                      <p className="text-[#5c5c5c] text-[14px] leading-[1.8] mb-3.5">{type.description}</p>
                      <ul className="space-y-2">
                        {type.features.map((feature, fIdx) => (
                          <li key={fIdx} className="text-[#5c5c5c] text-[14px] leading-relaxed flex gap-2.5">
                            <span style={{ color: "#5c5c5c" }}>—</span>
                            {feature}
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
          </div></div>
        </section>

        {/* ══════ COMPANIES — own tile ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel">
            <CompanyLogos variant="grid" />
          </div>
        </section>

        {/* ══════ ANALYSIS FORM — ink tile ══════ */}
        <section id="analysis-form" className="px-2 pt-2 scroll-mt-24">
          <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5 mb-10 text-center sm:text-right">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים ייעוץ השקעות מקצועי?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="investment"
                title="ייעוץ השקעות אישי"
                description="ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת"
              />
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Investment;
