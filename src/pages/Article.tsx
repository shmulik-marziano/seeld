import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { getArticleById, getRelatedArticles } from "@/data/articles";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Facebook, Twitter, Linkedin, Link2 } from "lucide-react";
import { toast } from "sonner";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { isStockPhoto } from "@/lib/coverArt";
import { SdBand, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubArticleCard, PubClose, PubHead, PubHero, PubTocAside, PubTocInline, artForText } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Article in the kit design: hero with a contextual illustration (by topic), one reading column in serif
// headings with soft colour rules between sections, a table of contents beside it, related articles, closing block.
// All the article text stays in the DOM; one h1.

// Share buttons: 44px squares with the hairline outline
const shareBtnClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white transition-colors hover:bg-[#EEF2EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#203957]";

const Article = () => {
  useSdFont();
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  usePageSeo(article?.title, article?.subtitle);

  if (!article) {
    // Rendered in place rather than redirected to "/404": there is no such
    // route, so that only ever worked by falling through to the catch-all, and
    // `replace` erased the article URL the visitor actually asked for.
    return <NotFound />;
  }

  const relatedArticles = getRelatedArticles(article.id);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const { art, tone } = artForText(article.category, article.title);
  const toc = article.content.sections.map((s, i) => ({ id: `sec-${i + 1}`, label: s.heading }));
  const hasPhoto = !isStockPhoto(article.image);

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
      <button type="button" onClick={handleCopyLink} className={shareBtnClass} style={{ boxShadow: "inset 0 0 0 1px var(--line)", color: "var(--ink)" }} aria-label="העתקת קישור">
        <Link2 className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className={shareBtnClass}
          style={{ boxShadow: "inset 0 0 0 1px var(--line)", color: "var(--ink)" }}
          aria-label={s.label}
        >
          <s.Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </a>
      ))}
    </div>
  );

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(tone)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: article.category }]}
          eyebrow={article.category}
          title={article.title}
          lead={article.subtitle}
          art={art}
          tint={tone}
          meta={
            <>
              <span className="tabular-nums whitespace-nowrap">{article.date}</span>
              <span aria-hidden="true">·</span>
              <span><span dir="ltr" className="tabular-nums whitespace-nowrap">{article.readTime}</span> קריאה</span>
            </>
          }
        />

        {/* THE READING SURFACE */}
        <SdBand tone="white" id="article">
          <div className="sd-wrap sd-read-layout">
            <div className="sd-read-col">
              {hasPhoto && (
                <div className="rounded-2xl overflow-hidden mb-10 border bg-white" style={{ borderColor: "var(--line)" }}>
                  <img src={article.image} alt={article.title} className="w-full aspect-[16/9] object-cover" decoding="async" />
                </div>
              )}

              {/* Author + share */}
              <div className="sd-byline">
                <div className="flex items-center gap-4">
                  <img src={article.author.avatar} alt="" width={52} height={52} />
                  <div>
                    <p className="text-[16px] font-bold" style={{ color: "var(--ink)" }}>צוות שילד</p>
                    <p className="text-[14px]" style={{ color: "var(--muted)" }}>הצוות המקצועי של הסוכנות</p>
                  </div>
                </div>
                <ShareRow />
              </div>

              <PubTocInline items={toc} />

              {/* Article content */}
              <div className="sd-prose">
                <p>{article.content.introduction}</p>
                {article.content.sections.flatMap((section, index) => [
                  <h2 key={`h-${index}`} id={`sec-${index + 1}`}>{section.heading}</h2>,
                  <p key={`p-${index}`}>{section.content}</p>,
                ])}
              </div>

              {/* Closing thought */}
              <div className="sd-conclusion">
                <b>לסיכום</b>
                <p>{article.content.conclusion}</p>
              </div>

              {/* Tags */}
              <ul className="sd-tags" aria-label="נושאים">
                {article.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>

              <div className="sd-share flex flex-wrap items-center gap-4">
                <p className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>שיתוף המאמר</p>
                <ShareRow />
              </div>
            </div>

            <PubTocAside items={toc} art={art} tone={tone} />
          </div>
        </SdBand>

        {/* RELATED ARTICLES */}
        {relatedArticles.length > 0 && (
          <SdBand tone="cream" id="related">
            <div className="sd-wrap">
              <PubHead title="אולי יעניין אתכם גם" />
              <div className="sd-pub-grid sd-pub-grid-3">
                {relatedArticles.map((r) => {
                  const a = artForText(r.category, r.title);
                  return (
                    <PubArticleCard
                      key={r.id}
                      to={`/article/${r.id}`}
                      title={r.title}
                      kicker={r.category}
                      meta={<><span className="tabular-nums whitespace-nowrap">{r.date}</span> · <span dir="ltr" className="tabular-nums whitespace-nowrap">{r.readTime}</span></>}
                      excerpt={r.subtitle}
                      art={a.art}
                      tone={a.tone}
                    />
                  );
                })}
              </div>
              <div className="mt-8">
                <Link to="/blog" className="sd-link">לכל המאמרים בבלוג<BrandIcon name="arrow-left" size={18} /></Link>
              </div>
            </div>
          </SdBand>
        )}

        <PubClose
          title="נהניתם מהמאמר? בואו נדבר על התיק שלכם."
          text="בדיקת תיק 360 מסכמת את הביטוחים, הפנסיה והחיסכון בתמונה אחת. ללא עלות וללא התחייבות."
          art="10-financial-planning"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Article;
