import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import ScrollReveal from "@/components/ScrollReveal";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";
import { MONO } from "@/lib/brand";
import { SproutFigure } from "@/components/brand/Figures";

const HEEBO = "'Heebo', sans-serif";
// Captions on the warm paper tiles stay at #5c5c5c minimum (AA on paper).
const PAPER_MUTED = "#5c5c5c";

const SectionHead = ({ index, title, lede }: { index: string; title: string; lede?: string }) => (
  <div className="border-t border-[#171717]/20 pt-6 mb-12 sm:mb-14">
    <div className="flex items-baseline gap-6 sm:gap-10">
      <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: PAPER_MUTED, fontFamily: MONO }}>
        {index}
      </span>
      <div>
        <h2
          className="text-[#171717] leading-tight"
          style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
        {lede && <p className="mt-3 text-base text-[#5c5c5c] leading-[1.85] max-w-xl">{lede}</p>}
      </div>
    </div>
  </div>
);

const Growth = () => {
  const savingsArticles = articles.filter(article =>
    article.category.includes("חיסכון") ||
    article.category.includes("השקעות") ||
    article.category.includes("תקציב")
  );

  const pillars = [
    { title: "חיסכון חכם", description: "אסטרטגיות חיסכון מותאמות אישית לכל שלב בחיים" },
    { title: "השקעות", description: "בחירת מסלולים ומעקב תשואות" },
    { title: "תכנון מס", description: "ניצול מרבי של הטבות מס וחיסכון בתשלומים" },
    { title: "יעדים פיננסיים", description: "הגדרת יעדים ובחינה מחדש אחת לשנה" },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero — paper tile; the coin sprout peeks from the corner */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-14 sm:pb-20 relative z-10">
            <div className="border-t border-[#171717]/20 pt-4">
              <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px] text-[#5c5c5c]">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span aria-hidden="true">/</span>
                <span className="text-[#171717]">חיסכון ופיננסים</span>
              </nav>
            </div>
            <div className="mt-12 sm:mt-16 max-w-3xl">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
                SAVINGS · FINANCE
              </span>
              <h1
                className="mt-4 text-[#171717] leading-[1.1]"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", letterSpacing: "-0.03em" }}
              >
                חיסכון ופיננסים
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-[#4d4d4d] leading-[1.8] max-w-2xl">
                מדריכים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות, במקום אחד.
              </p>
            </div>
          </div>
          <SproutFigure className="absolute -left-3 -bottom-4 w-16 h-16 opacity-70 rotate-12 pointer-events-none" />
        </div>
      </section>

      <main>
        {/* 01 — Expertise */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="01" title="תחומי ההתמחות שלנו" />
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {pillars.map((pillar, i) => (
                <ScrollReveal key={pillar.title} delay={i * 60}>
                  <div className="border-t border-[#171717]/15 pt-5 h-full">
                    <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                      {pillar.title}
                    </h3>
                    <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">{pillar.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div></div>
        </section>

        {/* 02 — Articles */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead
                index="02"
                title="מאמרים ומדריכים"
                lede="כל מה שצריך לדעת על חיסכון, השקעות ותכנון פיננסי"
              />
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsArticles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          </div></div>
        </section>

        {/* 03 — Financial planning */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="03" title="תכנון פיננסי נכון" />
            </ScrollReveal>
            <div className="max-w-3xl space-y-5 text-base sm:text-[17px] text-[#4d4d4d] leading-[1.9]">
              <p>
                תכנון פיננסי נכון הוא הבסיס לביטחון כלכלי. בין אם אתם רק מתחילים את הקריירה,
                מתכננים רכישת דירה או מתקרבים לגיל הפרישה, ייעוץ מקצועי יכול לעשות את ההבדל.
              </p>
              <p>
                צוות SEELD בונה איתכם תוכנית פיננסית מותאמת: ניצול הטבות המס הזמינות
                ובחירת אפיקי החיסכון וההשקעה שמתאימים לכם.
              </p>
            </div>
          </div></div>
        </section>

        {/* CTA — the one ink tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
            <ScrollReveal>
              <div className="border-t border-white/20 pt-6 max-w-3xl">
                <h2
                  className="text-[#fafafa] leading-tight"
                  style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
                >
                  מוכנים לתכנן את העתיד?
                </h2>
                <p className="mt-3 text-base text-[#fafafa]/50 leading-[1.85] max-w-xl">
                  הפגישה הראשונה ללא עלות וללא התחייבות.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-md px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
                  >
                    קביעת פגישת ייעוץ
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Growth;
