import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { usePageMeta } from "@/hooks/usePageMeta";

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

const categoryColors: Record<string, string> = {
  "פנסיה": "#5ec6c6",
  "ביטוח": "#e76f51",
  "טיפים": "#f4a261",
  "חיסכון": "#90be6d",
  "פיננסים": "#6c63ff",
};

const Blog = () => {
  usePageMeta("בלוג", "מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון — בגובה העיניים.");
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f8f9fc] dark:bg-gray-900 py-14 sm:py-28">
        {/* Decorative circles - scaled for mobile */}
        <div className="absolute top-8 right-4 sm:top-10 sm:right-10 w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-[#5ec6c6] opacity-20" />
        <div className="absolute bottom-6 left-8 sm:bottom-10 sm:left-16 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#f4a261] opacity-20" />
        <div className="absolute top-1/2 left-1/3 w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-[#90be6d] opacity-15 hidden sm:block" />
        <div className="absolute bottom-20 right-1/4 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#e76f51] opacity-15 hidden sm:block" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0a3d3d] dark:text-white mb-3 sm:mb-4">
            הבלוג של SEELD
          </h1>
          <p className="text-lg sm:text-xl text-[#0a3d3d]/70 dark:text-white/60 max-w-2xl mx-auto">
            מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון — בגובה העיניים
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 pb-4">
        <div className="flex gap-2 justify-center overflow-x-auto pb-2 -mx-4 px-4 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 min-h-[44px] ${
              !activeCategory
                ? "bg-[#0a3d3d] text-white shadow-lg shadow-[#0a3d3d]/20"
                : "bg-[#f8f9fc] dark:bg-gray-800 text-[#0a3d3d] dark:text-white/70 hover:bg-[#0a3d3d]/10"
            }`}
          >
            הכל
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 min-h-[44px] ${
                activeCategory === cat
                  ? "text-white shadow-lg"
                  : "bg-[#f8f9fc] dark:bg-gray-800 text-[#0a3d3d] dark:text-white/70 hover:bg-[#0a3d3d]/10"
              }`}
              style={
                activeCategory === cat
                  ? { backgroundColor: categoryColors[cat] || "#0a3d3d", boxShadow: `0 4px 14px ${categoryColors[cat] || "#0a3d3d"}40` }
                  : undefined
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a3d3d]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#0a3d3d]/50 dark:text-white/40">
            <p className="text-lg">אין פוסטים עדיין</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((post) => (
              <article
                key={post.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-[#0a3d3d]/10 dark:border-white/10 overflow-hidden hover:shadow-xl hover:shadow-[#0a3d3d]/5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cover image */}
                <div className="w-full h-48 sm:h-56 overflow-hidden"
                  style={!post.cover_image_url ? { background: `linear-gradient(135deg, ${categoryColors[post.category || ""] || "#0a3d3d"}20, ${categoryColors[post.category || ""] || "#0a3d3d"}08)` } : undefined}>
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-black opacity-10" style={{ color: categoryColors[post.category || ""] || "#0a3d3d" }}>
                        SEELD
                      </span>
                    </div>
                  )}
                </div>

                {/* Colored top bar (below image or at top if no image) */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: categoryColors[post.category || ""] || "#0a3d3d" }}
                />

                <div className="p-5 sm:p-8 flex flex-col h-full">
                  {/* Category badge + Date */}
                  <div className="flex items-center justify-between mb-4">
                    {post.category && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: categoryColors[post.category] || "#0a3d3d" }}
                      >
                        {post.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-[#0a3d3d]/50 dark:text-white/40">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(post.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d] dark:text-white mb-3 leading-tight">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-[#0a3d3d]/60 dark:text-white/50 text-sm leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 self-start px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                    style={{
                      backgroundColor: categoryColors[post.category || ""] || "#0a3d3d",
                      boxShadow: `0 4px 14px ${categoryColors[post.category || ""] || "#0a3d3d"}30`,
                    }}
                  >
                    קרא עוד
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
