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

  const faqItems = [
    {
      q: "כמה כסף צריך כדי להתחיל להשקיע?",
      a: "אין סכום מינימלי. אפשר להתחיל עם מאות שקלים בחודש בהוראת קבע. הדבר החשוב הוא להתחיל — גם סכומים קטנים שמושקעים באופן עקבי צוברים סכומים משמעותיים לאורך זמן.",
    },
    {
      q: "מה הסיכון בהשקעות?",
      a: "כל השקעה כרוכה בסיכון. ככל שפוטנציאל התשואה גבוה יותר, כך הסיכון גדול יותר. ניהול סיכונים נכון כולל פיזור השקעות, התאמה לאופק ההשקעה, ומעקב שוטף. לא שמים את כל הביצים בסל אחד.",
    },
    {
      q: "מה ההבדל בין ייעוץ השקעות לניהול תיקים?",
      a: "בייעוץ השקעות, המומחה מייעץ ואתם מקבלים החלטות. בניהול תיקים, מנהל ההשקעות מקבל החלטות עבורכם על פי מדיניות שהוגדרה מראש. שתי האפשרויות לגיטימיות — הבחירה תלויה בכמה אתם רוצים להיות מעורבים.",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#1a1a18]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#1a1a18]/40">
              <Link to="/" className="hover:text-[#1a1a18] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#1a1a18] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#1a1a18]/70 font-medium">חיסכון והשקעה</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            בנו את העתיד הפיננסי שלכם
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9] mb-9">
            פתרונות השקעה מותאמים אישית לבניית תיק השקעות אופטימלי המתאים לפרופיל הסיכון והיעדים שלכם.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#1a1a18] text-[#f6f5f1] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ השקעות חינם
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#1a1a18] border-b border-[#1a1a18]/25 pb-0.5 hover:border-[#1a1a18] transition-colors"
            >
              פתרונות השקעה
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
        </div>
      </section>

      <main>
        {/* Benefits */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                פתרונות ההשקעה שלנו
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "התאמה אישית", desc: "תיק השקעות מותאם לפרופיל שלכם" },
                { title: "ניהול מקצועי", desc: "צוות מנהלי השקעות מנוסים" },
                { title: "פיזור סיכונים", desc: "אסטרטגיה חכמה להקטנת סיכון" },
                { title: "מגוון אפיקים", desc: "גישה למניות, אג\"ח, נדל\"ן ועוד" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#1a1a18]/15 pt-5">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg text-[#1a1a18] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] text-[#1a1a18]/50 leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Types */}
        <section id="product-types" style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                חיסכון והשקעה
              </div>
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                סוגי פתרונות השקעה
              </h2>
              <p className="text-[#1a1a18]/45 mt-2 text-[15px] leading-relaxed max-w-xl">
                בחרו את הפתרון המתאים ליעדים הכלכליים שלכם
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              {productTypes.map((type, idx) => (
                <div key={idx} className="border-t border-[#1a1a18]/10 pt-4">
                  <h3 className="text-base text-[#1a1a18] mb-2" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {type.title}
                  </h3>
                  <p className="text-[#1a1a18]/50 text-[13.5px] leading-[1.8] mb-3.5">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, fIdx) => (
                      <li key={fIdx} className="text-[#1a1a18]/55 text-[13.5px] leading-relaxed flex gap-2.5">
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
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-6">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  למה זה חשוב?
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  השקעה חכמה היא המפתח לבניית עושר ואיתנות פיננסית לטווח ארוך. הכסף שיושב בעו״ש מאבד מערכו בגלל האינפלציה, בעוד כסף שמושקע נכון יכול לצמוח ולהכפיל את עצמו לאורך השנים. ההבדל בין חוסך להון משמעותי הוא לרוב לא כמה מרוויחים, אלא כמה חכם משקיעים.
                </p>
                <p>
                  ניהול השקעות מקצועי מבטיח שהכסף שלכם עובד בצורה אופטימלית — עם פיזור סיכונים חכם, התאמה לפרופיל הסיכון שלכם, ומעקב שוטף אחרי ביצועי התיק. לא צריך להיות מומחה בשוק ההון כדי ליהנות מתשואות טובות.
                </p>
              </div>

              <div className="border-t border-[#1a1a18]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי להתחיל?
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  הזמן הטוב ביותר להתחיל להשקיע הוא אתמול. הזמן השני הטוב ביותר הוא היום. ככל שמתחילים מוקדם יותר, כך אפקט הריבית דריבית עובד חזק יותר לטובתכם. גם סכומים קטנים שמושקעים באופן עקבי לאורך שנים הופכים להון משמעותי.
                </p>
                <p>
                  ייעוץ השקעות רלוונטי בכל שלב: בתחילת הדרך כשרוצים לבנות תיק ראשון, כשיש סכום חד-פעמי להשקעה, כשמגיעים לנקודת מפנה כלכלית, או כשרוצים לבדוק שהתיק הקיים באמת עובד בצורה אופטימלית.
                </p>
              </div>

              <div className="border-t border-[#1a1a18]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מה חשוב לדעת?
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  ניהול השקעות מוצלח מתחיל בהבנת פרופיל הסיכון שלכם: מהו אופק ההשקעה? כמה תנודתיות אתם מוכנים לספוג? מהם היעדים הכלכליים שלכם? על בסיס התשובות נבנה תיק מגוון שכולל מניות, אג״ח, נדל״ן ואפיקים נוספים בהתאמה אישית.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ייעוץ השקעות מקצועי שמתבסס על ניתוח מעמיק של המצב הכלכלי והיעדים שלכם. נבנה תיק מותאם אישית, נלווה אתכם לאורך הדרך, ונוודא שההשקעות שלכם תמיד מנוהלות בצורה אופטימלית.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-8">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  שאלות נפוצות
                </h2>
              </div>
              <Accordion type="multiple">
                {faqItems.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border-b border-[#1a1a18]/10 rounded-none px-0"
                  >
                    <AccordionTrigger className="text-start text-[15px] font-medium text-[#1a1a18] hover:no-underline py-5">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#1a1a18]/50 leading-[1.85] pb-6 text-[14px]">
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
                className="text-[#f6f5f1] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים ייעוץ השקעות מקצועי?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-relaxed max-w-xl">
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Investment;
