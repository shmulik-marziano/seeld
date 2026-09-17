import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { OliveBranch } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { Illustration } from "@/components/brand/Illustration";
import { illustrationForCategory, isStockPhoto } from "@/lib/coverArt";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, SAGE_ON_GREEN } from "@/lib/brand";

// Blog hub: ivory canvas, one vector element in the opening margin, white
// article cards. A card shows the post's own photo when it has one; a stock
// photo (banned by STYLESEED) is replaced by the category's kit illustration.

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

const tabClass = (active: boolean) =>
  `rounded-none bg-transparent min-w-[44px] justify-center px-0 pb-4 text-[16px] font-bold border-b-2 transition-colors shrink-0 min-h-[44px] whitespace-nowrap ${
    active ? "border-[#003D30] text-[#003D30]" : "border-transparent text-[#476356] hover:text-[#003D30]"
  }`;

const Blog = () => {
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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>
          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
            <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }}>
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">בלוג</span>
            </nav>
            <div className="relative">
              <OliveBranch className="hidden lg:block absolute -top-10 left-4 w-36 opacity-80" />
              <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                הבלוג של שילד
              </h1>
              <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                מדריכים, טיפים ותוכן מקצועי בנושאי ביטוח, פנסיה וחיסכון, בגובה העיניים.
              </p>
            </div>
          </div>
        </section>

        {/* THE ARCHIVE — search, category filter, article grid */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-16 sm:pb-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b" style={{ borderColor: LINE }}>
              <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide" role="group" aria-label="סינון לפי קטגוריה">
                <button type="button" onClick={() => setActiveCategory(null)} className={tabClass(!activeCategory)} aria-pressed={!activeCategory}>
                  הכל
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={tabClass(activeCategory === cat)}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="w-full lg:max-w-xs pb-4">
                <label htmlFor="blog-search" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
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
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
                <span className="text-[16px]" style={{ color: MUTED }}>טוענים את הפוסטים.</span>
              </div>
            ) : loadError ? (
              <div className="py-16 max-w-xl">
                <p className="text-[18px] font-bold" style={{ color: GREEN }}>הפוסטים לא נטענו</p>
                <p className="mt-2 text-[16px] leading-[1.7]" style={{ color: BODY }}>
                  משהו השתבש בטעינת הבלוג. נסו שוב, או עברו למידע ולמידה בינתיים.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={fetchPosts} className="btn-primary">נסו שוב</button>
                  <Link to="/learn" className="btn-secondary">מידע ולמידה</Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 max-w-xl">
                <p className="text-[18px] font-bold" style={{ color: GREEN }}>לא נמצאו תוצאות</p>
                <p className="mt-2 text-[16px] leading-[1.7]" style={{ color: BODY }}>
                  {hasFilters ? "אין פוסטים שמתאימים לסינון הזה. נסו מילה אחרת או הציגו את כל הפוסטים." : "עדיין אין פוסטים בבלוג."}
                </p>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="btn-secondary mt-5">
                    ניקוי הסינון
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pt-10">
                {filtered.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="dna-concept dna-hover group flex h-full flex-col overflow-hidden !p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                  >
                    {post.cover_image_url && !isStockPhoto(post.cover_image_url) ? (
                      <div className="aspect-[16/10] overflow-hidden border-b" style={{ borderColor: LINE }}>
                        <img src={post.cover_image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[3/2] overflow-hidden border-b" style={{ borderColor: LINE }}>
                        <Illustration name={illustrationForCategory(post.category)} sizes="(min-width: 1024px) 380px, 100vw" className="!rounded-none h-full w-full" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="text-[18px] leading-snug" style={{ color: GREEN }}>{post.title}</h2>
                      <p className="mt-2 text-[14px]" style={{ color: MUTED }}>
                        <span>{post.category ?? "בלוג"}</span>
                        {post.published_at && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="tabular-nums whitespace-nowrap">{formatDate(post.published_at)}</span>
                          </>
                        )}
                      </p>
                      {post.excerpt && (
                        <p className="mt-3 text-[15px] leading-[1.7] line-clamp-3" style={{ color: BODY }}>{post.excerpt}</p>
                      )}
                      <span className="link-rule mt-auto pt-5 text-[15px] self-start">
                        לקריאה
                        <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              יש שאלה שלא מצאתם לה תשובה?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              שאלה על התיק שלכם היא לא שאלה כללית. מתחילים בבדיקת תיק 360, וממשיכים יחד.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="link-rule text-[15px] self-center !text-[#FAF7EF] !border-[#FAF7EF]/40 hover:!border-[#FAF7EF]"
              >
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
