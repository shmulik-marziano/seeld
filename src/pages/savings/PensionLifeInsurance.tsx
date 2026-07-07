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
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TINT_GOLD, TURQ } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
// Repeating umbrella line-art — navy ink at low opacity on the gold tint (canon: HeroSection)
const UMBRELLA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231D2D3D' stroke-width='2' stroke-linecap='round' opacity='0.14'%3E%3Cpath d='M14 26 C14 17 20 13 28 13 C36 13 42 17 42 26'/%3E%3Cpath d='M14 26 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0'/%3E%3Cpath d='M28 13 v-3'/%3E%3Cpath d='M28 26 v12 c0 4 6 4 6 1'/%3E%3C/g%3E%3C/svg%3E")`;


const tabTriggerClass =
  "rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-base font-medium text-[#5a6a78] hover:bg-[#E1EAF1]/35 hover:text-[#1D2D3D] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)" }}>
    {children}
  </h2>
);

const PensionLifeInsurance = () => {
  const productTypes = [
    {
      title: "הגנה מלאה",
      description: "ביטוח חיים שמגן על המשפחה במקרה של אובדן מפרנס",
      features: ["ביטוח חיים (ריסק)", "אובדן כושר עבודה", "פטור מפרמיות"],
    },
    {
      title: "חיסכון מצטבר",
      description: "צבירת כספים לפנסיה במקביל לכיסוי ביטוחי",
      features: ["מרכיב חיסכון", "תשואה מנוהלת", "הטבות מס"],
    },
    {
      title: "גמישות מלאה",
      description: "התאמת סכומי הביטוח והחיסכון לצרכים המשתנים",
      features: ["כיסויים מותאמים", "שינוי מסלולים", "עדכון תקופתי"],
    },
  ];

  const articles = [
    {
      title: "למה זה חשוב?",
      paragraphs: [
        "ביטוח חיים פנסיוני (ביטוח מנהלים) הוא מוצר ייחודי שמשלב חיסכון לפנסיה עם כיסוי ביטוחי מקיף. בניגוד לקרן פנסיה שמנוהלת בצורה אחידה, ביטוח מנהלים מאפשר גמישות רבה יותר בהתאמת הכיסויים הביטוחיים לצרכים הספציפיים שלכם.",
        "המוצר כולל מרכיב חיסכון שצובר כספים לפנסיה, לצד כיסויים ביטוחיים כמו ביטוח חיים (ריסק), אובדן כושר עבודה, ופטור מתשלום פרמיות. זוהי תכנית שמגנה על המשפחה בהווה ובונה עתיד כלכלי בטוח.",
      ],
    },
    {
      title: "מתי כדאי לרכוש?",
      paragraphs: [
        "ביטוח מנהלים רלוונטי במיוחד למי שרוצה שליטה מלאה על הכיסויים הביטוחיים שלו. הוא מתאים לשכירים שרוצים כיסוי ביטוחי מותאם, לעצמאים שצריכים גמישות, ולבעלי הכנסה גבוהה שרוצים למקסם את החיסכון הפנסיוני.",
        "אם יש לכם כבר ביטוח מנהלים ותיק, חשוב לבדוק אותו מעת לעת, פוליסות ישנות לרוב כוללות דמי ניהול גבוהים ותנאים פחות טובים. ייתכן שכדאי להעביר את הפוליסה או לעדכן אותה.",
      ],
    },
    {
      title: "מה חשוב לדעת?",
      paragraphs: [
        "בבחירת ביטוח מנהלים, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי ההשקעה של החברה, לתנאי הכיסוי הביטוחי (במיוחד הגדרת אובדן כושר עבודה), ולגמישות בשינוי מסלולים. פוליסות שונות מציעות תנאים שונים מאוד.",
      ],
    },
  ];

  const bottomLine =
    "ב-SEELD אנחנו מבצעים ניתוח מעמיק של ביטוחי המנהלים שלכם, משווים מול כל החברות בשוק, ומוודאים שאתם מקבלים את התנאים הטובים ביותר, הן בחלק החיסכוני והן בחלק הביטוחי.";

  const faqItems = [
    {
      q: "מה ההבדל בין ביטוח מנהלים לקרן פנסיה?",
      a: "קרן פנסיה מנוהלת בצורה קולקטיבית עם תנאים אחידים, בעוד ביטוח מנהלים מאפשר התאמה אישית של הכיסויים. קרן פנסיה כוללת ביטוח אובדן כושר עבודה ושאירים מובנה, בעוד בביטוח מנהלים הכיסויים נרכשים בנפרד.",
    },
    {
      q: "האם אפשר להעביר ביטוח מנהלים לקרן פנסיה?",
      a: "כן, ניתן לבצע ניוד בין מוצרים פנסיוניים. עם זאת, חשוב לבדוק את ההשלכות לפני המעבר, למשל, אובדן תנאים ביטוחיים ייחודיים שקיימים בביטוח המנהלים הנוכחי.",
    },
    {
      q: "מה קורה עם הכסף בגיל הפרישה?",
      a: "בגיל הפרישה ניתן לקבל את הכספים כקצבה חודשית (פטורה ממס עד תקרה מסוימת), כסכום חד-פעמי (חייב במס), או שילוב של שניהם. חשוב לתכנן מראש את אסטרטגיית המשיכה.",
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
              <span className="font-medium text-[#1D2D3D]">ביטוח חיים פנסיוני</span>
            </nav>
            <span
              className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium whitespace-nowrap text-[#5a6a78]"
              style={{ fontFamily: MONO }}
            >
              חיסכון ופנסיה
            </span>
          </div>

          <h1 className="dna-display leading-[1.12] mb-6 max-w-3xl" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
            חיסכון פנסיוני עם הגנה מלאה
          </h1>
          <p className="text-base sm:text-[17px] text-[#5a6a78] max-w-2xl leading-[1.9] mb-9">
            שילוב בין חיסכון פנסיוני לביטוח חיים המעניק הגנה מקיפה למשפחה: ביטוח מנהלים עם כיסויים מותאמים.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
            >
              ניתוח ביטוח מנהלים חינם
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
            >
              סוגי כיסויים
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full dna-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על ביטוח מנהלים? היועץ מחובר</StatusPill>
          </button>

          {/* Umbrella line-art strip — the protection-page craft gesture */}
          <div
            className="mt-12 h-16 rounded-lg"
            aria-hidden="true"
            style={{ backgroundColor: TINT_GOLD, backgroundImage: UMBRELLA_PATTERN, backgroundSize: "56px 56px" }}
          />
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="mb-10">
              <SectionTitle>יתרונות ביטוח מנהלים</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "הגנה מקיפה", desc: "ביטוח חיים, נכות ופטור מפרמיות" },
                { title: "חיסכון לפנסיה", desc: "צבירת כספים מנוהלת לעתיד" },
                { title: "גמישות", desc: "כיסויים מותאמים לצרכים שלכם" },
                { title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לאורך הדרך" },
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
                  מרכיבי הפוליסה
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

              {/* — Components — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>מרכיבי ביטוח מנהלים</SectionTitle>
                  <p className="text-[#5a6a78] mt-2 text-base leading-relaxed max-w-xl">
                    חיסכון וביטוח במוצר אחד
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
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
                רוצים ניתוח ביטוח מנהלים חינם?
              </h2>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
                הזינו את הפרטים ונבדוק אם הפוליסה שלכם מספקת את המיטב
              </p>
            </div>
            <div className="max-w-2xl">
              <PensionAnalysisForm
                focusArea="pension"
                title="ניתוח ביטוח חיים פנסיוני"
                description="מלאו את הפרטים ונבדוק אם הפוליסה שלכם מספקת את המיטב"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionLifeInsurance;
