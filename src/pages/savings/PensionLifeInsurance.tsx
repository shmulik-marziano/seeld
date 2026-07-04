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
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#6e6e6e] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
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
        "ב-SEELD אנחנו מבצעים ניתוח מעמיק של ביטוחי המנהלים שלכם, משווים מול כל החברות בשוק, ומוודאים שאתם מקבלים את התנאים הטובים ביותר, הן בחלק החיסכוני והן בחלק הביטוחי.",
      ],
    },
  ];

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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#6e6e6e]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/savings" className="hover:text-[#171717] transition-colors">חיסכון ופנסיה</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">ביטוח חיים פנסיוני</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            חיסכון פנסיוני עם <span style={{ color: BRONZE }}>הגנה מלאה</span>
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            שילוב בין חיסכון פנסיוני לביטוח חיים המעניק הגנה מקיפה למשפחה: ביטוח מנהלים עם כיסויים מותאמים.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#analysis-form"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              ניתוח ביטוח מנהלים חינם
            </a>
            <a
              href="#product-types"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              סוגי כיסויים
              <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על ביטוח מנהלים? היועץ מחובר</StatusPill>
          </button>
        </div>
      </section>

      <main>
        {/* ══════ BENEFITS ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <SectionTitle>יתרונות ביטוח מנהלים</SectionTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "הגנה מקיפה", desc: "ביטוח חיים, נכות ופטור מפרמיות" },
                { title: "חיסכון לפנסיה", desc: "צבירת כספים מנוהלת לעתיד" },
                { title: "גמישות", desc: "כיסויים מותאמים לצרכים שלכם" },
                { title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לאורך הדרך" },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#171717]/10 pt-4">
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
                  <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">{item.desc}</p>
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

              {/* — Components — */}
              <TabsContent value="types" className="mt-0">
                <div className="mb-10">
                  <SectionTitle>מרכיבי ביטוח מנהלים</SectionTitle>
                  <p className="text-[#6e6e6e] mt-2 text-base leading-relaxed max-w-xl">
                    חיסכון וביטוח במוצר אחד
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {productTypes.map((type, idx) => (
                    <div key={idx} className="border-t border-[#171717]/10 pt-4">
                      <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {type.title}
                      </h3>
                      <p className="text-[#5c5c5c] text-[14px] leading-[1.8] mb-4">{type.description}</p>
                      <ul className="space-y-2">
                        {type.features.map((feature, fIdx) => (
                          <li key={fIdx} className="text-[#5c5c5c] text-[14px] leading-relaxed flex gap-2.5">
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
                        <AccordionContent className="text-[#5c5c5c] leading-[1.85] pb-6 text-[14px]">
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
                רוצים ניתוח ביטוח מנהלים חינם?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
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
