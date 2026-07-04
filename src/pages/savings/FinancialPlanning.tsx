import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

const FinancialPlanning = () => {
  const productTypes = [
    {
      title: "ניתוח מקיף",
      description: "מיפוי מלא של המצב הכלכלי והגדרת יעדים",
      features: ["מיפוי הכנסות והוצאות", "הגדרת יעדים", "זיהוי הזדמנויות"],
    },
    {
      title: "תוכנית פעולה",
      description: "בניית אסטרטגיה מותאמת אישית להשגת היעדים",
      features: ["אסטרטגיה מותאמת", "לוחות זמנים", "יעדים מדידים"],
    },
    {
      title: "ליווי שוטף",
      description: "מעקב ועדכון התוכנית בהתאם לשינויים בחיים",
      features: ["פגישות תקופתיות", "עדכוני תוכנית", "תמיכה מקצועית"],
    },
  ];

  const faqItems = [
    {
      q: "מה כולל תהליך תכנון כלכלי?",
      a: "התהליך כולל פגישת היכרות, איסוף נתונים כלכליים מלאים, ניתוח מעמיק, הצגת ממצאים והמלצות, בניית תוכנית פעולה, ויישום עם ליווי שוטף. הכל מותאם אישית למצב ולצרכים שלכם.",
    },
    {
      q: "כמה זמן לוקח התהליך?",
      a: "תהליך התכנון הראשוני לוקח בדרך כלל 2-4 שבועות, כולל איסוף מידע, ניתוח ובניית התוכנית. הליווי השוטף ממשיך לאורך זמן עם פגישות תקופתיות לעדכון ומעקב.",
    },
    {
      q: "האם תכנון כלכלי רלוונטי גם למי שלא מרוויח הרבה?",
      a: "בהחלט. דווקא מי שההכנסה שלו מוגבלת צריך תכנון כלכלי חכם כדי למקסם כל שקל. ניהול נכון של תקציב, ניצול הטבות מס, ובחירת מוצרים פיננסיים נכונים יכולים לשנות משמעותית את המצב הכלכלי.",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">תכנון כלכלי מתקדם</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            המרכז לתכנון כלכלי מתקדם
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9] mb-9">
            ליווי מקצועי ומקיף לבניית תוכנית כלכלית אישית ארוכת טווח — מפת דרכים כלכלית שמלווה אתכם לכל החיים.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ לתכנון כלכלי
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              מה כולל השירות
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
        </div>
      </section>

      <main>
        {/* Benefits */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                למה תכנון כלכלי?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "ניתוח מקיף", desc: "מיפוי מלא של המצב הכלכלי" },
                { title: "יעדים ברורים", desc: "הגדרת יעדים מדידים וריאליים" },
                { title: "מקסום הון", desc: "אסטרטגיה להגדלת ההון שלכם" },
                { title: "ליווי שוטף", desc: "מעקב ועדכון לאורך כל הדרך" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/15 pt-5">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Types */}
        <section id="product-types" style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                תכנון כלכלי
              </div>
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                שלבי התכנון הכלכלי
              </h2>
              <p className="text-[#171717]/45 mt-2 text-base leading-relaxed max-w-xl">
                תהליך מובנה שמוביל לתוצאות
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              {productTypes.map((type, idx) => (
                <div key={idx} className="border-t border-[#171717]/10 pt-4">
                  <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    {type.title}
                  </h3>
                  <p className="text-[#171717]/50 text-[14px] leading-[1.8] mb-3.5">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, fIdx) => (
                      <li key={fIdx} className="text-[#171717]/55 text-[14px] leading-relaxed flex gap-2.5">
                        <span style={{ color: BRONZE }}>—</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#171717]/20 pt-5 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  למה זה חשוב?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/55 leading-[1.85] text-base sm:text-base">
                <p>
                  תכנון כלכלי הוא לא רק לעשירים. כל אדם ומשפחה צריכים תוכנית שמגדירה לאן הכסף הולך, מה היעדים הכלכליים, ואיך מגיעים אליהם. בלי תוכנית, רוב האנשים מגיעים לנקודות מפתח בחיים — רכישת דירה, חינוך ילדים, פרישה — בלי מספיק משאבים.
                </p>
                <p>
                  תכנון כלכלי מקצועי מסתכל על התמונה הרחבה: הכנסות, הוצאות, חסכונות, ביטוחים, מיסוי, ירושה ועוד. הוא מזהה הזדמנויות שלא ניצלתם, סיכונים שלא חשבתם עליהם, ודרכים להגדיל את ההון שלכם לאורך זמן. מדובר במפת דרכים כלכלית שמלווה אתכם לכל החיים.
                </p>
              </div>

              <div className="border-t border-[#171717]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי להתחיל?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/55 leading-[1.85] text-base sm:text-base">
                <p>
                  תכנון כלכלי רלוונטי בכל שלב בחיים, אבל ישנם רגעים שבהם הוא קריטי במיוחד: כשמתחילים לעבוד ומרוויחים את המשכורת הראשונה, לפני רכישת דירה, כשנולד ילד, כשמתגרשים, כשיורשים כסף, או כשמתקרבים לפרישה.
                </p>
                <p>
                  אם אף פעם לא עשיתם תכנון כלכלי מסודר — עכשיו זה הזמן הטוב ביותר להתחיל. כל יום שעובר בלי תוכנית הוא יום שאתם לא ממקסמים את הפוטנציאל הכלכלי שלכם. גם שינויים קטנים יכולים לעשות הבדל גדול לאורך זמן.
                </p>
              </div>

              <div className="border-t border-[#171717]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מה חשוב לדעת?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/55 leading-[1.85] text-base sm:text-base">
                <p>
                  תכנון כלכלי מקצועי כולל מספר רבדים: ניתוח תזרים מזומנים, בניית קרן חירום, תכנון ביטוחי (חיים, בריאות, סיעודי), תכנון פנסיוני, אסטרטגיית השקעות, תכנון מס, ותכנון ירושה. כל רובד חשוב ומשלים את האחרים.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים שירות תכנון כלכלי מקיף ואישי. נמפה את המצב הכלכלי הנוכחי שלכם, נגדיר יעדים ברורים, ונבנה תוכנית פעולה מפורטת עם ליווי שוטף. כל זה בגישה אנושית, מקצועית וללא מילים מסובכות.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#171717]/20 pt-5 mb-8">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  שאלות נפוצות
                </h2>
              </div>
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
                    <AccordionContent className="text-[#171717]/50 leading-[1.85] pb-6 text-[14px]">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Companies */}
        <CompanyLogos variant="grid" />

        {/* Analysis Form */}
        <section id="analysis-form" className="scroll-mt-24" style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5 mb-10">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                מוכנים לתכנון כלכלי מקצועי?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                הזינו את הפרטים ונבנה עבורכם תוכנית כלכלית מותאמת אישית
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לתכנון כלכלי"
                description="מלאו את הפרטים ונבנה עבורכם תוכנית כלכלית מותאמת אישית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FinancialPlanning;
