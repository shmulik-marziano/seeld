import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { isStockPhoto } from "@/lib/coverArt";
import { stories } from "@/data/stories";
import { SdBand, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubArticleCard, PubClose, PubHero, spreadArts } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Blog hub in the kit design: hero with illustration, search + category chips, article cards with a contextual
// illustration (or the post's own photo), story band and closing block.

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  author: string | null;
  published_at: string | null;
  cover_image_url: string | null;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
};

const arrow = <BrandIcon name="arrow-left" size={18} />;

const Blog = () => {
  useSdFont();
  const topic = PUB_TOPICS.blog;
  const [p1, p2] = topic.palette;
  const story = stories["/blog"];

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await siteSupabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, author, published_at, cover_image_url")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    } else {
      setLoadError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];

  const normalized = query.trim().toLowerCase();
  const filtered = posts.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (!normalized) return true;
    return (
      p.title.toLowerCase().includes(normalized) ||
      (p.excerpt ?? "").toLowerCase().includes(normalized) ||
      (p.category ?? "").toLowerCase().includes(normalized)
    );
  });

  const hasFilters = Boolean(activeCategory) || normalized.length > 0;
  const clearFilters = () => {
    setActiveCategory(null);
    setQuery("");
  };

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "בלוג" }]}
          eyebrow="מדריכים וטיפים"
          title="הבלוג של שילד"
          lead="מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון, בגובה העיניים."
          art={topic.art}
          tint={p1}
          actions={<a href="#archive" className="sd-btn">לכל המאמרים{arrow}</a>}
        />

        {/* THE ARCHIVE — search, category filter, article grid */}
        <SdBand tone="cream" id="archive">
          <div className="sd-wrap">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div className="sd-chips" role="group" aria-label="סינון לפי קטגוריה">
                <button type="button" onClick={() => setActiveCategory(null)} className="sd-chip" aria-pressed={!activeCategory}>
                  הכל
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className="sd-chip"
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="w-full lg:max-w-xs">
                <label htmlFor="blog-search" className="block text-[14px] font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                  חיפוש בבלוג
                </label>
                <input
                  id="blog-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="field"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Posts */}
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20" role="status">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--ink)" }} aria-hidden="true" />
                <span className="text-[16px]" style={{ color: "var(--muted)" }}>טוענים את הפוסטים.</span>
              </div>
            ) : loadError ? (
              <div className="py-10 max-w-xl">
                <p className="text-[20px] font-bold" style={{ color: "var(--ink)" }}>הפוסטים לא נטענו</p>
                <p className="mt-2 text-[16px] leading-[1.7]">
                  משהו השתבש בטעינת הבלוג. נסו שוב, או עברו למידע ולמידה בינתיים.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <button type="button" onClick={fetchPosts} className="btn-primary">נסו שוב</button>
                  <Link to="/learn" className="sd-link">מידע ולמידה{arrow}</Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 max-w-xl">
                <p className="text-[20px] font-bold" style={{ color: "var(--ink)" }}>לא נמצאו תוצאות</p>
                <p className="mt-2 text-[16px] leading-[1.7]">
                  {hasFilters ? "אין פוסטים שמתאימים לסינון הזה. נסו מילה אחרת או הציגו את כל הפוסטים." : "עדיין אין פוסטים בבלוג."}
                </p>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="btn-secondary mt-5">
                    ניקוי הסינון
                  </button>
                )}
              </div>
            ) : (
              <div className="sd-pub-grid sd-pub-grid-3">
                {(() => { const arts = spreadArts(filtered, [topic.art]); return filtered.map((post, idx) => {
                  const a = arts[idx];
                  const photo = post.cover_image_url && !isStockPhoto(post.cover_image_url) ? post.cover_image_url : null;
                  return (
                    <PubArticleCard
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      title={post.title}
                      heading="h2"
                      kicker={post.category ?? "בלוג"}
                      meta={post.published_at ? <span className="tabular-nums whitespace-nowrap">{formatDate(post.published_at)}</span> : undefined}
                      excerpt={post.excerpt}
                      art={a.art}
                      tone={a.tone}
                      photo={photo}
                    />
                  );
                }); })()}
              </div>
            )}
          </div>
        </SdBand>

        {story && (
          <SdBand tone={p2} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        <PubClose
          title="יש שאלה שלא מצאתם לה תשובה?"
          text="שאלה על התיק שלכם היא לא שאלה כללית. מתחילים באפיון צרכים, וממשיכים יחד."
          art="11-claims-service"
        >
          <button type="button" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))} className="sd-link-light">
            <BrandIcon name="message" size={18} />
            שאלו את היועץ הדיגיטלי
          </button>
        </PubClose>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
