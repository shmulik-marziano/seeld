import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Umbrella, Banknote, HeartHandshake, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

const PostRetirement = () => {
  const productTypes = [
    {
      title: "ניהול קצבה",
      icon: Banknote,
      doodle: "savings",
      color: "#5ec6c6",
      description: "אופטימיזציה של הקצבה החודשית ותכנון תקציב",
      features: ["בדיקת קצבה", "תיאום מס", "מקסום הכנסה"],
    },
    {
      title: "זכויות פנסיונרים",
      icon: HeartHandshake,
      doodle: "family",
      color: "#f4a261",
      description: "מיצוי זכויות והטבות המגיעות לפנסיונרים",
      features: ["קצבת זקנה", "גמלת סיעוד", "הנחות והטבות"],
    },
    {
      title: "הגנה על הון",
      icon: Umbrella,
      doodle: "umbrella",
      color: "#90be6d",
      description: "שמירה על ערך החסכונות והשקעה בטוחה",
      features: ["ניהול סיכונים", "השקעות שמרניות", "ביטוח מתאים"],
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
              <span className="text-[#171717]/70 font-medium">אחרי פרישה</span>
            </nav>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            ניהול <span style={{ color: BRONZE }}>חכם של הפנסיה</span>
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9] mb-9">
            ניהול חכם של הפנסיה והחסכונות לאחר הפרישה — מיצוי זכויות, אופטימיזציה של הקצבה ושמירה על ערך ההון.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
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
                מה כולל ליווי אחרי פרישה?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { icon: Banknote, doodle: "savings", title: "אופטימיזציית קצבה", desc: "מקסום הקצבה החודשית שלכם", color: "#5ec6c6" },
                { icon: HeartHandshake, doodle: "family", title: "מיצוי זכויות", desc: "ניצול כל ההטבות והזכויות", color: "#f4a261" },
                { icon: Umbrella, doodle: "umbrella", title: "הגנה על הון", desc: "שמירה על ערך החסכונות", color: "#90be6d" },
                { icon: Shield, doodle: "shield", title: "ביטוח מתאים", desc: "כיסוי רפואי וסיעודי מותאם", color: "#e76f51" },
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

        {/* ══════ SERVICES ══════ */}
        <section id="product-types" style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                שירותים לפנסיונרים
              </h2>
              <p className="text-[#171717]/45 mt-2 text-base leading-relaxed max-w-xl">ליווי מקיף לניהול חכם של הכספים אחרי הפרישה</p>
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
                  הפרישה היא לא הסוף — זו תחילת פרק חדש שיכול להימשך 20-30 שנה ויותר. ניהול נכון של הכספים לאחר הפרישה הוא קריטי: צריך לוודא שהקצבה החודשית מספיקה, שהחסכונות שומרים על ערכם, ושכל הזכויות וההטבות מנוצלות במלואן.
                </p>
                <p>
                  רבים מגלים רק לאחר הפרישה שהם לא ממצים את הזכויות שלהם — החזרי מס, הנחות, קצבאות נוספות מביטוח לאומי, ותיאום מס על הקצבה. ייעוץ מקצועי יכול להוסיף אלפי שקלים בשנה להכנסה הפנויה שלכם.
                </p>
              </div>

              <div className="border-t border-[#171717]/15 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי לפנות?
                </h2>
              </div>
              <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base sm:text-base">
                <p>
                  ליווי פנסיוני לאחר פרישה רלוונטי מיד עם תחילת קבלת הקצבה. אם כבר פרשתם ולא ביצעתם בדיקה מקיפה — עכשיו זה הזמן. כל חודש שעובר בלי אופטימיזציה הוא כסף שנשאר על השולחן.
                </p>
                <p>
                  מומלץ גם לבצע בדיקה תקופתית, לפחות אחת לשנה. תנאי המס משתנים, זכויות מתעדכנות, ויש הזדמנויות חדשות שכדאי לנצל. אנחנו ב-SEELD נוודא שאתם תמיד מקבלים את המקסימום.
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
                  לאחר הפרישה, יש מספר נושאים קריטיים: תיאום מס על הקצבה (להבטיח שלא משלמים יותר מדי), מיצוי קצבאות ביטוח לאומי (קצבת זקנה, גמלת סיעוד), ניהול חסכונות והשקעות (התאמת רמת הסיכון לגיל), וביטוח רפואי וסיעודי מתאים.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ליווי מקיף לפנסיונרים: נבדוק את הקצבה שלכם, נוודא שאתם ממצים כל זכות, נתאים את הביטוחים, ונבנה תוכנית כלכלית שמבטיחה איכות חיים גבוהה לאורך שנים.
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PostRetirement;
