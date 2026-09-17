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
import { BODY, DISPLAY, GREEN, IVORY, LINE, MONO, MUTED, NAVY, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN, TURQ } from "@/lib/brand";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const tabTriggerClass =
  "rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-base font-medium text-[#476356] hover:bg-[#E8EDE5]/35 hover:text-[#003D30] border-b-2 border-transparent data-[state=active]:border-[#819B7D] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)" }}>
    {children}
  </h2>
);

const PreRetirement = () => {
  const productTypes = [
    {
      title: "תחשיב פנסיה",
      description: "חישוב מדויק של הקצבה הצפויה והיערכות כלכלית",
      features: ["חישוב קצבה צפויה", "ניתוח פערים", "תוכנית השלמה"],
    },
    {
      title: "איחוד חסכונות",
      description: "ריכוז כל החסכונות הפנסיוניים למקסום הזכויות",
      features: ["מיפוי כל החסכונות", "בדיקת זכויות", "אופטימיזציה"],
    },
    {
      title: "תכנון מס",
      description: "אופטימיזציה של תשלומי המס בפרישה",
      features: ["תיאום מס", "פטורים והטבות", "אסטרטגיית משיכה"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "השנים שלפני הפרישה הן התקופה הקריטית ביותר לתכנון פנסיוני. החלטות שמתקבלות בשלב הזה (מתי לפרוש, איך למשוך את הכספים, איפה לרכז את החסכונות) ישפיעו על רמת החיים שלכם לעשרות השנים הבאות. טעויות בשלב זה עלולות לעלות מאות אלפי שקלים.",
        "רבים מגיעים לגיל הפרישה עם חסכונות מפוזרים במספר גופים, פוליסות ישנות עם דמי ניהול גבוהים, וללא תוכנית מס מסודרת. הכנה נכונה לפרישה כוללת ריכוז כל המידע, אופטימיזציה של החסכונות, ובניית תוכנית משיכה שממקסמת את ההכנסה הפנויה.",
      ],
    },
    {
      title: "מתי כדאי להתחיל?",
      paragraphs: [
        "מומלץ להתחיל בתהליך הכנה לפרישה לפחות 3-5 שנים לפני גיל הפרישה המתוכנן. זה נותן מספיק זמן לבצע התאמות, לאחד חסכונות, לבנות תוכנית מס, ולהיערך נפשית וכלכלית למעבר. ככל שמתחילים מוקדם יותר, כך האפשרויות רחבות יותר.",
        "גם אם אתם כבר קרובים לפרישה ולא התחלתם להתכונן, עדיין לא מאוחר. ייעוץ מקצועי בשלב הזה יכול לחסוך לכם סכומים משמעותיים ולהבטיח שהכסף שצברתם ישמש אתכם בצורה הטובה ביותר.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "תהליך ההכנה לפרישה כולל מספר שלבים: איסוף כל המידע על החסכונות הפנסיוניים (קרנות פנסיה, ביטוחי מנהלים, קרנות השתלמות), חישוב הקצבה הצפויה, בדיקת זכויות מביטוח לאומי, תכנון מס אופטימלי, ובחירת אסטרטגיית משיכה (קצבה, הון, או שילוב).",
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו מציעים ליווי מקיף לפני פרישה. נרכז את כל המידע, נבנה תוכנית מותאמת אישית, ונלווה אתכם בכל שלב, כדי שהמעבר לפנסיה יהיה חלק, בטוח ומשתלם.";

  const faqItems = [
    {
      q: "מתי אפשר לפרוש?",
      a: "גיל הפרישה בישראל הוא 67 לגברים ו-65 לנשים (עולה בהדרגה). ניתן לפרוש מוקדם יותר, אך זה ישפיע על גובה הקצבה. פרישה מאוחרת יותר תגדיל את הקצבה החודשית.",
    },
    {
      q: "האם כדאי למשוך הון חד-פעמי או קצבה?",
      a: "התשובה תלויה במצבכם הכלכלי. קצבה חודשית מבטיחה הכנסה קבועה לכל החיים. משיכת הון חד-פעמי נותנת גמישות אך דורשת ניהול עצמי. ברוב המקרים, שילוב של שניהם הוא הפתרון האופטימלי.",
    },
    {
      q: "יש לי כספים ב-5 גופים שונים, מה עושים?",
      a: "איחוד חסכונות פנסיוניים יכול לחסוך דמי ניהול ולפשט את הניהול. אך לא תמיד כדאי לאחד, לפעמים יש יתרון בשמירה על פוליסות ותיקות עם תנאים מיוחדים. אנחנו נבדוק כל מקרה לגופו.",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      {/* HERO — the retirement-horizon art beside the headline */}
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
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">לפני פרישה</span>
          </nav>

          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                הכנה מקיפה לפרישה
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                כל מה שצריך לדעת לפני המעבר לפנסיה: תחשיב קצבה, איחוד חסכונות ותכנון מס אופטימלי.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a href="#analysis-form" className="btn-primary sm:min-w-[220px]">
                  ייעוץ לפני פרישה
                </a>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a href="#product-types" className="link-rule text-[15px]">
                  שלבי ההכנה
                  <BrandIcon name="arrow-left" size={18} />
                </a>
                <button type="button" className="link-rule text-[15px]" onClick={openChat}>
                  <BrandIcon name="message" size={18} />
                  שאלו את היועץ הדיגיטלי
                </button>
              </div>
            </div>

            <Illustration name="04-retirement-horizon" priority sizes="(min-width: 1024px) 560px, 100vw" className="brand-hero-art" />
          </div>
        </div>
      </section>

      <main>
        {/* BENEFITS */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <BrandDots className="mb-4" />
            <h2 className="dna-display leading-tight mb-10" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              מה כולל ליווי לפני פרישה?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
              {[
                { title: "תחשיב קצבה", desc: "חישוב מדויק של הקצבה הצפויה" },
                { title: "איחוד חסכונות", desc: "ריכוז כל החסכונות למקום אחד" },
                { title: "תכנון מס", desc: "אופטימיזציה של המס בפרישה" },
                { title: "הגנה מלאה", desc: "ביטוחים וזכויות מותאמים לפרישה" },
              ].map((item, idx) => (
                <div key={idx} className="border-t pt-5" style={{ borderColor: LINE }}>
                  <h3 className="text-[19px] mb-2" style={{ color: GREEN }}>{item.title}</h3>
                  <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ THE KNOWLEDGE — one tabbed section ══════ */}
        <section id="product-types" className="border-t scroll-mt-24" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#CCD6CC] rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  שלבי ההכנה
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
                      <div className="mb-6">
                        <SectionTitle>{article.title}</SectionTitle>
                      </div>
                      <div className="space-y-4 text-[#24483C] leading-[1.9] text-base">
                        {article.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="dna-quote mt-12">
                    <div className="dna-ql">בשורה התחתונה</div>
                    <div className="dna-qt">{bottomLine}</div>
                  </div>
                </div>
              </TabsContent>

              {/* — Stages — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>שלבי ההכנה לפרישה</SectionTitle>
                  <p className="text-[#476356] mt-2 text-base leading-relaxed max-w-xl">
                    תהליך מקיף שמבטיח פרישה חלקה ומשתלמת
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="dna-concept">
                      <h3 className="text-[17px] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {type.title}
                      </h3>
                      <p className="text-[#24483C] text-[14px] leading-[1.8] mb-4">{type.description}</p>
                      <ul className="space-y-2">
                        {type.features.map((feature, fIdx) => (
                          <li key={fIdx} className="dna-pill-item !py-1.5 text-[14px]">
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
                        className="border-b border-[#CCD6CC] rounded-none px-0"
                      >
                        <AccordionTrigger className="text-start text-base font-medium text-[#003D30] hover:no-underline py-5 px-3 -mx-3 rounded-md hover:bg-[#E8EDE5]/35 transition-colors duration-150">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[#24483C] leading-[1.85] pb-6 text-[14px]">
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
        <section className="border-t" style={{ borderColor: LINE }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* ANALYSIS FORM — deep green band, the central path */}
        <section id="analysis-form" className="scroll-mt-24 dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-10">
              <BrandDots className="mb-4" />
              <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                מתכוננים לפרישה?
              </h2>
              <p className="text-[17px] leading-[1.7] max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                הזינו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם. אפשר גם להתחיל בבדיקת תיק 360 מלאה.
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לפני פרישה"
                description="מלאו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם"
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

export default PreRetirement;
