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
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5c5c5c] hover:text-[#171717] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

const EmployerFunds = () => {
  const productTypes = [
    {
      title: "ניהול קולקטיבי",
      description: "ניהול מרוכז של זכויות העובדים בקופה אחת",
      features: ["ניהול מרכזי", "כוח מיקוח חזק", "יעילות תפעולית"],
    },
    {
      title: "חיסכון בעלויות",
      description: "דמי ניהול מופחתים הודות לכוח המיקוח של הארגון",
      features: ["דמי ניהול מוזלים", "חיסכון לעובדים", "תנאים מועדפים"],
    },
    {
      title: "שירות ארגוני",
      description: "ליווי מקצועי למחלקת משאבי אנוש ולעובדים",
      features: ["הדרכות לעובדים", "תמיכה שוטפת", "דוחות תקופתיים"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "קופה מרכזית לפיצויים היא כלי חיוני לכל מעסיק בישראל. היא מאפשרת למעסיק להפריש כספי פיצויים לקופה חיצונית באופן שוטף, במקום לשלם אותם כסכום חד-פעמי בעת פיטורין. כך המעסיק מפזר את העלות לאורך זמן ומגן על עצמו מפני הוצאות גדולות ובלתי צפויות.",
        "מעבר לחובה החוקית, ניהול נכון של הקופות המרכזיות יכול לחסוך לארגון סכומים משמעותיים בדמי ניהול ולהבטיח תשואות טובות יותר על כספי העובדים. ארגון שמנהל את הנושא בצורה מקצועית נהנה מיחסי עבודה טובים יותר ומשביעות רצון גבוהה של העובדים.",
      ],
    },
    {
      title: "מתי כדאי לפעול?",
      paragraphs: [
        "כל מעסיק חייב על פי חוק להפריש כספים פנסיוניים לעובדיו מהיום הראשון להעסקה. קופה מרכזית למעסיק רלוונטית במיוחד לארגונים עם מספר עובדים, שיכולים ליהנות מכוח מיקוח לדמי ניהול מוזלים.",
        "מומלץ לבצע בדיקה תקופתית של ההסדר הפנסיוני הארגוני, לפחות אחת לשנה. שינויים בגודל הארגון, בתנאי השוק, או בביצועי הגופים המנהלים, יכולים להצדיק מעבר לקופה אחרת עם תנאים טובים יותר.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "בבחירת הסדר פנסיוני ארגוני, יש לשקול מספר גורמים: דמי הניהול שנגבים (ככל שהארגון גדול יותר, כך כוח המיקוח חזק יותר), ביצועי ההשקעה של הגוף המנהל, השירות למחלקת משאבי אנוש ולעובדים, ומגוון מסלולי ההשקעה הזמינים.",
        "ב-SEELD אנחנו מתמחים בבניית הסדרים פנסיוניים ארגוניים. ננהל עבורכם משא ומתן מול כל הגופים המנהלים, נשיג דמי ניהול מופחתים, וניתן ליווי מקצועי שוטף למחלקת משאבי האנוש ולעובדים.",
      ],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין קופה מרכזית לפיצויים לקופה אישית?",
      a: "קופה מרכזית מנוהלת ברמת הארגון ומאפשרת דמי ניהול מוזלים הודות לכוח המיקוח הקולקטיבי. קופה אישית מנוהלת ברמת העובד הבודד. בשני המקרים, הכספים שייכים לעובד.",
    },
    {
      q: "האם העובד יכול לבחור לאן להפריש?",
      a: "על פי חוק, לעובד יש את הזכות לבחור את הגוף הפנסיוני שלו. עם זאת, מעסיקים רבים מציעים הסדר ארגוני עם תנאים מועדפים שמשתלמים יותר לעובד.",
    },
    {
      q: "כמה אפשר לחסוך בדמי ניהול?",
      a: "בהסדר ארגוני, דמי הניהול יכולים להיות נמוכים משמעותית, לעתים 50% פחות מדמי הניהול הסטנדרטיים. ההבדל הזה מצטבר לסכומים גדולים לאורך שנות העבודה של כל עובד.",
    },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">קופות מרכזיות למעסיק</span>
            </nav>
            <div className="hidden sm:flex items-center gap-4">
              <DrawSpark color={CHIP_GREEN} className="w-40" height={28} />
              <span className="text-[11px] tracking-[0.22em] font-medium whitespace-nowrap" style={{ color: "#5c5c5c" }}>
                חיסכון ופנסיה
              </span>
            </div>
          </div>

          {/* Market-mono eyebrow — the one shared gesture across all savings pages */}
          <div
            className="mb-5 flex items-center gap-2.5 text-[11px] sm:text-[12px] font-semibold tracking-[0.18em] text-[#171717] tabular-nums"
            style={{ fontFamily: MONO }}
          >
            <span>קופה מרכזית למעסיק</span>
            <span className="text-[#171717]/35 select-none" aria-hidden="true">·</span>
            <span style={{ color: "#5c5c5c" }}>דמי ניהול מוזלים</span>
          </div>
          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            פתרונות פנסיוניים ארגוניים
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            פתרונות פנסיוניים מותאמים לארגונים ולמעסיקים: דמי ניהול מוזלים, ניהול מרכזי וליווי מקצועי.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] bento-hover min-h-[52px]"
            >
              ייעוץ לקופות מרכזיות
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              יתרונות למעסיק
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full bento-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קופות מעסיקים? היועץ מחובר</StatusPill>
          </button>
        </div>
        {/* Bento play: the page's key number on a small orange tile */}
        <div
          className="bento-panel-orange absolute top-28 left-8 hidden lg:flex flex-col items-center justify-center px-6 py-4 -rotate-2 pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[24px] font-bold text-[#171717] tabular-nums leading-none" style={{ fontFamily: MONO }} dir="ltr">
            -50%
          </span>
          <span className="mt-1.5 text-[11px] font-semibold text-[#171717]/80 whitespace-nowrap">
            דמי ניהול בהסדר ארגוני
          </span>
        </div>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>יתרונות הסדר ארגוני</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "ניהול קולקטיבי", desc: "ניהול מרוכז של זכויות כל העובדים" },
                { title: "דמי ניהול מוזלים", desc: "כוח מיקוח ארגוני לתנאים טובים" },
                { title: "שירות ארגוני", desc: "ליווי מקצועי למשאבי אנוש" },
                { title: "ביטחון לעובדים", desc: "הבטחת זכויות פנסיוניות מיטביות" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/15 pt-5">
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
                  הפתרונות למעסיק
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

              {/* — Solutions — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי פתרונות למעסיקים</SectionTitle>
                  <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">
                    הכירו את האפשרויות לניהול פנסיוני ארגוני
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="border-t border-[#171717]/10 pt-4">
                      <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {type.title}
                      </h3>
                      <p className="text-[#5c5c5c] text-[14px] leading-[1.8] mb-3.5">{type.description}</p>
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
                        <AccordionTrigger className="text-start text-base font-medium text-[#171717] hover:no-underline py-5 px-3 -mx-3 rounded-md hover:bg-[#171717]/5 transition-colors duration-150">
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
                רוצים הסדר פנסיוני ארגוני?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
                מלאו פרטי הארגון ונחזור אליכם עם הצעה מותאמת
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לקופות מרכזיות"
                description="מלאו פרטי הארגון ונחזור אליכם עם הצעה מותאמת"
              />
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EmployerFunds;
