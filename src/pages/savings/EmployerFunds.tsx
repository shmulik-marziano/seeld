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
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TURQ } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { DrawSpark } from "@/components/brand/Strokes";

const tabTriggerClass =
  "rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-base font-medium text-[#5a6a78] hover:bg-[#E1EAF1]/35 hover:text-[#1D2D3D] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)" }}>
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
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו מתמחים בבניית הסדרים פנסיוניים ארגוניים. ננהל עבורכם משא ומתן מול כל הגופים המנהלים, נשיג דמי ניהול מופחתים, וניתן ליווי מקצועי שוטף למחלקת משאבי האנוש ולעובדים.";

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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* HERO — white DNA canvas, the page's single pastel-circle backdrop */}
      <section className="dna-page">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, bottom: -120, left: "30%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          <div className="mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[13px] text-[#5a6a78]">
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <Link to="/savings" className="hover:text-[#1D2D3D] transition-colors">חיסכון ופנסיה</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">קופות מרכזיות למעסיק</span>
            </nav>
            <span
              className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium whitespace-nowrap text-[#5a6a78]"
              style={{ fontFamily: MONO }}
            >
              חיסכון ופנסיה
            </span>
          </div>

          <h1 className="dna-display leading-[1.12] mb-6 max-w-3xl" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
            פתרונות פנסיוניים ארגוניים
          </h1>
          <p className="text-base sm:text-[17px] text-[#5a6a78] max-w-2xl leading-[1.9] mb-9">
            פתרונות פנסיוניים מותאמים לארגונים ולמעסיקים: דמי ניהול מוזלים, ניהול מרכזי וליווי מקצועי.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
            >
              ייעוץ לקופות מרכזיות
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
            >
              יתרונות למעסיק
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full dna-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קופות מעסיקים? היועץ מחובר</StatusPill>
          </button>

          {/* Turquoise stat + growth curve — the savings-page craft gesture */}
          <div className="mt-12 border-t pt-6 flex flex-wrap items-end justify-between gap-6" style={{ borderColor: LINE }}>
            <div>
              <div
                className="tabular-nums whitespace-nowrap"
                dir="ltr"
                style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(2.4rem, 4vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
              >
                -50%
              </div>
              <div className="mt-1.5 text-[13px]" style={{ color: MUTED }}>דמי ניהול בהסדר ארגוני</div>
            </div>
            <DrawSpark color={TURQ} className="hidden sm:block w-44 md:w-60" height={40} />
          </div>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="mb-10">
              <SectionTitle>יתרונות הסדר ארגוני</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "ניהול קולקטיבי", desc: "ניהול מרוכז של זכויות כל העובדים" },
                { title: "דמי ניהול מוזלים", desc: "כוח מיקוח ארגוני לתנאים טובים" },
                { title: "שירות ארגוני", desc: "ליווי מקצועי למשאבי אנוש" },
                { title: "ביטחון לעובדים", desc: "הבטחת זכויות פנסיוניות מיטביות" },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                  <h3 className="text-[19px] mb-2.5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                    {item.title}
                  </h3>
                  <p className="text-[14.5px] text-[#3a4c5a] leading-[1.8]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ THE KNOWLEDGE — one tabbed section ══════ */}
        <section id="product-types" className="border-t scroll-mt-24" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto scrollbar-hide">
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
                      <div className="mb-6">
                        <SectionTitle>{article.title}</SectionTitle>
                      </div>
                      <div className="space-y-4 text-[#3a4c5a] leading-[1.9] text-base">
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

              {/* — Solutions — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי פתרונות למעסיקים</SectionTitle>
                  <p className="text-[#5a6a78] mt-2 text-base leading-relaxed max-w-xl">
                    הכירו את האפשרויות לניהול פנסיוני ארגוני
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="dna-concept">
                      <h3 className="text-[17px] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {type.title}
                      </h3>
                      <p className="text-[#3a4c5a] text-[14px] leading-[1.8] mb-3.5">{type.description}</p>
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
                        className="border-b border-[#E7EDF1] rounded-none px-0"
                      >
                        <AccordionTrigger className="text-start text-base font-medium text-[#1D2D3D] hover:no-underline py-5 px-3 -mx-3 rounded-md hover:bg-[#E1EAF1]/35 transition-colors duration-150">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[#3a4c5a] leading-[1.85] pb-6 text-[14px]">
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

        {/* ══════ ANALYSIS FORM — navy band ══════ */}
        <section id="analysis-form" className="scroll-mt-24" style={{ backgroundColor: NAVY }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-10 text-center sm:text-right">
              <h2
                className="text-white leading-tight mb-3"
                style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', letterSpacing: '-0.5px' }}
              >
                רוצים הסדר פנסיוני ארגוני?
              </h2>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EmployerFunds;
