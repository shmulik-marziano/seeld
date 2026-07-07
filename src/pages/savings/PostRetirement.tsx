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
import { SERIF, MONO, CHIP_GREEN } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { DrawSpark } from "@/components/brand/Strokes";
import { FamilyFigure } from "@/components/brand/Figures";

const tabTriggerClass =
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5c5c5c] hover:text-[#171717] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

const PostRetirement = () => {
  const productTypes = [
    {
      title: "ניהול קצבה",
      description: "אופטימיזציה של הקצבה החודשית ותכנון תקציב",
      features: ["בדיקת קצבה", "תיאום מס", "מקסום הכנסה"],
    },
    {
      title: "זכויות פנסיונרים",
      description: "מיצוי זכויות והטבות המגיעות לפנסיונרים",
      features: ["קצבת זקנה", "גמלת סיעוד", "הנחות והטבות"],
    },
    {
      title: "הגנה על הון",
      description: "שמירה על ערך החסכונות והשקעה בטוחה",
      features: ["ניהול סיכונים", "השקעות שמרניות", "ביטוח מתאים"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "הפרישה היא לא הסוף, זו תחילת פרק חדש שיכול להימשך 20-30 שנה ויותר. ניהול נכון של הכספים לאחר הפרישה הוא קריטי: צריך לוודא שהקצבה החודשית מספיקה, שהחסכונות שומרים על ערכם, ושכל הזכויות וההטבות מנוצלות במלואן.",
        "רבים מגלים רק לאחר הפרישה שהם לא ממצים את הזכויות שלהם: החזרי מס, הנחות, קצבאות נוספות מביטוח לאומי, ותיאום מס על הקצבה. ייעוץ מקצועי יכול להוסיף אלפי שקלים בשנה להכנסה הפנויה שלכם.",
      ],
    },
    {
      title: "מתי כדאי לפנות?",
      paragraphs: [
        "ליווי פנסיוני לאחר פרישה רלוונטי מיד עם תחילת קבלת הקצבה. אם כבר פרשתם ולא ביצעתם בדיקה מקיפה, עכשיו זה הזמן. כל חודש שעובר בלי אופטימיזציה הוא כסף שנשאר על השולחן.",
        "מומלץ גם לבצע בדיקה תקופתית, לפחות אחת לשנה. תנאי המס משתנים, זכויות מתעדכנות, ויש הזדמנויות חדשות שכדאי לנצל. אנחנו ב-SEELD נוודא שאתם תמיד מקבלים את המקסימום.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "לאחר הפרישה, יש מספר נושאים קריטיים: תיאום מס על הקצבה (להבטיח שלא משלמים יותר מדי), מיצוי קצבאות ביטוח לאומי (קצבת זקנה, גמלת סיעוד), ניהול חסכונות והשקעות (התאמת רמת הסיכון לגיל), וביטוח רפואי וסיעודי מתאים.",
        "ב-SEELD אנחנו מציעים ליווי מקיף לפנסיונרים: נבדוק את הקצבה שלכם, נוודא שאתם ממצים כל זכות, נתאים את הביטוחים, ונבנה תוכנית כלכלית שמבטיחה איכות חיים גבוהה לאורך שנים.",
      ],
    },
  ];

  const faqItems = [
    {
      q: "האם אפשר לעבוד אחרי הפרישה?",
      a: "כן, אין מניעה לעבוד לאחר הפרישה ולקבל קצבת פנסיה במקביל. עם זאת, חשוב לבצע תיאום מס כדי להבטיח שלא משלמים מס עודף. ההכנסה מעבודה עשויה להשפיע גם על קצבת הזקנה מביטוח לאומי.",
    },
    {
      q: "מה קורה עם הפנסיה של בן/בת הזוג אם נפטרתי?",
      a: "בן/בת הזוג זכאי/ת לקצבת שאירים מקרן הפנסיה, בדרך כלל בגובה 60% מהקצבה המקורית. חשוב לוודא שהמוטבים מעודכנים ולבדוק אם יש זכויות נוספות מביטוחי חיים ומביטוח לאומי.",
    },
    {
      q: "איך אני יודע שאני מקבל את הקצבה הנכונה?",
      a: "בדיקה מקצועית של הקצבה כוללת אימות הנתונים, חישוב מחדש, ובדיקה שכל תקופות הוותק ופרמטרי החישוב נכונים. טעויות בחישוב הקצבה שכיחות למדי ויכולות לעלות הרבה כסף לאורך זמן.",
    },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">אחרי פרישה</span>
            </nav>
            <div className="hidden sm:flex items-center gap-4">
              <DrawSpark color={CHIP_GREEN} className="w-40" height={28} />
              <span className="text-[11px] tracking-[0.22em] font-medium whitespace-nowrap" style={{ color: "#5c5c5c" }}>
                חיסכון ופנסיה
              </span>
            </div>
          </div>

          {/* Market-mono eyebrow — the one shared gesture across all savings pages */}
          <div
            className="mb-5 flex items-center gap-2.5 text-[11px] sm:text-[12px] font-semibold tracking-[0.18em] text-[#171717] tabular-nums"
            style={{ fontFamily: MONO }}
          >
            <span>אחרי פרישה</span>
            <span className="text-[#171717]/35 select-none" aria-hidden="true">·</span>
            <span style={{ color: "#5c5c5c" }}>מיצוי זכויות</span>
          </div>
          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            ניהול <span style={{ color: "#5c5c5c" }}>חכם של הפנסיה</span>
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            ניהול חכם של הפנסיה והחסכונות לאחר הפרישה: מיצוי זכויות, אופטימיזציה של הקצבה ושמירה על ערך ההון.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] bento-hover min-h-[52px]"
            >
              ייעוץ לאחר פרישה
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              מה כולל השירות
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full bento-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על ניהול הפנסיה? היועץ מחובר</StatusPill>
          </button>
        </div>
        {/* Bento play: line figure peeking from the tile corner */}
        <FamilyFigure className="absolute -left-3 -bottom-4 w-16 h-16 opacity-70 -rotate-6 pointer-events-none" />
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>מה כולל ליווי אחרי פרישה?</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "אופטימיזציית קצבה", desc: "מקסום הקצבה החודשית שלכם" },
                { title: "מיצוי זכויות", desc: "ניצול כל ההטבות והזכויות" },
                { title: "הגנה על הון", desc: "שמירה על ערך החסכונות" },
                { title: "ביטוח מתאים", desc: "כיסוי רפואי וסיעודי מותאם" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/10 pt-4">
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
                  השירותים
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

              {/* — Services — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>שירותים לפנסיונרים</SectionTitle>
                  <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">
                    ליווי מקיף לניהול חכם של הכספים אחרי הפרישה
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="border-t border-[#171717]/10 pt-4">
                      <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {type.title}
                      </h3>
                      <p className="text-[#5c5c5c] text-[14px] leading-[1.8] mb-4">{type.description}</p>
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
                        <AccordionTrigger className="text-start text-base font-medium text-[#171717] hover:no-underline py-5 px-3 -mx-3 rounded-md hover:bg-[#171717]/5 transition-colors duration-150">
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
                כבר בפנסיה? בואו נוודא שאתם ממצים הכל
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                הזינו את הפרטים ונבדוק שאתם מקבלים את המקסימום
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לאחר פרישה"
                description="מלאו את הפרטים ונבדוק שאתם ממצים את כל הזכויות שלכם"
              />
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PostRetirement;
