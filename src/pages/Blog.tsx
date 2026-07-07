import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { BODY, DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT } from "@/lib/brand";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

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
        ? "border-[#4E9D8F] text-[#1D2D3D]"
        : "border-transparent text-[#5a6a78] hover:text-[#1D2D3D]"
    }`;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* Hero — white canvas, pastel circles */}
        <section className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 260, height: 260, top: -110, left: -90, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ"
              style={{ width: 200, height: 200, bottom: -100, right: "22%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">/</span>
              <span style={{ color: NAVY }}>בלוג</span>
            </nav>
            <div className="mt-10 sm:mt-14 max-w-3xl">
              <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
                הבלוג של SEELD
              </h1>
              <p className="mt-5 text-lg sm:text-xl leading-[1.8] max-w-2xl" style={{ color: MUTED }}>
                מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון, בגובה העיניים
              </p>
            </div>
          </div>
        </section>

        {/* The archive — filter + article grid */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-16 sm:pb-24">
            {/* Category filter — quiet underline tabs on a hairline */}
            <div className="flex gap-8 border-b overflow-x-auto scrollbar-hide" style={{ borderColor: LINE }}>
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

            {/* Posts */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[#1D2D3D]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-base" style={{ color: BODY }}>
                  אין פוסטים בקטגוריה הזו עדיין.
                </p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="mt-4 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                  >
                    לכל הפוסטים
                  </button>
                )}
              </div>
            ) : (
              /* The unified SEELD article cards — .dna-concept tiles, whole-tile links
                 with the .dna-hover quiet lift (Snap motion) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
                {filtered.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="dna-concept dna-hover group flex h-full flex-col overflow-hidden !p-0"
                  >
                    {post.cover_image_url && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={post.cover_image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="text-[17px] leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {post.title}
                      </h2>
                      {/* Metadata under the title — mono, muted */}
                      <div
                        className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] tracking-[0.08em]"
                        style={{ fontFamily: MONO, color: MUTED }}
                      >
                        <span>{post.category ?? "בלוג"}</span>
                        <span className="tabular-nums">{formatDate(post.published_at)}</span>
                      </div>
                      {post.excerpt && (
                        <p className="mt-2.5 text-[14px] leading-[1.7] line-clamp-2" style={{ color: BODY }}>
                          {post.excerpt}
                        </p>
                      )}
                      <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#1D2D3D]">
                        קראו עוד
                        <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Next action */}
            {!loading && (
              <div className="mt-16 border-t pt-8 flex flex-wrap items-center gap-x-10 gap-y-5 justify-between" style={{ borderColor: LINE }}>
                <div>
                  <h2 className="text-xl" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                    יש שאלה שלא מצאתם לה תשובה?
                  </h2>
                  <p className="mt-2 text-[15px] leading-[1.8]" style={{ color: BODY }}>
                    יועץ מהצוות שלנו יחזור אליכם באותו יום עבודה.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
                >
                  דברו עם יועץ
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
