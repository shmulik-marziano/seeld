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

const PensionFunds = () => {
  const pensionTypes = [
    {
      title: "פנסיה מקיפה חדשה",
      description: "קרן פנסיה המשלבת חיסכון, ביטוח נכות וביטוח שאירים",
      features: ["תשואות מנוהלות", "כיסוי אובדן כושר עבודה", "פנסיית שאירים"],
    },
    {
      title: "פנסיה כללית",
      description: "מסלול חיסכון בלבד ללא רכיבים ביטוחיים",
      features: ["תשואות גבוהות יותר", "גמישות מקסימלית", "דמי ניהול נמוכים"],
    },
    {
      title: "פנסיה משלימה",
      description: "הפקדות נוספות מעבר לחובה לשיפור הפנסיה",
      features: ["הטבות מס", "הגדלת הקצבה", "חיסכון לטווח ארוך"],
    },
  ];

  const articles = [
    {
      title: "למה קרן פנסיה חשובה?",
      paragraphs: [
        "קרן הפנסיה היא עמוד התווך של הביטחון הפיננסי שלכם בפרישה. היא מבטיחה הכנסה חודשית קבועה לאחר שתפסיקו לעבוד, ומספקת גם כיסויים ביטוחיים חיוניים כמו ביטוח נכות (אובדן כושר עבודה) וביטוח שאירים להגנה על המשפחה.",
        "בישראל, הפקדה לפנסיה היא חובה על כל עובד שכיר מכוח צו הרחבה לפנסיה חובה. עם זאת, רבים אינם מודעים לכך שבחירה נכונה של קרן פנסיה ומסלול השקעה יכולה לשנות באופן דרמטי את גובה הקצבה החודשית בפרישה - הפרש שיכול להגיע למאות אלפי שקלים לאורך שנות הפנסיה.",
      ],
    },
    {
      title: "מתי כדאי לבדוק את קרן הפנסיה?",
      paragraphs: [
        "מומלץ לבדוק את קרן הפנסיה לפחות אחת לשנה. בדקו את דמי הניהול (שצריכים להיות הנמוכים ביותר האפשריים), את מסלול ההשקעה (שצריך להתאים לגיל ולרמת הסיכון שלכם), ואת ביצועי הקרן בהשוואה לקרנות מתחרות.",
        "שינויים בחיים כמו מעבר מקום עבודה, נישואים, לידת ילד או עלייה בשכר הם הזדמנויות מצוינות לבצע ניתוח פנסיוני מקיף. גם אם אתם מרוצים מהקרן הנוכחית, ייתכן שתוכלו להוריד את דמי הניהול ולחסוך עשרות אלפי שקלים לאורך השנים.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "דמי ניהול הם הגורם המשמעותי ביותר להפרש בחיסכון הפנסיוני לאורך זמן. הפרש של 0.5% בדמי ניהול יכול להסתכם במאות אלפי שקלים לאורך עשרות שנות חיסכון. בנוסף, חשוב לוודא שהכיסויים הביטוחיים (נכות ושאירים) מותאמים לצרכים שלכם ואינם מיותרים.",
        "ב-SEELD אנו מבצעים ניתוח פנסיוני מקיף וחינמי, בודקים את דמי הניהול, מסלולי ההשקעה והכיסויים הביטוחיים, ומוודאים שכל שקל עובד בשבילכם.",
      ],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין פנסיה מקיפה לפנסיה כללית?",
      a: "פנסיה מקיפה כוללת חיסכון + כיסויים ביטוחיים (נכות ושאירים). פנסיה כללית היא חיסכון בלבד ללא כיסויים ביטוחיים, ולכן דמי הניהול בה נמוכים יותר והתשואה הפוטנציאלית גבוהה יותר. רוב העובדים צריכים פנסיה מקיפה.",
    },
    {
      q: "האם אפשר להעביר קרן פנסיה?",
      a: "כן, ניתן להעביר קרן פנסיה מחברה אחת לאחרת ללא עלות. התהליך פשוט ונמשך כ-10 ימי עסקים. חשוב לבדוק שהתנאים בקרן החדשה טובים יותר לפני המעבר.",
    },
    {
      q: "מהם דמי ניהול סבירים בקרן פנסיה?",
      a: "דמי ניהול ממוצעים הם כ-0.2%-0.5% מהצבירה ו-1.5%-4% מההפקדה. עם משא ומתן נכון ניתן להגיע לדמי ניהול נמוכים משמעותית, במיוחד אם יש לכם צבירה גבוהה.",
    },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
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
              <span className="text-[#171717]/70 font-medium">קרנות פנסיה</span>
            </nav>
            <div className="hidden sm:flex items-center gap-4">
              <DrawSpark color={CHIP_GREEN} className="w-40" height={28} />
              <span className="text-[11px] tracking-[0.22em] font-medium whitespace-nowrap" style={{ color: "#5c5c5c" }}>
                חיסכון ופנסיה
              </span>
            </div>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            קרנות <span style={{ color: "#5c5c5c" }}>פנסיה</span>
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            קרן פנסיה היא מכשיר חיסכון ארוך טווח שמבטיח לכם הכנסה חודשית קבועה לאחר הפרישה. עם הייעוץ שלנו, תבחרו את הקרן שמתאימה בדיוק לכם.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ניתוח תיק פנסיוני חינם
            </a>
            <a
              href="#pension-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              סוגי פנסיה
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קרן פנסיה? היועץ מחובר</StatusPill>
          </button>
        </div>
        {/* Bento play: the page's key number on a small orange tile */}
        <div
          className="bento-panel-orange absolute top-28 left-8 hidden lg:flex flex-col items-center justify-center px-6 py-4 -rotate-2 pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[24px] font-bold text-[#171717] tabular-nums leading-none" style={{ fontFamily: MONO }} dir="ltr">
            0.5%
          </span>
          <span className="mt-1.5 text-[11px] font-semibold text-[#171717]/80 whitespace-nowrap">
            הפרש דמי ניהול
          </span>
        </div>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>יתרונות קרן הפנסיה</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "תשואות מנוהלות", desc: "הכספים מנוהלים על ידי מנהלי השקעות מקצועיים" },
                { title: "כיסויים ביטוחיים", desc: "פנסיית נכות ושאירים להגנה על המשפחה" },
                { title: "הטבות מס", desc: "זיכוי מס והפחתת הכנסה חייבת במס" },
                { title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לבחירת המסלול המתאים" },
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
        <section id="pension-types" className="px-2 pt-2 scroll-mt-24">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  סוגי הקרנות
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

              {/* — Types — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי קרנות פנסיה</SectionTitle>
                  <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">
                    הכירו את האפשרויות השונות ובחרו את המסלול המתאים לכם
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {pensionTypes.map((type, idx) => (
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
                רוצים ניתוח פנסיוני חינמי?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ניתוח תיק פנסיוני חינם"
                description="הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות"
              />
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionFunds;
