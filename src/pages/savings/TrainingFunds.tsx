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

const TrainingFunds = () => {
  const productTypes = [
    {
      title: "פטור ממס",
      description: "פטור מלא ממס רווחי הון · כל הרווחים שלכם",
      features: ["0% מס על רווחים", "ניכוי מס על הפקדות", "חיסכון של אלפי שקלים"],
    },
    {
      title: "נזילות מהירה",
      description: "משיכה פטורה לאחר 6 שנים בלבד",
      features: ["ללא קנסות", "שימוש חופשי בכספים", "לכל מטרה"],
    },
    {
      title: "מטרות מגוונות",
      description: "לא רק להשתלמויות, לכל מטרה שתרצו",
      features: ["דירה לילדים", "חופשה גדולה", "כל יעד שתבחרו"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "קרן השתלמות היא אפיק החיסכון היחיד בישראל שנהנה מפטור מלא ממס רווחי הון. המשמעות היא שכל הרווחים שהכסף שלכם מניב: 100% שלכם, ללא ניכוי מס. אין שום מוצר פיננסי אחר שמציע יתרון כזה.",
        "לשכירים, קרן השתלמות היא הטבה משמעותית: המעסיק מפקיד 7.5% מהשכר, העובד מפקיד 2.5%, וההפקדות מוכרות כהוצאה לצרכי מס. לעצמאים, ההפקדה לקרן השתלמות מזכה בניכוי מס משמעותי. לאחר 6 שנים הכסף נזיל לחלוטין ואפשר להשתמש בו לכל מטרה.",
      ],
    },
    {
      title: "מתי כדאי לפעול?",
      paragraphs: [
        "לשכירים: מומלץ לוודא שהמעסיק מפקיד לקרן השתלמות כבר מהיום הראשון בעבודה. אם המעסיק לא מציע קרן השתלמות, שקלו לבקש זאת כחלק מתנאי ההעסקה. לעצמאים: כדאי לפתוח קרן השתלמות מיד עם תחילת הפעילות העצמאית.",
        "חשוב לבצע בדיקה תקופתית של ביצועי הקרן ודמי הניהול. הפרש של אחוז אחד בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך שנים. מעבר בין קרנות הוא תהליך פשוט וחינמי.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "בבחירת קרן השתלמות, יש לבחון שלושה פרמטרים מרכזיים: דמי ניהול (ככל שנמוכים יותר, טוב יותר), ביצועי הקרן לאורך זמן (לפחות 5-10 שנים), ומסלול ההשקעה (מניות, אג״ח, מסלול כללי וכו׳). לא תמיד הקרן הזולה ביותר היא הטובה ביותר, חשוב לראות את התמונה הכוללת.",
        "ב-SEELD אנחנו מבצעים ניתוח מעמיק של קרנות ההשתלמות שלכם, משווים ביצועים ודמי ניהול מול כל הקרנות בשוק, וחוזרים אליכם עם השוואה מסודרת והמלצה מנומקת, ללא עלות.",
      ],
    },
  ];

  const faqItems = [
    {
      q: "מתי אפשר למשוך כסף מקרן השתלמות?",
      a: "לאחר 6 שנים ממועד ההפקדה הראשונה, הכספים נזילים לחלוטין ופטורים ממס רווחי הון. ניתן להשתמש בכסף לכל מטרה, אין חובה שהשימוש יהיה קשור להשתלמות.",
    },
    {
      q: "כמה אפשר להפקיד בקרן השתלמות?",
      a: "לשכירים, תקרת ההפקדה המוטבת היא עד 15,712 שקלים בשנה (חלק עובד + מעסיק). לעצמאים, התקרה עומדת על כ-19,500 שקלים בשנה עם ניכוי מס.",
    },
    {
      q: "האם אפשר להעביר קרן השתלמות בין חברות?",
      a: "כן, המעבר חינמי ופשוט. אפשר לעבור לקרן עם דמי ניהול נמוכים יותר או ביצועים טובים יותר בכל עת. אנחנו ב-SEELD מטפלים בכל התהליך עבורכם.",
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
              <span className="text-[#171717]/70 font-medium">קרנות השתלמות</span>
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
            החיסכון <span style={{ color: "#5c5c5c" }}>הכי משתלם</span> בישראל
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            קרן השתלמות היא אפיק החיסכון המועדף בישראל: פטור מלא ממס רווחי הון ונזילות לאחר 6 שנים בלבד.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ניתוח קרנות חינם
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              יתרונות הקרן
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קרן השתלמות? היועץ מחובר</StatusPill>
          </button>
        </div>
        {/* Bento play: the page's key number on a small orange tile */}
        <div
          className="bento-panel-orange absolute top-28 left-8 hidden lg:flex flex-col items-center justify-center px-6 py-4 -rotate-2 pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[24px] font-bold text-[#171717] tabular-nums leading-none" style={{ fontFamily: MONO }} dir="ltr">
            0%
          </span>
          <span className="mt-1.5 text-[11px] font-semibold text-[#171717]/80 whitespace-nowrap">
            מס על הרווחים
          </span>
        </div>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>למה קרן השתלמות?</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "פטור מלא ממס", desc: "0% מס על כל הרווחים שצברתם" },
                { title: "נזילות ב-6 שנים", desc: "כספים נזילים לאחר 6 שנים" },
                { title: "תשואות גבוהות", desc: "ביצועים מעולים לאורך זמן" },
                { title: "לכל מטרה", desc: "שימוש חופשי בכספים לאחר נזילות" },
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
                  יתרונות הקרן
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

              {/* — Advantages — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>יתרונות קרן השתלמות</SectionTitle>
                  <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">
                    האפיק היחיד בישראל עם פטור מלא ממס רווחי הון
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
                רוצים ניתוח קרנות השתלמות חינם?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                בדקו אם הקרנות שלכם מניבות את התשואה המיטבית
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ניתוח קרנות השתלמות"
                description="בדקו אם הקרנות שלכם מניבות את התשואה המיטבית"
              />
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TrainingFunds;
