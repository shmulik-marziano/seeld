import { useParams, Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { getArticleById, getRelatedArticles, type Article as ArticleData } from "@/data/articles";
import { Facebook, Twitter, Linkedin, Link2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { BODY, DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_PEACH } from "@/lib/brand";

// SEELD DNA v3: white canvas, navy display headings, hairline rules (STYLESEED.md)

// Share icon buttons — quiet white squares with a hairline border
const shareBtnClass =
  "w-10 h-10 rounded-md bg-white border border-[#E7EDF1] text-[#1D2D3D] hover:bg-[#F4F8F7] transition-colors flex items-center justify-center";

// The unified SEELD article card — .dna-concept tile, whole-tile link,
// .dna-hover quiet lift (Snap motion). Metadata sits under the title.
const ArticleTile = ({ article }: { article: ArticleData }) => (
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

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  if (!article) {
    return <Navigate to="/404" replace />;
  }

  const relatedArticles = getRelatedArticles(article.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("הקישור הועתק.");
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* ══════ THE READING SURFACE — white canvas, pastel circles ══════ */}
        <section className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 260, height: 260, top: -110, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 200, height: 200, top: "38%", right: -110, backgroundColor: PASTEL_PEACH, opacity: 0.5 }}
            />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            {/* Back navigation */}
            <div className="mb-10">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm hover:text-[#1D2D3D] transition-colors"
                style={{ color: MUTED }}
              >
                <ArrowRight className="w-4 h-4" />
                חזרה למאמרים
              </a>
            </div>

            <h1 className="dna-display leading-[1.15] mb-4" style={{ fontSize: "clamp(32px, 5vw, 50px)" }}>
              {article.title}
            </h1>

            {/* Metadata under the title — mono, muted (category, date, read time) */}
            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6 text-[12px] tracking-[0.08em]"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              <span>{article.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{article.date}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                <span dir="ltr">{article.readTime}</span> קריאה
              </span>
            </div>

            <p className="text-lg sm:text-xl leading-[1.8] mb-10 max-w-2xl" style={{ color: MUTED }}>
              {article.subtitle}
            </p>

            {/* Hero image — framed by a hairline */}
            <div className="rounded-xl overflow-hidden mb-10 border" style={{ borderColor: LINE }}>
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-[260px] sm:h-[380px] md:h-[460px] object-cover"
              />
            </div>

            {/* Author + share */}
            <div className="flex items-center justify-between border-t border-b py-6 mb-12" style={{ borderColor: LINE }}>
              <div className="flex items-center gap-4">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-14 h-14 rounded-full object-cover border"
                  style={{ borderColor: LINE }}
                />
                <div>
                  <p className="text-[15px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                    {article.author.name}
                  </p>
                  <p className="text-sm" style={{ color: MUTED }}>{article.author.bio}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className={shareBtnClass}
                  aria-label="העתק קישור"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  aria-label="שתף בטוויטר"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  aria-label="שתף בפייסבוק"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  aria-label="שתף בלינקדאין"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Article content — reading measure capped at ~65ch */}
            <div className="mb-16" style={{ maxWidth: "65ch" }}>
              <p className="text-base sm:text-lg leading-[1.9] mb-10" style={{ color: BODY }}>
                {article.content.introduction}
              </p>

              {article.content.sections.map((section, index) => (
                <div key={index} className="mb-10">
                  <div className="border-t pt-5 mb-4" style={{ borderColor: LINE }}>
                    <h2
                      className="leading-tight"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY, fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)" }}
                    >
                      {section.heading}
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg leading-[1.9]" style={{ color: BODY }}>
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Closing thought — the DNA quote box */}
              <div className="mt-12 dna-quote">
                <p className="text-base sm:text-lg leading-[1.9]" style={{ color: BODY }}>
                  {article.content.conclusion}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-12 pb-10 border-b" style={{ borderColor: LINE }}>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-[13px]" style={{ fontFamily: MONO, color: MUTED }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile share buttons */}
            <div className="md:hidden">
              <p className="text-sm mb-4" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>שתפו את המאמר</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 rounded-md bg-white border border-[#E7EDF1] text-[#1D2D3D] hover:bg-[#F4F8F7] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <Link2 className="w-4 h-4" />
                  <span className="text-sm font-medium">העתק קישור</span>
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-md bg-white border border-[#E7EDF1] text-[#1D2D3D] hover:bg-[#F4F8F7] transition-colors flex items-center justify-center"
                  aria-label="שתף בטוויטר"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-md bg-white border border-[#E7EDF1] text-[#1D2D3D] hover:bg-[#F4F8F7] transition-colors flex items-center justify-center"
                  aria-label="שתף בפייסבוק"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ NEWSLETTER — institutional navy band ══════ */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center">
            <h3
              className="text-white leading-tight mb-3"
              style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.4rem, 2.8vw, 2rem)", letterSpacing: "-0.5px" }}
            >
              נהניתם מהמאמר?
            </h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,.65)" }}>
              הירשמו לקבלת עוד תובנות כאלה ישירות לתיבת הדואר שלכם.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="האימייל שלכם"
                className="flex-1 px-0 py-3 bg-transparent border-b border-white/30 text-white placeholder:text-white/55 text-base focus:outline-none focus:border-white transition-colors text-right rounded-none min-h-[48px]"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3 bg-white text-[#1D2D3D] text-base font-medium hover:bg-[#E7EDF1] transition-colors min-h-[48px]"
              >
                הרשמה
              </button>
            </div>
          </div>
        </section>

        {/* ══════ RELATED ARTICLES ══════ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <div className="mb-10">
              <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}>
                אולי יעניין אתכם גם
              </h2>
            </div>
            {/* The unified SEELD article cards — .dna-concept tiles, .dna-hover quiet lift */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <ArticleTile key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* The signature gradient bar — this page has no site footer */}
      <div className="dna-gbar" />
    </div>
  );
};

export default Article;
