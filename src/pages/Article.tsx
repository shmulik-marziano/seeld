import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { getArticleById, getRelatedArticles, type Article as ArticleData } from "@/data/articles";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Facebook, Twitter, Linkedin, Link2 } from "lucide-react";
import { toast } from "sonner";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN, TINT_SAGE } from "@/lib/brand";
import { Illustration } from "@/components/brand/Illustration";
import { illustrationForCategory, isStockPhoto } from "@/lib/coverArt";

// Article: one reading column on ivory, deep green closing band (STYLESEED.md).
// The article keeps its own image only when it is a real one; the stock photos
// the early articles shipped with are replaced by the category illustration.

const ArticleCover = ({ article, priority = false, className = "" }: { article: ArticleData; priority?: boolean; className?: string }) =>
  isStockPhoto(article.image) ? (
    <Illustration
      name={illustrationForCategory(article.category)}
      priority={priority}
      sizes={priority ? "(min-width: 768px) 720px, 100vw" : "(min-width: 1024px) 380px, 100vw"}
      className={`!rounded-none h-full w-full ${className}`}
    />
  ) : (
    <img
      src={article.image}
      alt={priority ? article.title : ""}
      loading={priority ? undefined : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`w-full h-full object-cover ${className}`}
    />
  );

// Share buttons — 44px squares with the hairline outline
const shareBtnClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white transition-colors hover:bg-[#EEF2EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]";

// The article card — .dna-concept tile, whole-tile link, quiet lift
const ArticleTile = ({ article }: { article: ArticleData }) => (
  <Link
    to={`/article/${article.id}`}
    className="dna-concept dna-hover group flex h-full flex-col overflow-hidden !p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
  >
    <div className={`${isStockPhoto(article.image) ? "aspect-[3/2]" : "aspect-[16/10]"} overflow-hidden border-b`} style={{ borderColor: LINE }}>
      <ArticleCover article={article} />
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h3 className="text-[18px] leading-snug" style={{ color: GREEN }}>{article.title}</h3>
      <p className="mt-2 text-[14px]" style={{ color: MUTED }}>
        <span>{article.category}</span>
        <span aria-hidden="true"> · </span>
        <span className="tabular-nums whitespace-nowrap">{article.date}</span>
        <span aria-hidden="true"> · </span>
        <span dir="ltr" className="tabular-nums whitespace-nowrap">{article.readTime}</span>
      </p>
      <p className="mt-3 text-[15px] leading-[1.7] line-clamp-3" style={{ color: BODY }}>{article.subtitle}</p>
      <span className="link-rule mt-auto pt-5 text-[15px] self-start">
        לקריאה
        <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
      </span>
    </div>
  </Link>
);

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  usePageSeo(article?.title, article?.subtitle);

  if (!article) {
    // Rendered in place rather than redirected to "/404" — there is no such
    // route, so that only ever worked by falling through to the catch-all, and
    // `replace` erased the article URL the visitor actually asked for.
    return <NotFound />;
  }

  const relatedArticles = getRelatedArticles(article.id);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("הקישור הועתק.");
  };

  const shareLinks = [
    {
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(pageUrl)}`,
      label: "שיתוף בטוויטר",
      Icon: Twitter,
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
      label: "שיתוף בפייסבוק",
      Icon: Facebook,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
      label: "שיתוף בלינקדאין",
      Icon: Linkedin,
    },
  ];

  const ShareRow = () => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleCopyLink} className={shareBtnClass} style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, color: GREEN }} aria-label="העתקת קישור">
        <Link2 className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className={shareBtnClass}
          style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, color: GREEN }}
          aria-label={s.label}
        >
          <s.Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </a>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* THE READING SURFACE */}
        <section>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">{article.category}</span>
            </nav>

            <BrandDots className="mb-5" />
            <h1 className="dna-display leading-[1.15] mb-5" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
              {article.title}
            </h1>

            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6 text-[14px]" style={{ color: MUTED }}>
              <span>{article.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums whitespace-nowrap">{article.date}</span>
              <span aria-hidden="true">·</span>
              <span>
                <span dir="ltr" className="tabular-nums whitespace-nowrap">{article.readTime}</span> קריאה
              </span>
            </p>

            <p className="text-[17px] sm:text-[18px] leading-[1.7] mb-10" style={{ color: MUTED }}>
              {article.subtitle}
            </p>

            {/* The hero is the LCP element here, so it is deliberately eager
                and high-priority — the opposite of the thumbnails. */}
            {isStockPhoto(article.image) ? (
              <div className="mb-10">
                <ArticleCover article={article} priority className="brand-hero-art" />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden mb-10 border bg-white" style={{ borderColor: LINE }}>
                <ArticleCover article={article} priority className="aspect-[16/9]" />
              </div>
            )}

            {/* Author + share */}
            <div className="flex flex-wrap items-center justify-between gap-5 border-t border-b py-6 mb-12" style={{ borderColor: LINE }}>
              <div className="flex items-center gap-4">
                <img
                  src={article.author.avatar}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border"
                  style={{ borderColor: LINE }}
                />
                <div>
                  <p className="text-[16px] font-bold" style={{ color: GREEN }}>{article.author.name}</p>
                  <p className="text-[14px]" style={{ color: MUTED }}>{article.author.bio}</p>
                </div>
              </div>
              <ShareRow />
            </div>

            {/* Article content */}
            <div className="mb-14">
              <p className="text-[17px] sm:text-[18px] leading-[1.8] mb-10" style={{ color: BODY }}>
                {article.content.introduction}
              </p>

              {article.content.sections.map((section, index) => (
                <div key={index} className="mb-10 border-t pt-6" style={{ borderColor: LINE }}>
                  <h2 className="leading-tight mb-4" style={{ color: GREEN, fontSize: "clamp(24px, 2.6vw, 30px)" }}>
                    {section.heading}
                  </h2>
                  <p className="text-[17px] leading-[1.8]" style={{ color: BODY }}>
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Closing thought — the quote box */}
              <div className="mt-12 dna-quote">
                <div className="dna-ql">לסיכום</div>
                <p className="text-[16px] sm:text-[17px] leading-[1.8]" style={{ color: BODY }}>
                  {article.content.conclusion}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-10 pb-8 border-b" style={{ borderColor: LINE }}>
              <ul className="flex flex-wrap gap-2" aria-label="נושאים">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[14px] font-bold"
                    style={{ backgroundColor: TINT_SAGE, color: GREEN }}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[14px] font-bold" style={{ color: GREEN }}>שיתוף המאמר</p>
              <ShareRow />
            </div>
          </div>
        </section>

        {/* RELATED ARTICLES — white band */}
        {relatedArticles.length > 0 && (
          <section className="border-t bg-white" style={{ borderColor: LINE }}>
            <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
              <div className="mb-8 sm:mb-10">
                <BrandDots className="mb-4" />
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  אולי יעניין אתכם גם
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <ArticleTile key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              נהניתם מהמאמר? בואו נדבר על התיק שלכם.
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              בדיקת תיק 360 מסכמת את הביטוחים, הפנסיה והחיסכון בתמונה אחת. ללא עלות וללא התחייבות.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Article;
