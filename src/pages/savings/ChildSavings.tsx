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

const ChildSavings = () => {
  const productTypes = [
    {
      title: "הפקדה ממשלתית",
      description: "המדינה מפקידה מדי חודש סכום קבוע עבור כל ילד",
      features: ["הפקדה אוטומטית", "ללא עלות להורים", "לכל ילד בישראל"],
    },
    {
      title: "בחירת מסלול",
      description: "אפשרות לבחור את הגוף המנהל ומסלול ההשקעה",
      features: ["מגוון גופים מנהלים", "מסלולי השקעה שונים", "מעבר חינמי"],
    },
    {
      title: "התחלה מושלמת",
      description: "הבטחת עתיד כלכלי יציב לילדיכם מגיל צעיר",
      features: ["קרן פתיחה בגיל 18", "פטור ממס", "ריבית דריבית"],
    },
  ];

  const faqItems = [
    {
      q: "מתי הילד יכול למשוך את הכסף?",
      a: "הילד יכול למשוך את הכסף מגיל 18. ניתן להשאיר את הכסף בחיסכון גם אחרי גיל 18 כדי להמשיך ולהנות מתשואה. המשיכה פטורה ממס.",
    },
    {
      q: "האם אפשר להוסיף הפקדות מעבר להפקדת המדינה?",
      a: "כן, ההורים יכולים להוסיף 50 שקלים בחודש מכיסם. ההפקדה הנוספת תגדיל משמעותית את הסכום שיצטבר עד גיל 18 הודות לאפקט הריבית דריבית.",
    },
    {
      q: "מה קורה אם לא בוחרים גוף מנהל?",
      a: "אם ההורים לא בוחרים תוך זמן מוגדר, המדינה מפקידה את הכסף בגוף שנבחר במכרז ממשלתי, במסלול ברירת מחדל. מומלץ לבחור באופן אקטיבי כדי להתאים את מסלול ההשקעה לצרכים שלכם.",
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
              <span className="text-[#1a1a18]/70 font-medium">חיסכון לכל ילד</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            הבטיחו עתיד כלכלי לילדיכם
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9] mb-9">
            תוכנית חיסכון ממשלתית המבטיחה קרן פתיחה לכל ילד בישראל בהגיעו לגיל 18. בחרו את המסלול הנכון והגדילו את הסכום.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#1a1a18] text-[#f6f5f1] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ לחיסכון לכל ילד
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#1a1a18] border-b border-[#1a1a18]/25 pb-0.5 hover:border-[#1a1a18] transition-colors"
            >
              איך זה עובד
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
                יתרונות החיסכון לכל ילד
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "הפקדה ממשלתית", desc: "המדינה מפקידה כל חודש עבור כל ילד" },
                { title: "תשואה צוברת", desc: "הכסף צומח לאורך 18 שנה" },
                { title: "פטור ממס", desc: "המשיכה בגיל 18 פטורה ממס" },
                { title: "בחירה חופשית", desc: "בחרו את הגוף והמסלול הטובים ביותר" },
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
                חיסכון לכל ילד
              </div>
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                איך התוכנית עובדת
              </h2>
              <p className="text-[#1a1a18]/45 mt-2 text-[15px] leading-relaxed max-w-xl">
                כל מה שצריך לדעת על חיסכון לכל ילד
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
                  תוכנית חיסכון לכל ילד היא מתנה של המדינה לכל ילד שנולד בישראל. המדינה מפקידה מדי חודש סכום קבוע לטובת כל ילד, והכסף צובר תשואה עד שהילד מגיע לגיל 18. הסכום שמצטבר יכול להגיע לעשרות אלפי שקלים — קרן פתיחה משמעותית לתחילת החיים הבוגרים.
                </p>
                <p>
                  מה שהרבה הורים לא יודעים הוא שהבחירה בגוף המנהל ובמסלול ההשקעה יכולה לעשות הבדל של אלפי שקלים. ברירת המחדל לא תמיד היא האופציה הטובה ביותר. בחירה מושכלת של מסלול עם תשואה גבוהה יותר יכולה להניב לילד שלכם סכום גדול משמעותית בגיל 18.
                </p>
              </div>

              <div className="border-t border-[#1a1a18]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי לפעול?
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  ההחלטה על הגוף המנהל ומסלול ההשקעה צריכה להתקבל מוקדם ככל האפשר — רצוי מיד עם לידת הילד. ככל שהבחירה מוקדמת יותר, כך הכסף נהנה מיותר שנים של צבירה ותשואה. אם טרם בחרתם — המדינה מפקידה את הכסף במסלול ברירת מחדל, שלא בהכרח מיטבי.
                </p>
                <p>
                  גם אם הילדים שלכם כבר גדולים, כדאי לבדוק באיזה גוף ומסלול הכסף נמצא. מעבר בין גופים מנהלים הוא תהליך פשוט וחינמי, ויכול לשפר משמעותית את התשואה על החיסכון.
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
                  ההורים צריכים לבחור בין שני אפשרויות: קופת גמל להשקעה (מנוהלת על ידי חברות ביטוח וגופי השקעה) או חשבון חיסכון בבנק. בדרך כלל, קופת גמל מניבה תשואה גבוהה יותר לאורך זמן, אם כי עם תנודתיות גבוהה יותר בטווח הקצר.
                </p>
                <p>
                  ב-SEELD אנחנו עוזרים להורים לקבל החלטה מושכלת. נשווה עבורכם את כל הגופים המנהלים, נבדוק ביצועים היסטוריים ודמי ניהול, ונמליץ על המסלול שיביא את התשואה הטובה ביותר עבור ילדיכם.
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
                רוצים לבחור את המסלול הטוב ביותר?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-relaxed max-w-xl">
                הזינו את הפרטים ונעזור לכם לבחור את הגוף והמסלול הטובים ביותר
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ייעוץ לחיסכון לכל ילד"
                description="מלאו את הפרטים ונעזור לכם לבחור את הגוף והמסלול הטובים ביותר"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ChildSavings;
