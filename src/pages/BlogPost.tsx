import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { buildBlogPostingGraph } from "@/lib/structuredData";
import { usePageSeo } from "@/hooks/usePageSeo";
import { toast } from "sonner";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, RUST, RUST_TEXT } from "@/lib/brand";
import { isStockPhoto } from "@/lib/coverArt";
import { SdBand, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubArticleCard, PubClose, PubHead, PubHero, PubTocAside, PubTocInline, artForText, withHeadingIds } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Blog post: one reading column on ivory, the post's own cover image when it
// has one, a white lead-form band, deep green closing band (STYLESEED.md).

// Reading time from the post's HTML content — roughly 200 Hebrew words a minute
const readMinutes = (html: string) =>
  Math.max(1, Math.round(html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200));

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  author: string | null;
  published_at: string | null;
  cover_image_url: string | null;
  updated_at?: string | null;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
};

const FieldLabel = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
    {children}
    {required && <span aria-hidden="true" style={{ color: RUST }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="mt-1.5 text-[14px]" style={{ color: RUST_TEXT }}>{children}</p> : null;

const BlogPost = () => {
  useSdFont();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [leadErrors, setLeadErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const leadFormRef = useRef<HTMLDivElement>(null);

  const postJsonLd = useMemo(() => {
    if (!post) return null;
    const plain = post.content.replace(/<[^>]+>/g, " ").replace(/[#*_>`[\]()]/g, "").replace(/\s+/g, " ").trim();
    return buildBlogPostingGraph(post, post.excerpt ?? plain.slice(0, 155));
  }, [post]);
  usePageSeo(post?.title, post?.excerpt, postJsonLd);
  // h2 headings get ids so the table of contents can link to them; the text itself is untouched
  const body = useMemo(() => withHeadingIds(post?.content ?? ""), [post?.content]);

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
            .select("id, slug, title, excerpt, category, author, published_at, content, cover_image_url")
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

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = post ? `${post.title} ${url}` : url;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("הקישור הועתק.");
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadSubmitting) return;
    const errs: typeof leadErrors = {};
    if (!leadForm.name.trim()) errs.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(leadForm.phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (leadForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email)) errs.email = "כתובת האימייל אינה תקינה.";
    setLeadErrors(errs);
    if (Object.keys(errs).length) return;
    setLeadSubmitting(true);

    try {
      const subject = post?.category || "בלוג";
      const { error } = await siteSupabase.from("contact_submissions").insert([{
        name: leadForm.name.trim(),
        email: leadForm.email.trim() || null,
        subject: `ליד מבלוג: ${post?.title || ""}`,
        message: `טלפון: ${leadForm.phone}\nמקור: בלוג. ${post?.title}\nקטגוריה: ${subject}`
      }]);

      if (error) throw error;

      try {
        await siteSupabase.functions.invoke("send-lead-notification", {
          body: {
            type: "blog",
            leadData: {
              fullName: leadForm.name.trim(),
              phone: leadForm.phone.trim(),
              email: leadForm.email.trim(),
              insuranceType: `בלוג: ${post?.title}`
            }
          }
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      setLeadSubmitted(true);
      setLeadForm({ name: "", phone: "", email: "" });
      setLeadErrors({});
      toast.success("הפרטים התקבלו. נחזור אליכם בהקדם.");
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Handle CTA button clicks inside blog content — scroll to lead form
  useEffect(() => {
    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href="#lead-form"]');
      if (anchor) {
        e.preventDefault();
        leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    document.addEventListener("click", handleContentClick);
    return () => document.removeEventListener("click", handleContentClick);
  }, []);

  // Dynamic lead form text — tailored per article slug, with category fallback
  const leadFormText = (() => {
    const slugMap: Record<string, { title: string; desc: string; cta: string; successMsg: string }> = {
      "disability-insurance-guide": {
        title: "רוצים לדעת אם יש לכם כיסוי לאובדן כושר עבודה?",
        desc: "לא תמיד ברור אם הכיסוי מלא, חלקי או כפול. נעבור יחד על הפוליסות ונסביר מה מכוסה ומה לא.",
        cta: "בדיקת כיסוי אכ״ע",
        successMsg: "נבדוק את הכיסוי שלכם ונחזור עם ממצאים בהקדם.",
      },
      "israel-capital-market-2026": {
        title: "רוצים לדעת איפה אתם עומדים מבחינת השקעות?",
        desc: "נסתכל ביחד על התמונה המלאה: פנסיה, קרן השתלמות, חסכונות, ותיק השקעות. נראה מה מסודר, מה חסר ומה כדאי לבדוק.",
        cta: "בדיקת תיק ללא עלות",
        successMsg: "נכין לכם ניתוח תיק השקעות מותאם ונחזור בהקדם.",
      },
      "nursing-care-insurance": {
        title: "יש לכם כיסוי סיעודי? בואו נבדוק",
        desc: "לא תמיד ברור מה הביטוח הסיעודי מכסה ומתי הוא נגמר. נעשה סדר בשכבות הכיסוי ונסביר איפה יש פערים.",
        cta: "בדיקת כיסוי סיעודי",
        successMsg: "נבדוק את הכיסוי הסיעודי שלכם ונחזור עם המלצות.",
      },
      "training-fund-guide": {
        title: "משלמים דמי ניהול גבוהים בקרן ההשתלמות?",
        desc: "דמי הניהול משפיעים על החיסכון לאורך השנים. נבדוק את הקרן שלכם, נשווה אותה לאפשרויות אחרות ונסביר מה כדאי לעשות.",
        cta: "בדיקת דמי ניהול",
        successMsg: "נבדוק את קרן ההשתלמות שלכם ונחזור עם השוואה מול השוק.",
      },
      "payslip-checklist": {
        title: "חושבים שהתלוש שלכם בסדר? בואו נבדוק ביחד",
        desc: "נעבור על התלוש שלכם ונבדוק את ההפרשות, הניכויים והזכויות. לפעמים אפשר לגלות פערים שכדאי לברר.",
        cta: "בדיקת תלוש ללא עלות",
        successMsg: "נעבור על התלוש שלכם ונחזור עם ממצאים בהקדם.",
      },
      "business-insurance-guide": {
        title: "בעלי עסק? בואו נבדוק מה מכוסה בעסק שלכם",
        desc: "נעבור על הסיכונים בעסק שלכם ונבנה יחד חבילת ביטוח שמתאימה למה שהעסק צריך.",
        cta: "סקירת ביטוח עסקי",
        successMsg: "ניצור קשר לתיאום סקירת ביטוח עסקי מותאמת.",
      },
      "etf-passive-investing": {
        title: "רוצים להתחיל להשקיע, אבל לא יודעים מאיפה?",
        desc: "לפני שבוחרים קרנות, צריך להבין את התמונה הכוללת. נסתכל ביחד על המצב הפיננסי שלכם ונבנה תוכנית שמתאימה לכם.",
        cta: "שיחת ייעוץ ראשונית",
        successMsg: "נחזור אליכם לשיחה קצרה על התמונה הפיננסית שלכם.",
      },
      "retirement-planning-guide": {
        title: "הפנסיה שלכם תספיק? בואו נבדוק",
        desc: "נכין הערכה פנסיונית אישית: כמה צפוי להיות לכם בפרישה, אם יש פער, ומה אפשר לעשות היום כדי לצמצם אותו.",
        cta: "בדיקת פנסיה ללא עלות",
        successMsg: "נכין עבורכם תחזית פנסיונית אישית ונחזור בהקדם.",
      },
      "compound-interest-power": {
        title: "רוצים לשים את ריבית הדריבית לעבוד בשבילכם?",
        desc: "הצעד הראשון הוא לדעת מאיפה מתחילים. נסתכל ביחד על החיסכונות, הפנסיה, וההשקעות שלכם, ונבנה תוכנית שנותנת לזמן לעבוד לטובתכם.",
        cta: "בניית תוכנית חיסכון",
        successMsg: "נבנה ביחד תוכנית חיסכון מותאמת אישית.",
      },
      "mortgage-insurance-tips": {
        title: "משלמים על ביטוח משכנתא דרך הבנק? כדאי להשוות",
        desc: "נבדוק כמה אתם משלמים היום ונשווה לאפשרויות אחרות, בלי לשנות דבר בכיסוי אלא אם תחליטו.",
        cta: "בדיקת ביטוח משכנתא",
        successMsg: "נבדוק את ביטוח המשכנתא שלכם ונחזור עם השוואת מחירים.",
      },
      "financial-planning-importance": {
        title: "רוצים לעשות סדר בתמונה הפיננסית?",
        desc: "נשב ביחד ונסתכל על הכל: ביטוחים, פנסיה, חיסכונות, הוצאות. בלי מילים מסובכות ובלי לחץ.",
        cta: "פגישת תכנון ללא עלות",
        successMsg: "נתאם פגישת תכנון פיננסי ראשונית, ללא עלות.",
      },
      "child-savings-guide": {
        title: "רוצים לבחור את החיסכון הנכון לילדים?",
        desc: "נשווה ביחד את האפשרויות, קופת גמל, תוכנית חיסכון, או קרן, ונעזור לכם לבחור את מה שמתאים לילדים שלכם לטווח ארוך.",
        cta: "השוואת חיסכון לילדים",
        successMsg: "נכין עבורכם השוואה מותאמת ונחזור בהקדם.",
      },
      "5-insurance-mistakes": {
        title: "יש לכם כפל ביטוחים? בואו נבדוק",
        desc: "קורה שמשלמים על ביטוחים כפולים בלי לדעת. נעבור על הפוליסות שלכם ונבדוק אם יש חפיפות.",
        cta: "בדיקת כפל ביטוחים",
        successMsg: "נעבור על הפוליסות שלכם ונבדוק אם יש חפיפות.",
      },
      "health-insurance-guide": {
        title: "יש לכם ביטוח בריאות, אבל האם הוא מתאים?",
        desc: "נשווה את הפוליסה שלכם מול מה שיש בשוק ונבדוק אם אתם מכוסים נכון, ונסביר מה כדאי לבחון.",
        cta: "השוואת ביטוח בריאות",
        successMsg: "נשווה את הפוליסה שלכם מול השוק ונחזור עם המלצה.",
      },
      "guide-pension-fund": {
        title: "מתי בפעם האחרונה בדקתם את הפנסיה?",
        desc: "נעשה ניתוח תיק פנסיוני מלא: דמי ניהול, מסלול השקעה, כיסויים ביטוחיים, ובדיקה אם נשארו כספים ישנים.",
        cta: "ניתוח פנסיה ללא עלות",
        successMsg: "נכין עבורכם ניתוח תיק פנסיוני מקיף ונחזור בהקדם.",
      },
    };

    const categoryMap: Record<string, { title: string; desc: string; cta: string; successMsg: string }> = {
      "ביטוח": {
        title: "רוצים לבדוק שהכיסוי מתאים?",
        desc: "נעבור על הביטוחים שלכם ונבדוק אם יש כפילויות או חוסרים. בלי התחייבות מצידכם.",
        cta: "סקירת ביטוחים ללא עלות",
        successMsg: "נעבור על הביטוחים שלכם ונחזור עם ממצאים.",
      },
      "פנסיה": {
        title: "הפנסיה שלכם עובדת בשבילכם?",
        desc: "נבדוק את דמי הניהול, מסלול ההשקעה, והכיסויים הביטוחיים, ונסביר מה כדאי לבדוק.",
        cta: "בדיקת פנסיה ללא עלות",
        successMsg: "נבצע בדיקת פנסיה מקצועית ונחזור אליכם בהקדם.",
      },
      "חיסכון": {
        title: "רוצים לסדר את החיסכון?",
        desc: "נסתכל ביחד על אפיקי החיסכון שלכם ונבדוק אם הם מתאימים ליעדים ולרמת הסיכון שלכם.",
        cta: "ייעוץ חיסכון ללא עלות",
        successMsg: "נחזור אליכם לשיחת ייעוץ על אפיקי החיסכון שלכם.",
      },
      "פיננסים": {
        title: "רוצים תמונה פיננסית ברורה?",
        desc: "נסתכל ביחד על הכל: ביטוחים, פנסיה, חיסכונות, השקעות. ונבנה תוכנית שמתאימה למצב ולמטרות שלכם.",
        cta: "פגישת ייעוץ ללא עלות",
        successMsg: "נתאם פגישת ייעוץ ראשונית, ללא עלות וללא התחייבות.",
      },
      "טיפים": {
        title: "רוצים לבדוק אם אפשר לשפר?",
        desc: "בדיקה קצרה יכולה לעזור לראות תשלומים שכדאי לבדוק, על ביטוחים ודמי ניהול, וזכויות שאולי לא מומשו.",
        cta: "בדיקת תיק ללא עלות",
        successMsg: "נבדוק את המצב ונחזור אליכם עם ממצאים ברורים.",
      },
    };

    if (slug && slugMap[slug]) return slugMap[slug];
    if (post?.category && categoryMap[post.category]) return categoryMap[post.category];
    return {
      title: "נהניתם מהמאמר? בואו נדבר",
      desc: "השאירו פרטים ונחזור אליכם לשיחת ייעוץ ראשונית, בלי התחייבות מצידכם.",
      cta: "שלחו ונתחיל",
      successMsg: "נחזור אליכם בהקדם לתיאום שיחה.",
    };
  })();

  const art = artForText(post?.category, post?.title);

  if (loading) {
    return (
      <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
        <Header />
        <div className="flex items-center justify-center gap-3 py-32" role="status">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
          <span className="text-[16px]" style={{ color: MUTED }}>טוענים את הפוסט.</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
        <Header />
        <main className="max-w-3xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
            הפוסט לא נמצא
          </h1>
          <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: BODY }}>
            ייתכן שהכתובת השתנתה או שהפוסט הוסר. כל המדריכים והפוסטים מחכים בבלוג.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/blog" className="btn-primary sm:min-w-[200px]">חזרה לבלוג</Link>
            <Link to="/learn" className="btn-secondary sm:min-w-[200px]">מידע ולמידה</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(art.tone)}>
      <Header />

      <main>
        <PubHero
          crumbs={[
            { label: "דף הבית", to: "/" },
            { label: "בלוג", to: "/blog" },
            ...(post.category ? [{ label: post.category }] : []),
          ]}
          eyebrow={post.category ?? "בלוג"}
          title={post.title}
          lead={post.excerpt ?? undefined}
          art={art.art}
          tint={art.tone}
          meta={
            <>
              {post.published_at && (
                <span className="tabular-nums whitespace-nowrap">{formatDate(post.published_at)}</span>
              )}
              <span aria-hidden="true">·</span>
              <span>
                <span dir="ltr" className="tabular-nums">{readMinutes(post.content)}</span> דקות קריאה
              </span>
              <span aria-hidden="true">·</span>
              <span>מאת צוות שילד</span>
            </>
          }
        />

        {/* THE READING SURFACE */}
        <SdBand tone="white" id="post">
          <div className="sd-wrap sd-read-layout">
            <article className="sd-read-col">
              {/* The post's own photo when it has one; a stock photo is replaced by the hero illustration. */}
              {post.cover_image_url && !isStockPhoto(post.cover_image_url) && (
                <div className="rounded-2xl overflow-hidden border bg-white mb-10" style={{ borderColor: LINE }}>
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full aspect-[16/9] object-cover"
                    decoding="async"
                  />
                </div>
              )}

              <PubTocInline items={body.toc} />

              <div
                className="sd-prose prose max-w-none"
                dangerouslySetInnerHTML={{ __html: body.html }}
              />

              {/* Share */}
              <div className="sd-share">
                <p className="text-[14px] font-bold mb-4" style={{ color: GREEN }}>שיתוף הפוסט</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={shareWhatsApp} className="btn-secondary !min-h-[44px] !px-5 text-[15px]">
                    <BrandIcon name="message" size={18} />
                    WhatsApp
                  </button>
                  <button type="button" onClick={copyLink} className="btn-secondary !min-h-[44px] !px-5 text-[15px]">
                    <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    העתקת קישור
                  </button>
                </div>
              </div>
            </article>

            <PubTocAside items={body.toc} art={art.art} tone={art.tone} />
          </div>
        </SdBand>

        {/* LEAD CAPTURE — the page's own action, on a white band */}
        <section id="lead-form" ref={leadFormRef} className={`sd-band sd-band-${art.tone === "sage" ? "sky" : "sage"} scroll-mt-24`}>
          <div className="sd-wrap-narrow sd-pub-panel !max-w-[760px]">
            {leadSubmitted ? (
              <div role="status">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  קיבלנו את הפרטים.
                </h2>
                <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: BODY }}>
                  {leadFormText.successMsg}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  {leadFormText.title}
                </h2>
                <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>
                  {leadFormText.desc}
                </p>

                <form onSubmit={handleLeadSubmit} noValidate className="mt-8 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="blog-lead-name" required>שם מלא</FieldLabel>
                      <input
                        id="blog-lead-name"
                        type="text"
                        autoComplete="name"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        className="field"
                        aria-invalid={leadErrors.name ? "true" : undefined}
                        aria-describedby={leadErrors.name ? "blog-lead-name-err" : undefined}
                      />
                      <FieldError id="blog-lead-name-err">{leadErrors.name}</FieldError>
                    </div>
                    <div>
                      <FieldLabel htmlFor="blog-lead-phone" required>טלפון</FieldLabel>
                      <input
                        id="blog-lead-phone"
                        type="tel"
                        autoComplete="tel"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="field"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                        aria-invalid={leadErrors.phone ? "true" : undefined}
                        aria-describedby={leadErrors.phone ? "blog-lead-phone-err" : undefined}
                      />
                      <FieldError id="blog-lead-phone-err">{leadErrors.phone}</FieldError>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="blog-lead-email">
                        אימייל <span className="font-normal" style={{ color: MUTED }}>(לא חובה)</span>
                      </FieldLabel>
                      <input
                        id="blog-lead-email"
                        type="email"
                        autoComplete="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        className="field"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                        aria-invalid={leadErrors.email ? "true" : undefined}
                        aria-describedby={leadErrors.email ? "blog-lead-email-err" : undefined}
                      />
                      <FieldError id="blog-lead-email-err">{leadErrors.email}</FieldError>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-5">
                    <button type="submit" disabled={leadSubmitting} className="btn-primary min-w-[200px]">
                      {leadSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : leadFormText.cta}
                    </button>
                    <span className="text-[14px]" style={{ color: MUTED }}>ללא עלות וללא התחייבות.</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* RELATED POSTS */}
        {related.length > 0 && (
          <SdBand tone="cream" id="related">
            <div className="sd-wrap">
              <PubHead title="מאמרים נוספים" />
              <div className="sd-pub-grid sd-pub-grid-3">
                {related.map((r) => {
                  const a = artForText(r.category, r.title);
                  return (
                    <PubArticleCard
                      key={r.id}
                      to={`/blog/${r.slug}`}
                      title={r.title}
                      kicker={r.category ?? undefined}
                      meta={
                        <>
                          {r.published_at && <span className="tabular-nums whitespace-nowrap">{formatDate(r.published_at)}</span>}
                          <span aria-hidden="true"> · </span>
                          <span><span dir="ltr" className="tabular-nums">{readMinutes(r.content)}</span> דקות קריאה</span>
                        </>
                      }
                      excerpt={r.excerpt}
                      art={a.art}
                      tone={a.tone}
                    />
                  );
                })}
              </div>
            </div>
          </SdBand>
        )}

        <PubClose
          title="רוצים לראות את התמונה המלאה של התיק שלכם?"
          text="בדיקת תיק 360 מסכמת את הביטוחים, הפנסיה והחיסכון בתמונה אחת. ללא עלות וללא התחייבות."
          art="10-financial-planning"
        />
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
