import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, User, ArrowRight, Share2, Copy, Loader2, Send, CheckCircle2 } from "lucide-react";
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
  cover_image_url: string | null;
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

  const accentColor = categoryColors[post?.category || ""] || "#0a3d3d";

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
      <section className="relative overflow-hidden bg-[#f8f9fc] dark:bg-gray-900 py-12 sm:py-24">
        {/* Decorative circles - mobile-aware */}
        <div
          className="absolute top-6 right-4 sm:top-8 sm:right-12 w-16 h-16 sm:w-28 sm:h-28 rounded-full opacity-20"
          style={{ backgroundColor: accentColor }}
        />
        <div className="absolute bottom-6 left-8 sm:bottom-8 sm:left-20 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#f4a261] opacity-15" />
        <div className="absolute top-1/3 left-4 sm:left-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#90be6d] opacity-15 hidden sm:block" />

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
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a3d3d] dark:text-white leading-tight mb-5 sm:mb-6">
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

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="max-w-4xl mx-auto px-4 -mt-8 sm:-mt-12 relative z-20">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#0a3d3d]/10">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-56 sm:h-72 lg:h-96 object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
        <div
          className="prose prose-base sm:prose-lg max-w-none dark:prose-invert
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
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 min-h-[44px]"
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-[#f8f9fc] dark:bg-gray-800 text-[#0a3d3d] dark:text-white/70 hover:bg-[#0a3d3d]/10 transition-all min-h-[44px]"
            >
              <Copy className="w-4 h-4" />
              העתק קישור
            </button>
          </div>
        </div>
      </article>

      {/* Lead Capture Form */}
      <section id="lead-form" ref={leadFormRef} className="py-12 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: `linear-gradient(135deg, #0a3d3d 0%, #145555 60%, ${accentColor}90 100%)` }}
          >
            {/* Top decorative bar */}
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, #f4a261, #5ec6c6)` }} />

            <div className="px-6 sm:px-12 py-10 sm:py-14">
              {leadSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 text-[#5ec6c6] mx-auto mb-5" />
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                    תודה! קיבלנו את הפרטים
                  </h3>
                  <p className="text-white/70 text-lg">
                    {leadFormText.successMsg}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8 sm:mb-10">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                      {leadFormText.title}
                    </h3>
                    <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">
                      {leadFormText.desc}
                    </p>
                  </div>

                  <form onSubmit={handleLeadSubmit} className="space-y-5 max-w-lg mx-auto">
                    <div>
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="שם מלא *"
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#5ec6c6] focus:ring-2 focus:ring-[#5ec6c6]/30 transition-all text-base"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        placeholder="טלפון *"
                        dir="ltr"
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#5ec6c6] focus:ring-2 focus:ring-[#5ec6c6]/30 transition-all text-base text-right"
                      />
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="אימייל (לא חובה)"
                        dir="ltr"
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#5ec6c6] focus:ring-2 focus:ring-[#5ec6c6]/30 transition-all text-base text-right"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="w-full bg-[#5ec6c6] hover:bg-[#4db8b8] text-white rounded-xl px-8 py-4 font-bold text-lg transition-all hover:shadow-lg hover:shadow-[#5ec6c6]/30 min-h-[56px] flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {leadSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {leadFormText.cta}
                        </>
                      )}
                    </button>
                    <p className="text-center text-white/40 text-xs">
                      ללא עלות וללא התחייבות. נחזור אליכם בהקדם.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

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
