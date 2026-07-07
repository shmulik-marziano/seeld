import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { articles, type Article } from "@/data/articles";
import { Link } from "react-router-dom";
import { MONO, CARD_SHADOW } from "@/lib/brand";
import { ShieldFigure } from "@/components/brand/Figures";

const HEEBO = "'Heebo', sans-serif";
// Captions on the warm paper tiles stay at #5c5c5c minimum (AA on paper).
const PAPER_MUTED = "#5c5c5c";

// The homogeneous SEELD article card — white tile on the paper panel.
// Whole-tile link, so it takes the .bento-hover quiet lift (Snap motion).
const ArticleTile = ({ article }: { article: Article }) => (
  <Link
    to={`/article/${article.id}`}
    className="bento-hover group flex h-full flex-col overflow-hidden rounded-lg bg-white"
    style={{ boxShadow: CARD_SHADOW }}
  >
    <div className="aspect-[16/10] overflow-hidden">
      <img src={article.image} alt="" loading="lazy" className="w-full h-full object-cover" />
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div
        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px] tracking-[0.08em] text-[#5c5c5c]"
        style={{ fontFamily: MONO }}
      >
        <span>{article.category}</span>
        <span className="tabular-nums">
          {article.date} · <span dir="ltr">{article.readTime}</span>
        </span>
      </div>
      <h3 className="mt-3 text-lg text-[#171717] leading-snug" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
        {article.title}
      </h3>
      <p className="mt-2 text-[14px] text-[#4d4d4d] leading-[1.7] line-clamp-2">{article.subtitle}</p>
      <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#171717]">
        קראו עוד
        <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
      </span>
    </div>
  </Link>
);

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

const Wellness = () => {
  const healthInsuranceArticles = articles.filter(article =>
    article.category.includes("ביטוח בריאות") ||
    article.category.includes("ביטוח חיים")
  );

  const services = [
    { title: "ביטוח בריאות פרטי", description: "כיסוי רפואי מקיף לטיפולים, ניתוחים ותרופות" },
    { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה, לפי מה שבאמת צריך" },
    { title: "ביטוח סיעודי", description: "כיסוי מקיף למקרה של צורך בטיפול סיעודי" },
    { title: "ליווי מקצועי", description: "צוות יועצים מנוסה לבחירת הפוליסה המתאימה" },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero — paper tile; the shield peeks from the corner */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-14 sm:pb-20 relative z-10">
            <div className="border-t border-[#171717]/20 pt-4">
              <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px] text-[#5c5c5c]">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span aria-hidden="true">/</span>
                <span className="text-[#171717]">שירותים ופעולות</span>
              </nav>
            </div>
            <div className="mt-12 sm:mt-16 max-w-3xl">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
                HEALTH · LIFE
              </span>
              <h1
                className="mt-4 text-[#171717] leading-[1.1]"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", letterSpacing: "-0.03em" }}
              >
                שירותים ופעולות
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-[#4d4d4d] leading-[1.8] max-w-2xl">
                ביטוח בריאות, חיים וסיעוד: המידע, הכלים וההשוואות, במקום אחד.
              </p>
            </div>
          </div>
          <ShieldFigure className="absolute -left-3 -bottom-4 w-16 h-16 opacity-70 rotate-12 pointer-events-none" />
        </div>
      </section>

      <main>
        {/* 01 — Services */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="01" title="השירותים שלנו" />
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {services.map((service, i) => (
                <ScrollReveal key={service.title} delay={i * 60}>
                  <div className="border-t border-[#171717]/15 pt-5 h-full">
                    <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                      {service.title}
                    </h3>
                    <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">{service.description}</p>
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
                lede="כל מה שצריך לדעת על ביטוח בריאות וביטוח חיים"
              />
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {healthInsuranceArticles.map((article) => (
                <ArticleTile key={article.id} article={article} />
              ))}
            </div>
          </div></div>
        </section>

        {/* 03 — Why SEELD */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="03" title="למה SEELD?" />
            </ScrollReveal>
            <div className="max-w-3xl space-y-5 text-base sm:text-[17px] text-[#4d4d4d] leading-[1.9]">
              <p>
                לכל לקוח ב-SEELD יש יועץ אחד שמכיר את התיק ומלווה אותו,
                מהייעוץ הראשוני ועד הטיפול בתביעות.
              </p>
              <p>
                ביטוח בריאות, חיים, רכב או דירה: משווים בין כל החברות בשוק
                וחוזרים אליכם עם המלצה מנומקת, ללא עלות.
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
                  רוצים לשמוע עוד?
                </h2>
                <p className="mt-3 text-base text-[#fafafa]/50 leading-[1.85] max-w-xl">
                  השאירו פרטים ונחזור אליכם עם השוואה מסודרת.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-md px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
                  >
                    צרו קשר
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

export default Wellness;
