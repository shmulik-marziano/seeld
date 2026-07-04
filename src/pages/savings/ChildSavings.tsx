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
import { BONE, PINE, BRONZE, SERIF, MONO } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

const tabTriggerClass =
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#171717]/40 border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

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

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "תוכנית חיסכון לכל ילד היא מתנה של המדינה לכל ילד שנולד בישראל. המדינה מפקידה מדי חודש סכום קבוע לטובת כל ילד, והכסף צובר תשואה עד שהילד מגיע לגיל 18. הסכום שמצטבר יכול להגיע לעשרות אלפי שקלים — קרן פתיחה משמעותית לתחילת החיים הבוגרים.",
        "מה שהרבה הורים לא יודעים הוא שהבחירה בגוף המנהל ובמסלול ההשקעה יכולה לעשות הבדל של אלפי שקלים. ברירת המחדל לא תמיד היא האופציה הטובה ביותר. בחירה מושכלת של מסלול עם תשואה גבוהה יותר יכולה להניב לילד שלכם סכום גדול משמעותית בגיל 18.",
      ],
    },
    {
      title: "מתי כדאי לפעול?",
      paragraphs: [
        "ההחלטה על הגוף המנהל ומסלול ההשקעה צריכה להתקבל מוקדם ככל האפשר — רצוי מיד עם לידת הילד. ככל שהבחירה מוקדמת יותר, כך הכסף נהנה מיותר שנים של צבירה ותשואה. אם טרם בחרתם — המדינה מפקידה את הכסף במסלול ברירת מחדל, שלא בהכרח מיטבי.",
        "גם אם הילדים שלכם כבר גדולים, כדאי לבדוק באיזה גוף ומסלול הכסף נמצא. מעבר בין גופים מנהלים הוא תהליך פשוט וחינמי, ויכול לשפר משמעותית את התשואה על החיסכון.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "ההורים צריכים לבחור בין שני אפשרויות: קופת גמל להשקעה (מנוהלת על ידי חברות ביטוח וגופי השקעה) או חשבון חיסכון בבנק. בדרך כלל, קופת גמל מניבה תשואה גבוהה יותר לאורך זמן, אם כי עם תנודתיות גבוהה יותר בטווח הקצר.",
        "ב-SEELD אנחנו עוזרים להורים לקבל החלטה מושכלת. נשווה עבורכם את כל הגופים המנהלים, נבדוק ביצועים היסטוריים ודמי ניהול, ונמליץ על המסלול שיביא את התשואה הטובה ביותר עבור ילדיכם.",
      ],
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

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">חיסכון לכל ילד</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            הבטיחו עתיד כלכלי לילדיכם
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9] mb-9">
            תוכנית חיסכון ממשלתית המבטיחה קרן פתיחה לכל ילד בישראל בהגיעו לגיל 18. בחרו את המסלול הנכון והגדילו את הסכום.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ייעוץ לחיסכון לכל ילד
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              איך זה עובד
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על חיסכון לכל ילד? היועץ מחובר</StatusPill>
          </button>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>יתרונות החיסכון לכל ילד</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "הפקדה ממשלתית", desc: "המדינה מפקידה כל חודש עבור כל ילד" },
                { title: "תשואה צוברת", desc: "הכסף צומח לאורך 18 שנה" },
                { title: "פטור ממס", desc: "המשיכה בגיל 18 פטורה ממס" },
                { title: "בחירה חופשית", desc: "בחרו את הגוף והמסלול הטובים ביותר" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/15 pt-5">
                  <span
                    className="text-[11px] tabular-nums tracking-[0.2em] block mb-4"
                    dir="ltr"
                    style={{ color: BRONZE, fontFamily: MONO }}
                  >
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

        {/* ══════ THE KNOWLEDGE — one tabbed section ══════ */}
        <section id="product-types" className="bg-white scroll-mt-24">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  איך זה עובד
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
                      <div className="space-y-4 text-[#171717]/60 leading-[1.9] text-base">
                        {article.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* — How it works — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>איך התוכנית עובדת</SectionTitle>
                  <p className="text-[#171717]/45 mt-2 text-base leading-relaxed max-w-xl">
                    כל מה שצריך לדעת על חיסכון לכל ילד
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
                        <AccordionContent className="text-[#171717]/50 leading-[1.85] pb-6 text-[14px]">
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
        <CompanyLogos variant="grid" />

        {/* ══════ ANALYSIS FORM ══════ */}
        <section id="analysis-form" className="scroll-mt-24" style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5 mb-10 text-center sm:text-right">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים לבחור את המסלול הטוב ביותר?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
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
