import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { MONO, CARD_SHADOW } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

// SEELD Bento: warm paper panels on ink gutters (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

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

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await siteSupabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, author, published_at, cover_image_url")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];

  const filtered = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tabClass = (active: boolean) =>
    `rounded-none bg-transparent px-0 pb-4 text-[15px] font-medium border-b-2 transition-colors shrink-0 min-h-[44px] ${
      active
        ? "border-[#171717] text-[#171717]"
        : "border-transparent text-[#5c5c5c] hover:text-[#171717]"
    }`;

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero — one paper tile */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 relative z-10">
          <div className="border-t border-[#171717]/20 pt-4">
            <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span aria-hidden="true">/</span>
              <span className="text-[#171717]">בלוג</span>
            </nav>
          </div>
          <div className="mt-12 sm:mt-16 max-w-3xl">
            <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
              BLOG · SEELD
            </span>
            <h1
              className="mt-4 text-[#171717] leading-[1.1]"
              style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", letterSpacing: "-0.03em" }}
            >
              הבלוג של SEELD
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-[#4d4d4d] leading-[1.8] max-w-2xl">
              מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון, בגובה העיניים
            </p>
          </div>
        </div></div>
      </section>

      {/* The archive — filter + article grid, all in one paper tile */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-16 sm:pb-24 relative z-10">
          {/* Category filter — quiet underline tabs */}
          <div className="flex gap-8 border-b border-[#171717]/10 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory(null)} className={tabClass(!activeCategory)}>
              הכל
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={tabClass(activeCategory === cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts — editorial hairline rows */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#171717]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-base text-[#4d4d4d]">
                אין פוסטים בקטגוריה הזו עדיין.
              </p>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="mt-4 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                >
                  לכל הפוסטים
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2">
              {filtered.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-6 sm:gap-10 py-7 border-b border-[#171717]/10 hover:border-[#171717]/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3 text-[12px] text-[#5c5c5c] mb-2.5">
                      {post.category && <span>{post.category}</span>}
                      {post.category && <span aria-hidden="true">·</span>}
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                    <h2
                      className="text-xl sm:text-2xl text-[#171717] leading-snug"
                      style={{ fontFamily: HEEBO, fontWeight: 600 }}
                    >
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2.5 text-[15px] text-[#4d4d4d] leading-[1.8] max-w-2xl line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#171717]">
                      קראו עוד
                      <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
                    </span>
                  </div>
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt=""
                      loading="lazy"
                      className="hidden sm:block w-44 h-28 object-cover rounded-lg shrink-0"
                      style={{ boxShadow: CARD_SHADOW }}
                    />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Next action */}
          {!loading && (
            <div className="mt-16 border-t border-[#171717]/20 pt-8 flex flex-wrap items-center gap-x-10 gap-y-5 justify-between">
              <div>
                <h2 className="text-xl text-[#171717]" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                  יש שאלה שלא מצאתם לה תשובה?
                </h2>
                <p className="mt-2 text-[15px] text-[#4d4d4d] leading-[1.8]">
                  יועץ מהצוות שלנו יחזור אליכם באותו יום עבודה.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-black transition-colors min-h-[52px] rounded-lg"
              >
                דברו עם יועץ
              </Link>
            </div>
          )}
        </div></div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
