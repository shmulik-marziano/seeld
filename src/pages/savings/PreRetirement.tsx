import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Clock, Calculator, FileText, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

const PreRetirement = () => {
  const productTypes = [
    {
      title: "תחשיב פנסיה",
      icon: Calculator,
      doodle: "calculator",
      color: "#171717",
      description: "חישוב מדויק של הקצבה הצפויה והיערכות כלכלית",
      features: ["חישוב קצבה צפויה", "ניתוח פערים", "תוכנית השלמה"],
    },
    {
      title: "איחוד חסכונות",
      icon: FileText,
      doodle: "calculator",
      color: "#b45309",
      description: "ריכוז כל החסכונות הפנסיוניים למקסום הזכויות",
      features: ["מיפוי כל החסכונות", "בדיקת זכויות", "אופטימיזציה"],
    },
    {
      title: "תכנון מס",
      icon: Clock,
      doodle: "target",
      color: "#15803d",
      description: "אופטימיזציה של תשלומי המס בפרישה",
      features: ["תיאום מס", "פטורים והטבות", "אסטרטגיית משיכה"],
    },
  ];

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
      a: "איחוד חסכונות פנסיוניים יכול לחסוך דמי ניהול ולפשט את הניהול. אך לא תמיד כדאי לאחד — לפעמים יש יתרון בשמירה על פוליסות ותיקות עם תנאים מיוחדים. אנחנו נבדוק כל מקרה לגופו.",
    },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">לפני פרישה</span>
            </nav>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            הכנה <span style={{ color: BRONZE }}>מקיפה לפרישה</span>
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9] mb-9">
            כל מה שצריך לדעת לפני המעבר לפנסיה — תחשיב קצבה, איחוד חסכונות ותכנון מס אופטימלי.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ לפני פרישה
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              שלבי ההכנה
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                מה כולל ליווי לפני פרישה?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { icon: Calculator, doodle: "calculator", title: "תחשיב קצבה", desc: "חישוב מדויק של הקצבה הצפויה", color: "#171717" },
                { icon: FileText, doodle: "calculator", title: "איחוד חסכונות", desc: "ריכוז כל החסכונות למקום אחד", color: "#b45309" },
                { icon: Clock, doodle: "target", title: "תכנון מס", desc: "אופטימיזציה של המס בפרישה", color: "#15803d" },
                { icon: Shield, doodle: "shield", title: "הגנה מלאה", desc: "ביטוחים וזכויות מותאמים לפרישה", color: "#b91c1c" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/10 pt-4">
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

        {/* ══════ PREPARATION STAGES ══════ */}
        <section id="product-types" style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                שלבי ההכנה לפרישה
              </h2>
              <p className="text-[#171717]/45 mt-2 text-base leading-relaxed max-w-xl">תהליך מקיף שמבטיח פרישה חלקה ומשתלמת</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              {productTypes.map((type, idx) => (
                <div key={idx} className="border-t border-[#171717]/10 pt-4">
                  <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    {type.title}
                  </h3>
                  <p className="text-[#171717]/50 text-[14px] leading-[1.8] mb-4">{type.description}</p>
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

        {/* ══════ ARTICLE ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#171717]/15 pt-5 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  למה זה חשוב?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base sm:text-base">
                <p>
                  השנים שלפני הפרישה הן התקופה הקריטית ביותר לתכנון פנסיוני. החלטות שמתקבלות בשלב הזה — כמו מתי לפרוש, איך למשוך את הכספים, ואיפה לרכז את החסכונות — ישפיעו על רמת החיים שלכם לעשרות השנים הבאות. טעויות בשלב זה עלולות לעלות מאות אלפי שקלים.
                </p>
                <p>
                  רבים מגיעים לגיל הפרישה עם חסכונות מפוזרים במספר גופים, פוליסות ישנות עם דמי ניהול גבוהים, וללא תוכנית מס מסודרת. הכנה נכונה לפרישה כוללת ריכוז כל המידע, אופטימיזציה של החסכונות, ובניית תוכנית משיכה שממקסמת את ההכנסה הפנויה.
                </p>
              </div>

              <div className="border-t border-[#171717]/15 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי להתחיל?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base sm:text-base">
                <p>
                  מומלץ להתחיל בתהליך הכנה לפרישה לפחות 3-5 שנים לפני גיל הפרישה המתוכנן. זה נותן מספיק זמן לבצע התאמות, לאחד חסכונות, לבנות תוכנית מס, ולהיערך נפשית וכלכלית למעבר. ככל שמתחילים מוקדם יותר, כך האפשרויות רחבות יותר.
                </p>
                <p>
                  גם אם אתם כבר קרובים לפרישה ולא התחלתם להתכונן — עדיין לא מאוחר. ייעוץ מקצועי בשלב הזה יכול לחסוך לכם סכומים משמעותיים ולהבטיח שהכסף שצברתם ישמש אתכם בצורה הטובה ביותר.
                </p>
              </div>

              <div className="border-t border-[#171717]/15 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מה חשוב לדעת?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base sm:text-base">
                <p>
                  תהליך ההכנה לפרישה כולל מספר שלבים: איסוף כל המידע על החסכונות הפנסיוניים (קרנות פנסיה, ביטוחי מנהלים, קרנות השתלמות), חישוב הקצבה הצפויה, בדיקת זכויות מביטוח לאומי, תכנון מס אופטימלי, ובחירת אסטרטגיית משיכה (קצבה, הון, או שילוב).
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ליווי מקיף לפני פרישה. נרכז את כל המידע, נבנה תוכנית מותאמת אישית, ונלווה אתכם בכל שלב — כדי שהמעבר לפנסיה יהיה חלק, בטוח ומשתלם.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ FAQ ══════ */}
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
                מתכוננים לפרישה?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                הזינו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לפני פרישה"
                description="מלאו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PreRetirement;
