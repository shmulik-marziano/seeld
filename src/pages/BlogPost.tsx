import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Copy, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { toast } from "sonner";
import { MONO, FAINT, CARD_SHADOW } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const leadFormRef = useRef<HTMLDivElement>(null);

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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;
    setLeadSubmitting(true);

    try {
      const subject = post?.category || "בלוג";
      const { error } = await siteSupabase.from("contact_submissions").insert([{
        name: leadForm.name,
        email: leadForm.email || null,
        subject: `ליד מבלוג: ${post?.title || ""}`,
        message: `טלפון: ${leadForm.phone}\nמקור: בלוג — ${post?.title}\nקטגוריה: ${subject}`
      }]);

      if (error) throw error;

      try {
        await siteSupabase.functions.invoke("send-lead-notification", {
          body: {
            type: "blog",
            leadData: {
              fullName: leadForm.name,
              phone: leadForm.phone,
              email: leadForm.email,
              insuranceType: `בלוג: ${post?.title}`
            }
          }
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      setLeadSubmitted(true);
      setLeadForm({ name: "", phone: "", email: "" });
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
    } catch (error) {
      toast.error("שגיאה בשליחה, נסו שוב.");
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
      // ——— New 10 posts ———
      "disability-insurance-guide": {
        title: "רוצים לדעת אם יש לכם כיסוי לאובדן כושר עבודה?",
        desc: "הרבה אנשים מגלים שהכיסוי שלהם חלקי, חסר, או כפול — ומשלמים על זה. נבדוק את הפוליסות שלכם ונוודא שאתם מוגנים באמת.",
        cta: "בדיקת כיסוי אכ״ע",
        successMsg: "נבדוק את הכיסוי שלכם ונחזור עם ממצאים תוך יום עסקים.",
      },
      "israel-capital-market-2026": {
        title: "רוצים לדעת איפה אתם עומדים מבחינת השקעות?",
        desc: "נסתכל ביחד על התמונה המלאה — פנסיה, קרן השתלמות, חסכונות, ותיק השקעות. נראה מה עובד, מה חסר, ומה אפשר לשפר.",
        cta: "ניתוח תיק חינם",
        successMsg: "נכין לכם ניתוח תיק השקעות מותאם ונחזור בהקדם.",
      },
      "nursing-care-insurance": {
        title: "יש לכם כיסוי סיעודי? בואו נבדוק",
        desc: "רוב האנשים לא יודעים מה בדיוק הביטוח הסיעודי שלהם מכסה — ומתי הוא נגמר. נעשה לכם סדר בשכבות הכיסוי ונוודא שאין חורים.",
        cta: "בדיקת כיסוי סיעודי",
        successMsg: "נבדוק את הכיסוי הסיעודי שלכם ונחזור עם המלצות.",
      },
      "training-fund-guide": {
        title: "משלמים דמי ניהול גבוהים בקרן ההשתלמות?",
        desc: "דמי ניהול גבוהים אוכלים את הרווח שלכם בשקט. נבדוק את הקרן שלכם, נשווה מול השוק, וננהל עבורכם משא ומתן — בחינם.",
        cta: "בדיקת דמי ניהול",
        successMsg: "נבדוק את קרן ההשתלמות שלכם ונחזור עם השוואה מול השוק.",
      },
      "payslip-checklist": {
        title: "חושבים שהתלוש שלכם בסדר? בואו נבדוק ביחד",
        desc: "נעבור על התלוש שלכם ונוודא שההפרשות, הניכויים, והזכויות מחושבים נכון. הרבה פעמים מגלים כסף שפשוט הלך לאיבוד.",
        cta: "בדיקת תלוש חינם",
        successMsg: "נעבור על התלוש שלכם ונחזור עם ממצאים תוך יום עסקים.",
      },
      "business-insurance-guide": {
        title: "בעלי עסק? בואו נוודא שהעסק שלכם מוגן",
        desc: "נעשה סקירה מקצועית של כל הסיכונים בעסק שלכם ונבנה חבילת ביטוח שמכסה את מה שבאמת צריך — בלי לשלם על מיותרים.",
        cta: "סקירת ביטוח עסקי",
        successMsg: "ניצור קשר לתיאום סקירת ביטוח עסקי מותאמת.",
      },
      "etf-passive-investing": {
        title: "רוצים להתחיל להשקיע — אבל לא יודעים מאיפה?",
        desc: "לפני שבוחרים קרנות, צריך להבין את התמונה הכוללת. נסתכל ביחד על המצב הפיננסי שלכם ונבנה תוכנית שמתאימה בדיוק לכם.",
        cta: "שיחת ייעוץ ראשונית",
        successMsg: "נחזור אליכם לשיחה קצרה על התמונה הפיננסית שלכם.",
      },
      "retirement-planning-guide": {
        title: "הפנסיה שלכם תספיק? בואו נבדוק",
        desc: "נעשה לכם תחזית פנסיונית אישית — כמה תקבלו, מה הפער, ומה אפשר לעשות היום כדי לסגור אותו. 15 דקות שיכולות לשנות את הפרישה שלכם.",
        cta: "בדיקת פנסיה חינם",
        successMsg: "נכין עבורכם תחזית פנסיונית אישית ונחזור בהקדם.",
      },
      "compound-interest-power": {
        title: "רוצים לשים את ריבית הדריבית לעבוד בשבילכם?",
        desc: "הצעד הראשון הוא לדעת מאיפה מתחילים. נסתכל ביחד על החיסכונות, הפנסיה, וההשקעות שלכם — ונבנה תוכנית שהזמן עובד לטובתה.",
        cta: "בניית תוכנית חיסכון",
        successMsg: "נבנה ביחד תוכנית חיסכון מותאמת אישית.",
      },
      "mortgage-insurance-tips": {
        title: "משלמים על ביטוח משכנתא דרך הבנק? כנראה משלמים יותר מדי",
        desc: "ב-5 דקות נבדוק כמה אתם משלמים היום ונשווה מול השוק. רוב הלקוחות שלנו חוסכים אלפי שקלים — בלי לשנות כלום בכיסוי.",
        cta: "בדיקת ביטוח משכנתא",
        successMsg: "נבדוק את ביטוח המשכנתא שלכם ונחזור עם השוואת מחירים.",
      },
      // ——— Original 5 posts ———
      "financial-planning-importance": {
        title: "רוצים לעשות סדר בתמונה הפיננסית?",
        desc: "נשב ביחד ונסתכל על הכל — ביטוחים, פנסיה, חיסכונות, הוצאות. בלי מילים מסובכות, בלי לחץ. פשוט שיחה שנותנת בהירות.",
        cta: "פגישת תכנון חינם",
        successMsg: "נתאם פגישת תכנון פיננסי ראשונית — ללא עלות.",
      },
      "child-savings-guide": {
        title: "רוצים לבחור את החיסכון הנכון לילדים?",
        desc: "נשווה ביחד את האפשרויות — קופת גמל, תוכנית חיסכון, או קרן — ונמצא את מה שנותן הכי הרבה ערך לילדים שלכם לטווח ארוך.",
        cta: "השוואת חיסכון לילדים",
        successMsg: "נכין עבורכם השוואה מותאמת ונחזור בהקדם.",
      },
      "5-insurance-mistakes": {
        title: "יש לכם כפל ביטוחים? בואו נבדוק",
        desc: "הרבה אנשים משלמים על ביטוחים כפולים בלי לדעת. נעשה סריקה מקצועית של כל הפוליסות שלכם — ונחסוך לכם מה שמיותר.",
        cta: "בדיקת כפל ביטוחים",
        successMsg: "נעבור על הפוליסות שלכם ונזהה חפיפות וחיסכון אפשרי.",
      },
      "health-insurance-guide": {
        title: "יש לכם ביטוח בריאות — אבל האם הוא מתאים?",
        desc: "נשווה את הפוליסה שלכם מול מה שיש בשוק ונבדוק אם אתם מכוסים נכון, בלי לשלם על מה שלא צריך.",
        cta: "השוואת ביטוח בריאות",
        successMsg: "נשווה את הפוליסה שלכם מול השוק ונחזור עם המלצה.",
      },
      "guide-pension-fund": {
        title: "מתי בפעם האחרונה בדקתם את הפנסיה?",
        desc: "נעשה ניתוח תיק פנסיוני מלא — דמי ניהול, מסלול השקעה, כיסויים ביטוחיים, וכספים ישנים שאולי שכחתם. זה לוקח 15 דקות ויכול לחסוך אלפים.",
        cta: "ניתוח פנסיה חינם",
        successMsg: "נכין עבורכם ניתוח תיק פנסיוני מקיף ונחזור בהקדם.",
      },
    };

    const categoryMap: Record<string, { title: string; desc: string; cta: string; successMsg: string }> = {
      "ביטוח": {
        title: "רוצים לוודא שאתם מכוסים נכון?",
        desc: "נעשה סקירת ביטוחים מקצועית ונוודא שאין כפילויות, חורים, או תשלומים מיותרים. ללא עלות וללא התחייבות.",
        cta: "סקירת ביטוחים חינם",
        successMsg: "נעבור על הביטוחים שלכם ונחזור עם ממצאים.",
      },
      "פנסיה": {
        title: "הפנסיה שלכם עובדת בשבילכם?",
        desc: "נבדוק את דמי הניהול, מסלול ההשקעה, והכיסויים הביטוחיים — ונוודא שכל שקל עובד בשבילכם.",
        cta: "בדיקת פנסיה חינם",
        successMsg: "נבצע בדיקת פנסיה מקצועית ונחזור אליכם בהקדם.",
      },
      "חיסכון": {
        title: "רוצים לחסוך חכם יותר?",
        desc: "נסתכל ביחד על אפיקי החיסכון שלכם ונמצא את הדרך להפיק מהם יותר — בלי סיכונים מיותרים.",
        cta: "ייעוץ חיסכון חינם",
        successMsg: "נחזור אליכם לשיחת ייעוץ על אפיקי החיסכון שלכם.",
      },
      "פיננסים": {
        title: "רוצים תמונה פיננסית ברורה?",
        desc: "נסתכל ביחד על הכל — ביטוחים, פנסיה, חיסכונות, השקעות. ונבנה תוכנית שמתאימה בדיוק למצב ולמטרות שלכם.",
        cta: "פגישת ייעוץ חינם",
        successMsg: "נתאם פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות.",
      },
      "טיפים": {
        title: "רוצים לוודא שאתם לא מפסידים כסף?",
        desc: "בדיקה קצרה יכולה לחשוף אלפי שקלים שאתם משלמים מיותר — על ביטוחים, דמי ניהול, או זכויות שלא מנצלים.",
        cta: "בדיקה חינם",
        successMsg: "נבדוק את המצב ונחזור אליכם עם ממצאים ברורים.",
      },
    };

    if (slug && slugMap[slug]) return slugMap[slug];
    if (post?.category && categoryMap[post.category]) return categoryMap[post.category];
    return {
      title: "נהניתם מהמאמר? בואו נדבר",
      desc: "השאירו פרטים ונחזור אליכם לשיחת ייעוץ ראשונית — ללא עלות וללא התחייבות.",
      cta: "דברו איתי",
      successMsg: "אחד מהמומחים שלנו יחזור אליכם בהקדם.",
    };
  })();

  const darkInputClass =
    "w-full px-0 py-3.5 bg-transparent border-b border-white/25 text-[#fafafa] placeholder:text-[#fafafa]/40 text-base focus:outline-none focus:border-[#fafafa] transition-colors min-h-[44px] rounded-none";

  if (loading) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <Header />
        <div className="flex justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#171717]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <Header />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-32">
          <div className="border-t border-[#171717]/20 pt-5">
            <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: FAINT }}>
              404 · POST
            </span>
          </div>
          <h1
            className="mt-6 text-3xl text-[#171717]"
            style={{ fontFamily: HEEBO, fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            הפוסט לא נמצא
          </h1>
          <p className="mt-3 text-base text-[#171717]/60 leading-[1.8]">
            ייתכן שהכתובת השתנתה או שהפוסט הוסר.
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#262626] transition-colors min-h-[52px]"
          >
            חזרה לבלוג
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-12">
          <div className="border-t border-[#171717]/20 pt-4">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#171717]/50 hover:text-[#171717] transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              חזרה לבלוג
            </Link>
          </div>

          <div className="mt-10 sm:mt-12">
            <div className="flex flex-wrap items-baseline gap-3 text-[12px] text-[#171717]/45 mb-4">
              {post.category && (
                <>
                  <span>{post.category}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{formatDate(post.published_at)}</span>
              {post.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>מאת {post.author}</span>
                </>
              )}
            </div>

            <h1
              className="text-[#171717] leading-[1.2]"
              style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.025em" }}
            >
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="rounded-lg overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-56 sm:h-72 lg:h-96 object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <div
          className="prose prose-base sm:prose-lg max-w-none
            prose-headings:text-[#171717] prose-headings:font-semibold
            prose-p:text-[#171717]/70 prose-p:leading-[1.9]
            prose-li:text-[#171717]/70
            prose-strong:text-[#171717] prose-strong:font-semibold
            prose-a:text-[#171717] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="mt-14 border-t border-[#171717]/15 pt-6">
          <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: FAINT }}>
            SHARE
          </span>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-[14px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors min-h-[44px]"
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.157-2.625.78.78-2.625-.157-.252A8 8 0 1112 20z" />
              </svg>
              WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-[14px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors min-h-[44px]"
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
            >
              <Copy className="w-4 h-4" />
              העתק קישור
            </button>
          </div>
        </div>
      </article>

      {/* Lead Capture — the one dark band */}
      <section id="lead-form" ref={leadFormRef} style={{ backgroundColor: "#171717" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          {leadSubmitted ? (
            <div className="border-t border-white/20 pt-6">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: "rgba(250,250,250,.6)" }}>
                SENT
              </span>
              <h3
                className="mt-4 text-[#fafafa]"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}
              >
                תודה! קיבלנו את הפרטים
              </h3>
              <p className="mt-3 text-base text-[#fafafa]/55 leading-[1.85]">
                {leadFormText.successMsg}
              </p>
            </div>
          ) : (
            <div className="border-t border-white/20 pt-6">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: "rgba(250,250,250,.6)" }}>
                CONSULT · FREE
              </span>
              <h3
                className="mt-4 text-[#fafafa] leading-tight"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}
              >
                {leadFormText.title}
              </h3>
              <p className="mt-3 text-base text-[#fafafa]/55 leading-[1.85] max-w-xl">
                {leadFormText.desc}
              </p>

              <form onSubmit={handleLeadSubmit} className="mt-10 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  <input
                    type="text"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="שם מלא *"
                    className={darkInputClass}
                  />
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    placeholder="טלפון *"
                    dir="ltr"
                    className={darkInputClass}
                    style={{ textAlign: "right" }}
                  />
                </div>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="אימייל (לא חובה)"
                  className={`${darkInputClass} mt-5`}
                />
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors disabled:opacity-60 min-h-[52px] min-w-[180px]"
                  >
                    {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : leadFormText.cta}
                  </button>
                  <span className="text-[12px] text-[#fafafa]/55">
                    ללא עלות וללא התחייבות. נחזור אליכם בהקדם.
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Related Posts — hairline rows */}
      {related.length > 0 && (
        <section style={{ backgroundColor: "#fafafa" }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-[#171717]/20 pt-6 mb-8">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.4rem, 2.6vw, 1.8rem)", letterSpacing: "-0.02em" }}
              >
                מאמרים נוספים
              </h2>
            </div>
            <div>
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group flex items-baseline justify-between gap-6 py-5 border-b border-[#171717]/10 hover:border-[#171717]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg text-[#171717] leading-snug" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="mt-1.5 text-[14px] text-[#171717]/50 leading-[1.7] line-clamp-2">
                        {r.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="text-[#171717]/30 group-hover:text-[#171717] transition-all group-hover:-translate-x-1 shrink-0" aria-hidden="true">
                    ←
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
