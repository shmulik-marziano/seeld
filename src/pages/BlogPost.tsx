import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { usePageSeo } from "@/hooks/usePageSeo";
import { toast } from "sonner";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, RUST, RUST_TEXT, SAGE_ON_GREEN } from "@/lib/brand";

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
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [leadErrors, setLeadErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const leadFormRef = useRef<HTMLDivElement>(null);

  usePageSeo(post?.title, post?.excerpt);

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
        desc: "הרבה אנשים מגלים שהכיסוי שלהם חלקי, חסר, או כפול, ומשלמים על זה. נבדוק את הפוליסות שלכם ונוודא שאתם מוגנים באמת.",
        cta: "בדיקת כיסוי אכ״ע",
        successMsg: "נבדוק את הכיסוי שלכם ונחזור עם ממצאים בהקדם.",
      },
      "israel-capital-market-2026": {
        title: "רוצים לדעת איפה אתם עומדים מבחינת השקעות?",
        desc: "נסתכל ביחד על התמונה המלאה: פנסיה, קרן השתלמות, חסכונות, ותיק השקעות. נראה מה עובד, מה חסר, ומה אפשר לשפר.",
        cta: "בדיקת תיק ללא עלות",
        successMsg: "נכין לכם ניתוח תיק השקעות מותאם ונחזור בהקדם.",
      },
      "nursing-care-insurance": {
        title: "יש לכם כיסוי סיעודי? בואו נבדוק",
        desc: "רוב האנשים לא יודעים מה בדיוק הביטוח הסיעודי שלהם מכסה, ומתי הוא נגמר. נעשה לכם סדר בשכבות הכיסוי ונוודא שאין חורים.",
        cta: "בדיקת כיסוי סיעודי",
        successMsg: "נבדוק את הכיסוי הסיעודי שלכם ונחזור עם המלצות.",
      },
      "training-fund-guide": {
        title: "משלמים דמי ניהול גבוהים בקרן ההשתלמות?",
        desc: "דמי ניהול גבוהים אוכלים את הרווח שלכם בשקט. נבדוק את הקרן שלכם, נשווה מול השוק, וננהל עבורכם משא ומתן, בחינם.",
        cta: "בדיקת דמי ניהול",
        successMsg: "נבדוק את קרן ההשתלמות שלכם ונחזור עם השוואה מול השוק.",
      },
      "payslip-checklist": {
        title: "חושבים שהתלוש שלכם בסדר? בואו נבדוק ביחד",
        desc: "נעבור על התלוש שלכם ונוודא שההפרשות, הניכויים, והזכויות מחושבים נכון. הרבה פעמים מגלים כסף שפשוט הלך לאיבוד.",
        cta: "בדיקת תלוש ללא עלות",
        successMsg: "נעבור על התלוש שלכם ונחזור עם ממצאים בהקדם.",
      },
      "business-insurance-guide": {
        title: "בעלי עסק? בואו נוודא שהעסק שלכם מוגן",
        desc: "נעשה סקירה מקצועית של כל הסיכונים בעסק שלכם ונבנה חבילת ביטוח שמכסה את מה שבאמת צריך, בלי לשלם על מיותרים.",
        cta: "סקירת ביטוח עסקי",
        successMsg: "ניצור קשר לתיאום סקירת ביטוח עסקי מותאמת.",
      },
      "etf-passive-investing": {
        title: "רוצים להתחיל להשקיע, אבל לא יודעים מאיפה?",
        desc: "לפני שבוחרים קרנות, צריך להבין את התמונה הכוללת. נסתכל ביחד על המצב הפיננסי שלכם ונבנה תוכנית שמתאימה בדיוק לכם.",
        cta: "שיחת ייעוץ ראשונית",
        successMsg: "נחזור אליכם לשיחה קצרה על התמונה הפיננסית שלכם.",
      },
      "retirement-planning-guide": {
        title: "הפנסיה שלכם תספיק? בואו נבדוק",
        desc: "נעשה לכם תחזית פנסיונית אישית, כמה תקבלו, מה הפער, ומה אפשר לעשות היום כדי לסגור אותו. שיחה קצרה שיכולה לשנות את הפרישה שלכם.",
        cta: "בדיקת פנסיה ללא עלות",
        successMsg: "נכין עבורכם תחזית פנסיונית אישית ונחזור בהקדם.",
      },
      "compound-interest-power": {
        title: "רוצים לשים את ריבית הדריבית לעבוד בשבילכם?",
        desc: "הצעד הראשון הוא לדעת מאיפה מתחילים. נסתכל ביחד על החיסכונות, הפנסיה, וההשקעות שלכם, ונבנה תוכנית שהזמן עובד לטובתה.",
        cta: "בניית תוכנית חיסכון",
        successMsg: "נבנה ביחד תוכנית חיסכון מותאמת אישית.",
      },
      "mortgage-insurance-tips": {
        title: "משלמים על ביטוח משכנתא דרך הבנק? כדאי להשוות",
        desc: "נבדוק כמה אתם משלמים היום ונשווה מול השוק, בלי לשנות כלום בכיסוי.",
        cta: "בדיקת ביטוח משכנתא",
        successMsg: "נבדוק את ביטוח המשכנתא שלכם ונחזור עם השוואת מחירים.",
      },
      "financial-planning-importance": {
        title: "רוצים לעשות סדר בתמונה הפיננסית?",
        desc: "נשב ביחד ונסתכל על הכל: ביטוחים, פנסיה, חיסכונות, הוצאות. בלי מילים מסובכות, בלי לחץ. פשוט שיחה שנותנת בהירות.",
        cta: "פגישת תכנון ללא עלות",
        successMsg: "נתאם פגישת תכנון פיננסי ראשונית, ללא עלות.",
      },
      "child-savings-guide": {
        title: "רוצים לבחור את החיסכון הנכון לילדים?",
        desc: "נשווה ביחד את האפשרויות, קופת גמל, תוכנית חיסכון, או קרן, ונמצא את מה שנותן הכי הרבה ערך לילדים שלכם לטווח ארוך.",
        cta: "השוואת חיסכון לילדים",
        successMsg: "נכין עבורכם השוואה מותאמת ונחזור בהקדם.",
      },
      "5-insurance-mistakes": {
        title: "יש לכם כפל ביטוחים? בואו נבדוק",
        desc: "הרבה אנשים משלמים על ביטוחים כפולים בלי לדעת. נעשה סריקה מקצועית של כל הפוליסות שלכם, ונחסוך לכם מה שמיותר.",
        cta: "בדיקת כפל ביטוחים",
        successMsg: "נעבור על הפוליסות שלכם ונזהה חפיפות וחיסכון אפשרי.",
      },
      "health-insurance-guide": {
        title: "יש לכם ביטוח בריאות, אבל האם הוא מתאים?",
        desc: "נשווה את הפוליסה שלכם מול מה שיש בשוק ונבדוק אם אתם מכוסים נכון, בלי לשלם על מה שלא צריך.",
        cta: "השוואת ביטוח בריאות",
        successMsg: "נשווה את הפוליסה שלכם מול השוק ונחזור עם המלצה.",
      },
      "guide-pension-fund": {
        title: "מתי בפעם האחרונה בדקתם את הפנסיה?",
        desc: "נעשה ניתוח תיק פנסיוני מלא: דמי ניהול, מסלול השקעה, כיסויים ביטוחיים, וכספים ישנים שאולי שכחתם.",
        cta: "ניתוח פנסיה ללא עלות",
        successMsg: "נכין עבורכם ניתוח תיק פנסיוני מקיף ונחזור בהקדם.",
      },
    };

    const categoryMap: Record<string, { title: string; desc: string; cta: string; successMsg: string }> = {
      "ביטוח": {
        title: "רוצים לוודא שאתם מכוסים נכון?",
        desc: "נעשה סקירת ביטוחים מקצועית ונוודא שאין כפילויות, חורים, או תשלומים מיותרים. ללא עלות וללא התחייבות.",
        cta: "סקירת ביטוחים ללא עלות",
        successMsg: "נעבור על הביטוחים שלכם ונחזור עם ממצאים.",
      },
      "פנסיה": {
        title: "הפנסיה שלכם עובדת בשבילכם?",
        desc: "נבדוק את דמי הניהול, מסלול ההשקעה, והכיסויים הביטוחיים, ונוודא שכל שקל עובד בשבילכם.",
        cta: "בדיקת פנסיה ללא עלות",
        successMsg: "נבצע בדיקת פנסיה מקצועית ונחזור אליכם בהקדם.",
      },
      "חיסכון": {
        title: "רוצים לחסוך חכם יותר?",
        desc: "נסתכל ביחד על אפיקי החיסכון שלכם ונמצא את הדרך להפיק מהם יותר, בלי סיכונים מיותרים.",
        cta: "ייעוץ חיסכון ללא עלות",
        successMsg: "נחזור אליכם לשיחת ייעוץ על אפיקי החיסכון שלכם.",
      },
      "פיננסים": {
        title: "רוצים תמונה פיננסית ברורה?",
        desc: "נסתכל ביחד על הכל: ביטוחים, פנסיה, חיסכונות, השקעות. ונבנה תוכנית שמתאימה בדיוק למצב ולמטרות שלכם.",
        cta: "פגישת ייעוץ ללא עלות",
        successMsg: "נתאם פגישת ייעוץ ראשונית, ללא עלות וללא התחייבות.",
      },
      "טיפים": {
        title: "רוצים לוודא שאתם לא מפסידים כסף?",
        desc: "בדיקה קצרה יכולה לחשוף תשלומים מיותרים, על ביטוחים, דמי ניהול, או זכויות שלא מנצלים.",
        cta: "בדיקת תיק ללא עלות",
        successMsg: "נבדוק את המצב ונחזור אליכם עם ממצאים ברורים.",
      },
    };

    if (slug && slugMap[slug]) return slugMap[slug];
    if (post?.category && categoryMap[post.category]) return categoryMap[post.category];
    return {
      title: "נהניתם מהמאמר? בואו נדבר",
      desc: "השאירו פרטים ונחזור אליכם לשיחת ייעוץ ראשונית, ללא עלות וללא התחייבות.",
      cta: "שלחו ונתחיל",
      successMsg: "נחזור אליכם בהקדם לתיאום שיחה.",
    };
  })();

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
          <BrandDots className="mb-5" />
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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* THE READING SURFACE */}
        <section>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-12">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <Link to="/blog" className="hover:underline underline-offset-4">בלוג</Link>
              {post.category && (
                <>
                  <BrandIcon name="arrow-left" size={14} />
                  <span className="font-bold" style={{ color: GREEN }} aria-current="page">{post.category}</span>
                </>
              )}
            </nav>

            <BrandDots className="mb-5" />
            <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
              {post.title}
            </h1>

            <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px]" style={{ color: MUTED }}>
              {post.published_at && (
                <span className="tabular-nums whitespace-nowrap">{formatDate(post.published_at)}</span>
              )}
              <span aria-hidden="true">·</span>
              <span>
                <span dir="ltr" className="tabular-nums">{readMinutes(post.content)}</span> דקות קריאה
              </span>
              {post.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>מאת {post.author}</span>
                </>
              )}
            </p>

            {post.excerpt && (
              <p className="mt-6 text-[17px] sm:text-[18px] leading-[1.7]" style={{ color: MUTED }}>
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Cover image — the post's own, kept when it has one */}
          {post.cover_image_url && (
            <div className="max-w-3xl mx-auto px-5 sm:px-8">
              <div className="rounded-2xl overflow-hidden border bg-white" style={{ borderColor: LINE }}>
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full aspect-[16/9] object-cover"
                  decoding="async"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <article className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div
              className="prose max-w-none
                prose-headings:text-[#003D30] prose-headings:font-bold prose-headings:leading-tight
                prose-h2:text-[26px] sm:prose-h2:text-[30px] prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-[20px] prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-[#24483C]
                prose-li:text-[17px] prose-li:leading-[1.8] prose-li:text-[#24483C] prose-li:marker:text-[#819B7D]
                prose-strong:text-[#003D30] prose-strong:font-bold
                prose-a:text-[#003D30] prose-a:font-bold prose-a:underline prose-a:underline-offset-4
                prose-blockquote:border-s-4 prose-blockquote:border-[#819B7D] prose-blockquote:bg-[#EEF2EC] prose-blockquote:not-italic prose-blockquote:rounded-e-xl prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:text-[#24483C]
                prose-img:rounded-2xl prose-hr:border-[#CCD6CC]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share */}
            <div className="mt-14 border-t pt-6" style={{ borderColor: LINE }}>
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
        </section>

        {/* LEAD CAPTURE — the page's own action, on a white band */}
        <section id="lead-form" ref={leadFormRef} className="scroll-mt-24 border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <BrandDots className="mb-4" />
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
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
              <div className="mb-8 sm:mb-10">
                <BrandDots className="mb-4" />
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  מאמרים נוספים
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="dna-concept dna-hover group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                  >
                    <h3 className="text-[18px] leading-snug" style={{ color: GREEN }}>{r.title}</h3>
                    <p className="mt-2 text-[14px]" style={{ color: MUTED }}>
                      {r.published_at && (
                        <span className="tabular-nums whitespace-nowrap">{formatDate(r.published_at)}</span>
                      )}
                      <span aria-hidden="true"> · </span>
                      <span><span dir="ltr" className="tabular-nums">{readMinutes(r.content)}</span> דקות קריאה</span>
                    </p>
                    {r.excerpt && (
                      <p className="mt-3 text-[15px] leading-[1.7] line-clamp-3" style={{ color: BODY }}>{r.excerpt}</p>
                    )}
                    <span className="link-rule mt-auto pt-5 text-[15px] self-start">
                      לקריאה
                      <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              רוצים לראות את התמונה המלאה של התיק שלכם?
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

export default BlogPost;
