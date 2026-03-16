import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, User, ArrowRight, Share2, Copy, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { toast } from "sonner";

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  author: string | null;
  published_at: string | null;
}

const categoryColors: Record<string, string> = {
  "פנסיה": "#5ec6c6",
  "ביטוח": "#e76f51",
  "טיפים": "#f4a261",
  "חיסכון": "#90be6d",
  "פיננסים": "#6c63ff",
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);

      const { data, error } = await siteSupabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (!error && data) {
        setPost(data);

        // Fetch related posts (same category, different slug)
        if (data.category) {
          const { data: relatedData } = await siteSupabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, category, author, published_at, content")
            .eq("status", "published")
            .eq("category", data.category)
            .neq("slug", slug)
            .order("published_at", { ascending: false })
            .limit(3);

          if (relatedData) setRelated(relatedData);
        }
      }
      setLoading(false);
    };
    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = post ? `${post.title} — ${url}` : url;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("הקישור הועתק!");
  };

  const accentColor = categoryColors[post?.category || ""] || "#0a3d3d";

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
        <Header />
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#0a3d3d]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold text-[#0a3d3d] dark:text-white mb-4">
            הפוסט לא נמצא
          </h1>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0a3d3d] text-white font-semibold hover:bg-[#0d4a4a] transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לבלוג
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f8f9fc] dark:bg-gray-900 py-16 sm:py-24">
        {/* Decorative circles */}
        <div
          className="absolute top-8 right-12 w-28 h-28 rounded-full opacity-20"
          style={{ backgroundColor: accentColor }}
        />
        <div className="absolute bottom-8 left-20 w-20 h-20 rounded-full bg-[#f4a261] opacity-15" />
        <div className="absolute top-1/3 left-10 w-14 h-14 rounded-full bg-[#90be6d] opacity-15" />

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a3d3d]/60 dark:text-white/50 hover:text-[#0a3d3d] dark:hover:text-white transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לבלוג
          </Link>

          {/* Category badge */}
          {post.category && (
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white mb-5"
              style={{ backgroundColor: accentColor }}
            >
              {post.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a3d3d] dark:text-white leading-tight mb-6">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#0a3d3d]/50 dark:text-white/40">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatDate(post.published_at)}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div
          className="prose prose-lg max-w-none dark:prose-invert
            prose-headings:text-[#0a3d3d] dark:prose-headings:text-white prose-headings:font-bold
            prose-p:text-[#0a3d3d]/80 dark:prose-p:text-white/70 prose-p:leading-relaxed
            prose-strong:text-[#0a3d3d] dark:prose-strong:text-white
            prose-a:text-[#5ec6c6] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share buttons */}
        <div className="mt-12 pt-8 border-t border-[#0a3d3d]/10 dark:border-white/10">
          <p className="text-sm font-semibold text-[#0a3d3d] dark:text-white mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            שתפו את המאמר
          </p>
          <div className="flex gap-3">
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.157-2.625.78.78-2.625-.157-.252A8 8 0 1112 20z" />
              </svg>
              WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#f8f9fc] dark:bg-gray-800 text-[#0a3d3d] dark:text-white/70 hover:bg-[#0a3d3d]/10 transition-all"
            >
              <Copy className="w-4 h-4" />
              העתק קישור
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="bg-[#f8f9fc] dark:bg-gray-900 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] dark:text-white mb-8 text-center">
              מאמרים נוספים
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => {
                const rColor = categoryColors[r.category || ""] || "#0a3d3d";
                return (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-[#0a3d3d]/10 dark:border-white/10 overflow-hidden hover:shadow-xl hover:shadow-[#0a3d3d]/5 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-2 w-full" style={{ backgroundColor: rColor }} />
                    <div className="p-6">
                      {r.category && (
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
                          style={{ backgroundColor: rColor }}
                        >
                          {r.category}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-[#0a3d3d] dark:text-white mb-2 leading-tight group-hover:text-[#5ec6c6] transition-colors">
                        {r.title}
                      </h3>
                      {r.excerpt && (
                        <p className="text-sm text-[#0a3d3d]/50 dark:text-white/40 line-clamp-2">
                          {r.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
