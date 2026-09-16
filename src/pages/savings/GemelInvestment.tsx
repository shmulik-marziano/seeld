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

const GemelInvestment = () => {
  const productTypes = [
    {
      title: "נזילות גבוהה",
      description: "אפשרות למשיכת כספים בכל עת ללא קנסות או הגבלות",
      features: ["משיכה מיידית", "ללא קנסות", "גמישות מלאה"],
    },
    {
      title: "דחיית מס",
      description: "דחיית תשלום מס רווחי הון עד למועד המשיכה בפועל",
      features: ["0% מס עד משיכה", "פטור בגיל 60 כקצבה", "ריבית דריבית מלאה"],
    },
    {
      title: "מסלולי השקעה",
      description: "מגוון מסלולי השקעה המותאמים לפרופיל הסיכון שלכם",
      features: ["מסלולים מנוהלים", "התאמה אישית", "מעקב ביצועים"],
    },
  ];

  const benefits = [
    { title: "נזילות מלאה", desc: "משיכת כספים בכל עת ללא קנסות" },
    { title: "דחיית מס", desc: "0% מס על רווחים עד למשיכה" },
    { title: "ריבית דריבית", desc: "הכסף עובד בצורה מלאה ללא ניכויים" },
    { title: "מסלולים מגוונים", desc: "התאמת מסלול ההשקעה לפרופיל שלכם" },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "קופת גמל להשקעה היא אחד מאפיקי החיסכון האטרקטיביים ביותר בישראל. בניגוד לחשבון השקעות רגיל, קופת גמל להשקעה מאפשרת דחיית מס רווחי הון, כלומר, אתם לא משלמים מס על הרווחים כל עוד הכסף נשאר בקופה. זה אומר שהריבית דריבית עובדת לטובתכם בצורה מלאה.",
        "בנוסף, קופת גמל להשקעה מציעה נזילות מלאה, אפשר למשוך את הכספים בכל עת ללא קנסות. ובגיל 60, אם בוחרים למשוך את הכסף כקצבה חודשית, ניתן ליהנות מפטור מלא ממס רווחי הון. זוהי תכנית שמשלבת את הטוב משני העולמות: גמישות של חשבון השקעות ויתרונות מס של מוצר פנסיוני.",
      ],
    },
    {
      title: "מתי כדאי לרכוש?",
      paragraphs: [
        "קופת גמל להשקעה מתאימה לכל גיל ולכל רמת הכנסה. היא אידיאלית למי שכבר מפקיד את המקסימום לקרן השתלמות ומחפש אפיק חיסכון נוסף עם יתרונות מס. גם מי שרק מתחיל לחסוך ימצא בקופה כלי נהדר לבניית הון לטווח ארוך.",
        "מומלץ במיוחד לפתוח קופת גמל להשקעה כשיש לכם כסף פנוי שאתם רוצים להשקיע אך אינכם רוצים להיות כבולים. אפשר להפקיד עד 79,006 שקלים בשנה (נכון ל-2025), ואין הגבלה על סכום ההפקדה המינימלי.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "בבחירת קופת גמל להשקעה, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי הקופה לאורך זמן, למגוון מסלולי ההשקעה הזמינים, ולשירות הלקוחות. הבדל של חצי אחוז בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך השנים.",
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו משווים עבורכם את כל קופות הגמל להשקעה, מנתחים ביצועים ודמי ניהול, ומוצאים את הקופה שמתאימה בדיוק לפרופיל ההשקעה ולמטרות שלכם.";

  const faqItems = [
    {
      q: "מה ההבדל בין קופת גמל להשקעה לקרן נאמנות?",
      a: "ההבדל המרכזי הוא במיסוי: בקרן נאמנות משלמים מס רווחי הון בכל מימוש, בעוד בקופת גמל להשקעה המס נדחה עד למשיכה. בנוסף, בגיל 60 ניתן למשוך כקצבה עם פטור מלא ממס.",
    },
    {
      q: "האם אפשר למשוך כסף בכל עת?",
      a: "כן, קופת גמל להשקעה היא נזילה לחלוטין. ניתן למשוך את הכספים בכל עת ללא קנסות. עם זאת, במשיכה לפני גיל 60 תשלמו מס רווחי הון של 25% על הרווחים בלבד.",
    },
    {
      q: "כמה אפשר להפקיד בשנה?",
      a: "תקרת ההפקדה השנתית עומדת על כ-79,000 שקלים. ניתן להפקיד סכום חד-פעמי או בהוראת קבע חודשית, ואין סכום מינימלי להפקדה.",
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
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">קופת גמל להשקעה</span>
          </nav>

          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                קופת גמל להשקעה
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                מוצר השקעה ייחודי המשלב את היתרונות של קופת גמל עם גמישות של חשבון השקעות: נזילות מלאה ודחיית מס.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a href="#analysis-form" className="btn-primary sm:min-w-[220px]">
                  ייעוץ לקופת גמל להשקעה
                </a>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a href="#product-types" className="link-rule text-[15px]">
                  יתרונות המוצר
                  <BrandIcon name="arrow-left" size={18} />
                </a>
                <button type="button" className="link-rule text-[15px]" onClick={openChat}>
                  <BrandIcon name="message" size={18} />
                  שאלו את היועץ הדיגיטלי
                </button>
              </div>
            </div>

            <Illustration name="03-saving-growth" priority sizes="(min-width: 1024px) 560px, 100vw" />
          </div>
        </div>
      </section>

      <main>
        {/* BENEFITS */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <BrandDots className="mb-4" />
            <h2 className="dna-display leading-tight mb-10" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              למה קופת גמל להשקעה?
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

              {/* — Advantages — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>יתרונות קופת גמל להשקעה</SectionTitle>
                  <p className="mt-2 text-[17px] leading-relaxed max-w-xl" style={{ color: MUTED }}>
                    הכירו את היתרונות המרכזיים של המוצר
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

                <div className="dna-quote gold mt-10 max-w-2xl">
                  <div className="dna-ql">שימו לב</div>
                  <div className="dna-qt">
                    במשיכה לפני גיל{" "}
                    <span dir="ltr" className="tabular-nums whitespace-nowrap">60</span>{" "}
                    ישולם מס רווחי הון של{" "}
                    <span dir="ltr" className="tabular-nums whitespace-nowrap">25%</span>{" "}
                    על הרווחים בלבד. משיכה כקצבה מגיל{" "}
                    <span dir="ltr" className="tabular-nums whitespace-nowrap">60</span>{" "}
                    פטורה ממס.
                  </div>
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
                רוצים ייעוץ לקופת גמל להשקעה?
              </h2>
              <p className="text-[17px] leading-[1.7] max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                הזינו את הפרטים ונמצא לכם את הקופה המתאימה ביותר. אפשר גם להתחיל בבדיקת תיק 360 מלאה.
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ייעוץ לקופת גמל להשקעה"
                description="מלאו את הפרטים ונמצא לכם את הקופה המתאימה ביותר"
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

export default GemelInvestment;
