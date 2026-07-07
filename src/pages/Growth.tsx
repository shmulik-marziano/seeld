import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { articles, type Article } from "@/data/articles";
import { Link } from "react-router-dom";
import { BODY, DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_PEACH, TURQ } from "@/lib/brand";
import { SproutFigure } from "@/components/brand/Figures";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// The unified SEELD article card — .dna-concept tile, whole-tile link,
// .dna-hover quiet lift (Snap motion). Metadata sits under the title.
const ArticleTile = ({ article }: { article: Article }) => (
  <Link
    to={`/article/${article.id}`}
    className="dna-concept dna-hover group flex h-full flex-col overflow-hidden !p-0"
  >
    <div className="aspect-[16/10] overflow-hidden">
      <img src={article.image} alt="" loading="lazy" className="w-full h-full object-cover" />
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h3 className="text-[17px] leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
        {article.title}
      </h3>
      <div
        className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] tracking-[0.08em]"
        style={{ fontFamily: MONO, color: MUTED }}
      >
        <span>{article.category}</span>
        <span className="tabular-nums">
          {article.date} · <span dir="ltr">{article.readTime}</span>
        </span>
      </div>
      <p className="mt-2.5 text-[14px] leading-[1.7] line-clamp-2" style={{ color: BODY }}>{article.subtitle}</p>
      <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#1D2D3D]">
        קראו עוד
        <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
      </span>
    </div>
  </Link>
);

// DNA v3: the heading starts its block — no eyebrow, no ornamental index.
const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-12 sm:mb-14">
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
      {title}
    </h2>
    {lede && <p className="mt-4 text-base leading-[1.85] max-w-xl" style={{ color: MUTED }}>{lede}</p>}
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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero — white canvas, pastel circles; the coin sprout peeks from the corner */}
      <section className="dna-page">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 260, height: 260, top: -110, left: -90, backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
          />
          <div
            className="dna-circ"
            style={{ width: 200, height: 200, bottom: -100, right: "20%", backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20">
          <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
            <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: NAVY }}>חיסכון ופיננסים</span>
          </nav>
          <div className="mt-10 sm:mt-14 max-w-3xl">
            <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
              חיסכון ופיננסים
            </h1>
            <p className="mt-5 text-lg sm:text-xl leading-[1.8] max-w-2xl" style={{ color: MUTED }}>
              מדריכים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות, במקום אחד.
            </p>
          </div>
        </div>
        <SproutFigure className="absolute left-2 bottom-2 w-16 h-16 opacity-60 rotate-12 pointer-events-none" />
      </section>

      <main>
        {/* Expertise */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="תחומי ההתמחות שלנו" />
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {pillars.map((pillar, i) => (
                <ScrollReveal key={pillar.title} delay={i * 60}>
                  <div className="h-full">
                    <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                    <h3 className="text-[19px] mb-2.5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                      {pillar.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{pillar.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead
                title="מאמרים ומדריכים"
                lede="כל מה שצריך לדעת על חיסכון, השקעות ותכנון פיננסי"
              />
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsArticles.map((article) => (
                <ArticleTile key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>

        {/* Financial planning */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="תכנון פיננסי נכון" />
            </ScrollReveal>
            <div className="max-w-3xl space-y-5 text-base sm:text-[17px] leading-[1.9]" style={{ color: BODY }}>
              <p>
                תכנון פיננסי נכון הוא הבסיס לביטחון כלכלי. בין אם אתם רק מתחילים את הקריירה,
                מתכננים רכישת דירה או מתקרבים לגיל הפרישה, ייעוץ מקצועי יכול לעשות את ההבדל.
              </p>
              <p>
                צוות SEELD בונה איתכם תוכנית פיננסית מותאמת: ניצול הטבות המס הזמינות
                ובחירת אפיקי החיסכון וההשקעה שמתאימים לכם.
              </p>
            </div>
          </div>
        </section>

        {/* CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <div className="max-w-3xl">
                <h2
                  className="text-white leading-tight"
                  style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
                >
                  מוכנים לתכנן את העתיד?
                </h2>
                <p className="mt-3 text-base leading-[1.85] max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
                  הפגישה הראשונה ללא עלות וללא התחייבות.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-lg px-9 py-4 bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
                  >
                    קביעת פגישת ייעוץ
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Growth;
