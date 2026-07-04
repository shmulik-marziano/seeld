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
              <span className="text-[#1a1a18]/70 font-medium">קופת גמל להשקעה</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            השקיעו בחכמה עם יתרונות מס
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9] mb-9">
            מוצר השקעה ייחודי המשלב את היתרונות של קופת גמל עם גמישות של חשבון השקעות — נזילות מלאה ודחיית מס.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#1a1a18] text-[#f6f5f1] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ לקופת גמל להשקעה
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#1a1a18] border-b border-[#1a1a18]/25 pb-0.5 hover:border-[#1a1a18] transition-colors"
            >
              יתרונות המוצר
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
                למה קופת גמל להשקעה?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "נזילות מלאה", desc: "משיכת כספים בכל עת ללא קנסות" },
                { title: "דחיית מס", desc: "0% מס על רווחים עד למשיכה" },
                { title: "ריבית דריבית", desc: "הכסף עובד בצורה מלאה ללא ניכויים" },
                { title: "מסלולים מגוונים", desc: "התאמת מסלול ההשקעה לפרופיל שלכם" },
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
                קופת גמל להשקעה
              </div>
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                יתרונות קופת גמל להשקעה
              </h2>
              <p className="text-[#1a1a18]/45 mt-2 text-[15px] leading-relaxed max-w-xl">
                הכירו את היתרונות המרכזיים של המוצר
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
                  קופת גמל להשקעה היא אחד מאפיקי החיסכון האטרקטיביים ביותר בישראל. בניגוד לחשבון השקעות רגיל, קופת גמל להשקעה מאפשרת דחיית מס רווחי הון — כלומר, אתם לא משלמים מס על הרווחים כל עוד הכסף נשאר בקופה. זה אומר שהריבית דריבית עובדת לטובתכם בצורה מלאה.
                </p>
                <p>
                  בנוסף, קופת גמל להשקעה מציעה נזילות מלאה — אפשר למשוך את הכספים בכל עת ללא קנסות. ובגיל 60, אם בוחרים למשוך את הכסף כקצבה חודשית, ניתן ליהנות מפטור מלא ממס רווחי הון. זוהי תכנית שמשלבת את הטוב משני העולמות: גמישות של חשבון השקעות ויתרונות מס של מוצר פנסיוני.
                </p>
              </div>

              <div className="border-t border-[#1a1a18]/20 pt-5 mt-14 mb-6">
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  מתי כדאי לרכוש?
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  קופת גמל להשקעה מתאימה לכל גיל ולכל רמת הכנסה. היא אידיאלית למי שכבר מפקיד את המקסימום לקרן השתלמות ומחפש אפיק חיסכון נוסף עם יתרונות מס. גם מי שרק מתחיל לחסוך ימצא בקופה כלי נהדר לבניית הון לטווח ארוך.
                </p>
                <p>
                  מומלץ במיוחד לפתוח קופת גמל להשקעה כשיש לכם כסף פנוי שאתם רוצים להשקיע אך אינכם רוצים להיות כבולים. אפשר להפקיד עד 79,006 שקלים בשנה (נכון ל-2025), ואין הגבלה על סכום ההפקדה המינימלי.
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
                  בבחירת קופת גמל להשקעה, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי הקופה לאורך זמן, למגוון מסלולי ההשקעה הזמינים, ולשירות הלקוחות. הבדל של חצי אחוז בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך השנים.
                </p>
                <p>
                  ב-SEELD אנחנו משווים עבורכם את כל קופות הגמל להשקעה, מנתחים ביצועים ודמי ניהול, ומוצאים את הקופה שמתאימה בדיוק לפרופיל ההשקעה ולמטרות שלכם.
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
                רוצים ייעוץ לקופת גמל להשקעה?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-relaxed max-w-xl">
                הזינו את הפרטים ונמצא לכם את הקופה המתאימה ביותר
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="savings"
                title="ייעוץ לקופת גמל להשקעה"
                description="מלאו את הפרטים ונמצא לכם את הקופה המתאימה ביותר"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GemelInvestment;
