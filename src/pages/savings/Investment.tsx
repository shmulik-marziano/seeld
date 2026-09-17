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

  const benefits = [
    { title: "התאמה אישית", desc: "תיק השקעות מותאם לפרופיל שלכם" },
    { title: "ניהול מקצועי", desc: "צוות מנהלי השקעות מנוסים" },
    { title: "פיזור סיכונים", desc: "אסטרטגיה חכמה להקטנת סיכון" },
    { title: "מגוון אפיקים", desc: "גישה למניות, אג\"ח, נדל\"ן ועוד" },
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
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו מציעים ייעוץ השקעות מקצועי שמתבסס על ניתוח מעמיק של המצב הכלכלי והיעדים שלכם. נבנה תיק מותאם אישית, נלווה אתכם לאורך הדרך, ונוודא שההשקעות שלכם תמיד מנוהלות בצורה אופטימלית.";

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
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">השקעות</span>
          </nav>

          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                השקעות
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                פתרונות השקעה מותאמים אישית לבניית תיק השקעות אופטימלי המתאים לפרופיל הסיכון והיעדים שלכם.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a href="#analysis-form" className="btn-primary sm:min-w-[220px]">
                  ייעוץ השקעות חינם
                </a>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a href="#product-types" className="link-rule text-[15px]">
                  פתרונות השקעה
                  <BrandIcon name="arrow-left" size={18} />
                </a>
                <button type="button" className="link-rule text-[15px]" onClick={openChat}>
                  <BrandIcon name="message" size={18} />
                  שאלו את היועץ הדיגיטלי
                </button>
              </div>
            </div>

            <Illustration name="03-saving-growth" priority sizes="(min-width: 1024px) 560px, 100vw" className="brand-hero-art" />
          </div>
        </div>
      </section>

      <main>
        {/* BENEFITS */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <BrandDots className="mb-4" />
            <h2 className="dna-display leading-tight mb-10" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              פתרונות ההשקעה שלנו
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
              {benefits.map((item) => (
                <div key={item.title} className="border-t pt-5" style={{ borderColor: LINE }}>
                  <h3 className="text-[19px] mb-2" style={{ color: GREEN }}>{item.title}</h3>
                  <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}><FigureText text={item.desc} /></p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE KNOWLEDGE — one tabbed section */}
        <section id="product-types" className="border-t scroll-mt-24" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b rounded-none overflow-x-auto scrollbar-hide" style={{ borderColor: LINE }}>
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

              {/* — Solutions — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי פתרונות השקעה</SectionTitle>
                  <p className="mt-2 text-[17px] leading-relaxed max-w-xl" style={{ color: MUTED }}>
                    בחרו את הפתרון המתאים ליעדים הכלכליים שלכם
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {productTypes.map((type) => (
                    <div key={type.title} className="dna-concept">
                      <h3 className="text-[18px] mb-2" style={{ color: GREEN }}>{type.title}</h3>
                      <p className="text-[15px] leading-[1.7] mb-3" style={{ color: BODY }}><FigureText text={type.description} /></p>
                      <ul>
                        {type.features.map((feature, fIdx) => (
                          <li key={fIdx} className="dna-pill-item !py-1.5 text-[15px]">
                            <span><FigureText text={feature} /></span>
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
                        <AccordionTrigger className="text-start text-[17px] font-bold hover:no-underline py-5 px-3 -mx-3 rounded-lg hover:bg-white transition-colors duration-150" style={{ color: GREEN }}>
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
                רוצים ייעוץ השקעות מקצועי?
              </h2>
              <p className="text-[17px] leading-[1.7] max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת. אפשר גם להתחיל בבדיקת תיק 360 מלאה.
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="investment"
                title="ייעוץ השקעות אישי"
                description="ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת"
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

export default Investment;
