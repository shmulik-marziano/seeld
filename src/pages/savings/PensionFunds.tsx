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

const PensionFunds = () => {
  const pensionTypes = [
    {
      title: "פנסיה מקיפה חדשה",
      description: "קרן פנסיה המשלבת חיסכון, ביטוח נכות וביטוח שאירים",
      features: ["תשואות מנוהלות", "כיסוי אובדן כושר עבודה", "פנסיית שאירים"],
    },
    {
      title: "פנסיה כללית",
      description: "מסלול חיסכון בלבד ללא רכיבים ביטוחיים",
      features: ["תשואות גבוהות יותר", "גמישות מקסימלית", "דמי ניהול נמוכים"],
    },
    {
      title: "פנסיה משלימה",
      description: "הפקדות נוספות מעבר לחובה לשיפור הפנסיה",
      features: ["הטבות מס", "הגדלת הקצבה", "חיסכון לטווח ארוך"],
    },
  ];

  const articles = [
    {
      title: "למה קרן פנסיה חשובה?",
      paragraphs: [
        "קרן הפנסיה היא עמוד התווך של הביטחון הפיננסי שלכם בפרישה. היא מבטיחה הכנסה חודשית קבועה לאחר שתפסיקו לעבוד, ומספקת גם כיסויים ביטוחיים חיוניים כמו ביטוח נכות (אובדן כושר עבודה) וביטוח שאירים להגנה על המשפחה.",
        "בישראל, הפקדה לפנסיה היא חובה על כל עובד שכיר מכוח צו הרחבה לפנסיה חובה. עם זאת, רבים אינם מודעים לכך שבחירה נכונה של קרן פנסיה ומסלול השקעה יכולה לשנות באופן דרמטי את גובה הקצבה החודשית בפרישה - הפרש שיכול להגיע למאות אלפי שקלים לאורך שנות הפנסיה.",
      ],
    },
    {
      title: "מתי כדאי לבדוק את קרן הפנסיה?",
      paragraphs: [
        "מומלץ לבדוק את קרן הפנסיה לפחות אחת לשנה. בדקו את דמי הניהול (שצריכים להיות הנמוכים ביותר האפשריים), את מסלול ההשקעה (שצריך להתאים לגיל ולרמת הסיכון שלכם), ואת ביצועי הקרן בהשוואה לקרנות מתחרות.",
        "שינויים בחיים כמו מעבר מקום עבודה, נישואים, לידת ילד או עלייה בשכר הם הזדמנויות מצוינות לבצע ניתוח פנסיוני מקיף. גם אם אתם מרוצים מהקרן הנוכחית, ייתכן שתוכלו להוריד את דמי הניהול ולחסוך עשרות אלפי שקלים לאורך השנים.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "דמי ניהול הם הגורם המשמעותי ביותר להפרש בחיסכון הפנסיוני לאורך זמן. הפרש של 0.5% בדמי ניהול יכול להסתכם במאות אלפי שקלים לאורך עשרות שנות חיסכון. בנוסף, חשוב לוודא שהכיסויים הביטוחיים (נכות ושאירים) מותאמים לצרכים שלכם ואינם מיותרים.",
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנו מבצעים ניתוח פנסיוני מקיף וחינמי, בודקים את דמי הניהול, מסלולי ההשקעה והכיסויים הביטוחיים, ומוודאים שכל שקל עובד בשבילכם.";

  const faqItems = [
    {
      q: "מה ההבדל בין פנסיה מקיפה לפנסיה כללית?",
      a: "פנסיה מקיפה כוללת חיסכון + כיסויים ביטוחיים (נכות ושאירים). פנסיה כללית היא חיסכון בלבד ללא כיסויים ביטוחיים, ולכן דמי הניהול בה נמוכים יותר והתשואה הפוטנציאלית גבוהה יותר. רוב העובדים צריכים פנסיה מקיפה.",
    },
    {
      q: "האם אפשר להעביר קרן פנסיה?",
      a: "כן, ניתן להעביר קרן פנסיה מחברה אחת לאחרת ללא עלות. התהליך פשוט ונמשך כ-10 ימי עסקים. חשוב לבדוק שהתנאים בקרן החדשה טובים יותר לפני המעבר.",
    },
    {
      q: "מהם דמי ניהול סבירים בקרן פנסיה?",
      a: "דמי ניהול ממוצעים הם כ-0.2%-0.5% מהצבירה ו-1.5%-4% מההפקדה. עם משא ומתן נכון ניתן להגיע לדמי ניהול נמוכים משמעותית, במיוחד אם יש לכם צבירה גבוהה.",
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
          {/* Breadcrumb */}
          <div className="mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[13px] text-[#5a6a78]">
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <Link to="/savings" className="hover:text-[#1D2D3D] transition-colors">חיסכון ופנסיה</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">קרנות פנסיה</span>
            </nav>
            <span
              className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium whitespace-nowrap text-[#5a6a78]"
              style={{ fontFamily: MONO }}
            >
              חיסכון ופנסיה
            </span>
          </div>

          <h1 className="dna-display leading-[1.12] mb-6 max-w-3xl" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
            קרנות פנסיה
          </h1>
          <p className="text-base sm:text-[17px] text-[#5a6a78] max-w-2xl leading-[1.9] mb-9">
            קרן פנסיה היא מכשיר חיסכון ארוך טווח שמבטיח לכם הכנסה חודשית קבועה לאחר הפרישה. עם הייעוץ שלנו, תבחרו את הקרן שמתאימה בדיוק לכם.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
            >
              ניתוח תיק פנסיוני חינם
            </a>
            <a
              href="#pension-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
            >
              סוגי פנסיה
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full dna-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על קרן פנסיה? היועץ מחובר</StatusPill>
          </button>

          {/* Turquoise stat + growth curve — the savings-page craft gesture */}
          <div className="mt-12 border-t pt-6 flex flex-wrap items-end justify-between gap-6" style={{ borderColor: LINE }}>
            <div>
              <div
                className="tabular-nums whitespace-nowrap"
                dir="ltr"
                style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "clamp(2.4rem, 4vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
              >
                0.5%
              </div>
              <div className="mt-1.5 text-[13px]" style={{ color: MUTED }}>הפרש דמי ניהול</div>
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
              <SectionTitle>יתרונות קרן הפנסיה</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "תשואות מנוהלות", desc: "הכספים מנוהלים על ידי מנהלי השקעות מקצועיים" },
                { title: "כיסויים ביטוחיים", desc: "פנסיית נכות ושאירים להגנה על המשפחה" },
                { title: "הטבות מס", desc: "זיכוי מס והפחתת הכנסה חייבת במס" },
                { title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לבחירת המסלול המתאים" },
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
        <section id="pension-types" className="border-t scroll-mt-24" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <Tabs defaultValue="guide" dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto scrollbar-hide">
                <TabsTrigger value="guide" className={tabTriggerClass}>
                  המדריך
                </TabsTrigger>
                <TabsTrigger value="types" className={tabTriggerClass}>
                  סוגי הקרנות
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

              {/* — Types — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>סוגי קרנות פנסיה</SectionTitle>
                  <p className="text-[#5a6a78] mt-2 text-base leading-relaxed max-w-xl">
                    הכירו את האפשרויות השונות ובחרו את המסלול המתאים לכם
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {pensionTypes.map((type, idx) => (
                    <div key={idx} className="dna-concept">
                      <h3 className="text-[17px] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {type.title}
                      </h3>
                      <p className="text-[#3a4c5a] text-[14px] leading-[1.8] mb-4">{type.description}</p>
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

                {/* Average management fees — from the FAQ's own figures */}
                <div className="mt-10 max-w-md overflow-x-auto">
                  <table className="dna-data">
                    <thead>
                      <tr>
                        <th>רכיב</th>
                        <th>דמי ניהול ממוצעים</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>מהצבירה</td>
                        <td className="num">0.2%–0.5%</td>
                      </tr>
                      <tr>
                        <td>מההפקדה</td>
                        <td className="num">1.5%–4%</td>
                      </tr>
                    </tbody>
                  </table>
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
                רוצים ניתוח פנסיוני חינמי?
              </h2>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
                הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ניתוח תיק פנסיוני חינם"
                description="הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionFunds;
