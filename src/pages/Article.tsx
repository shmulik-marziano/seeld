import { useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import ArticleCard from "@/components/ArticleCard";
import { getArticleById, getRelatedArticles } from "@/data/articles";
import { Facebook, Twitter, Linkedin, Link2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { MONO, RING } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

// Share icon buttons — quiet white squares on the paper tile
const shareBtnClass =
  "w-10 h-10 rounded-md bg-white text-[#171717] hover:bg-[#fafafa] transition-colors flex items-center justify-center";

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
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      <main>
        {/* ══════ THE READING TILE — one quiet paper surface, no figures ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14 relative z-10">
            {/* Back navigation */}
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-[#5c5c5c] hover:text-[#171717] transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה למאמרים
              </a>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span
                className="px-3.5 py-1.5 rounded-full bg-white text-[12px] font-medium text-[#171717]"
                style={{ boxShadow: RING }}
              >
                {article.category}
              </span>
              <span className="text-[12px] tracking-[0.08em] text-[#5c5c5c]" style={{ fontFamily: MONO }}>
                {article.date}
              </span>
              <span className="text-[12px] text-[#5c5c5c]" aria-hidden="true">·</span>
              <span className="text-[12px] text-[#5c5c5c]">{article.readTime} קריאה</span>
            </div>

            <h1
              className="text-[#171717] leading-[1.15] mb-4"
              style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.02em" }}
            >
              {article.title}
            </h1>

            <p className="text-lg sm:text-xl text-[#4d4d4d] leading-[1.8] mb-10 max-w-2xl">
              {article.subtitle}
            </p>

            {/* Hero image — framed inside the tile */}
            <div className="rounded-lg overflow-hidden mb-10" style={{ boxShadow: RING }}>
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-[260px] sm:h-[380px] md:h-[460px] object-cover"
              />
            </div>

            {/* Author + share */}
            <div className="flex items-center justify-between border-t border-b border-[#171717]/15 py-6 mb-12">
              <div className="flex items-center gap-4">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{ boxShadow: RING }}
                />
                <div>
                  <p className="text-[15px] text-[#171717]" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                    {article.author.name}
                  </p>
                  <p className="text-sm text-[#5c5c5c]">{article.author.bio}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className={shareBtnClass}
                  style={{ boxShadow: RING }}
                  aria-label="העתק קישור"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  style={{ boxShadow: RING }}
                  aria-label="שתף בטוויטר"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  style={{ boxShadow: RING }}
                  aria-label="שתף בפייסבוק"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareBtnClass}
                  style={{ boxShadow: RING }}
                  aria-label="שתף בלינקדאין"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Article content */}
            <div className="max-w-3xl mb-16">
              <p className="text-base sm:text-lg leading-[1.9] text-[#4d4d4d] mb-10">
                {article.content.introduction}
              </p>

              {article.content.sections.map((section, index) => (
                <div key={index} className="mb-10">
                  <div className="border-t border-[#171717]/15 pt-5 mb-4">
                    <h2
                      className="text-[#171717] leading-tight"
                      style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)", letterSpacing: "-0.02em" }}
                    >
                      {section.heading}
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg leading-[1.9] text-[#4d4d4d]">
                    {section.content}
                  </p>
                </div>
              ))}

              <div className="mt-12 border-r-2 border-[#171717] pr-6">
                <p className="text-base sm:text-lg leading-[1.9] italic text-[#171717]">
                  {article.content.conclusion}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-12 pb-10 border-b border-[#171717]/15">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-[13px] text-[#5c5c5c]" style={{ fontFamily: MONO }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile share buttons */}
            <div className="md:hidden">
              <p className="text-sm text-[#171717] mb-4" style={{ fontFamily: HEEBO, fontWeight: 600 }}>שתפו את המאמר</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 rounded-md bg-white text-[#171717] hover:bg-[#fafafa] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                  style={{ boxShadow: RING }}
                >
                  <Link2 className="w-4 h-4" />
                  <span className="text-sm font-medium">העתק קישור</span>
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-md bg-white text-[#171717] hover:bg-[#fafafa] transition-colors flex items-center justify-center"
                  style={{ boxShadow: RING }}
                  aria-label="שתף בטוויטר"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-md bg-white text-[#171717] hover:bg-[#fafafa] transition-colors flex items-center justify-center"
                  style={{ boxShadow: RING }}
                  aria-label="שתף בפייסבוק"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div></div>
        </section>

        {/* ══════ NEWSLETTER — ink tile ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-16 relative z-10 text-center">
            <h3
              className="text-[#fafafa] leading-tight mb-3"
              style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.4rem, 2.8vw, 2rem)", letterSpacing: "-0.02em" }}
            >
              נהניתם מהמאמר?
            </h3>
            <p className="text-[#fafafa]/50 text-base leading-relaxed mb-8">
              הירשמו לקבלת עוד תובנות כאלה ישירות לתיבת הדואר שלכם.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="האימייל שלכם"
                className="flex-1 px-0 py-3 bg-transparent border-b border-white/25 text-[#fafafa] placeholder:text-[#fafafa]/50 text-base focus:outline-none focus:border-white transition-colors text-right rounded-none min-h-[48px]"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md px-8 py-3 bg-[#fafafa] text-[#171717] text-base font-medium hover:bg-white transition-colors min-h-[48px]"
              >
                הרשמה
              </button>
            </div>
          </div></div>
        </section>

        {/* ══════ RELATED ARTICLES — paper tile ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-6 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)", letterSpacing: "-0.02em" }}
              >
                אולי יעניין אתכם גם
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} {...relatedArticle} size="small" />
              ))}
            </div>
          </div></div>
        </section>
      </main>
    </div>
  );
};

export default Article;
