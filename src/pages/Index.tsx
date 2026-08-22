import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import CompanyLogos from "@/components/CompanyLogos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CountUp, LiveDot, StatusPill } from "@/components/brand/Live";
import { DrawSpark, ProgressRail } from "@/components/brand/Strokes";
import { CastAvi, CastDana, CastReader } from "@/components/brand/Cast";
import {
  BODY, DISPLAY, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, TURQ, TURQ_TEXT,
} from "@/lib/brand";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// Light turquoise for small text on the navy band (6.88:1 on #1D2D3D, measured)
const TURQ_ON_NAVY = "#7fc2b5";

// ── Data ──

const whySeeld = [
  {
    title: "יועץ אישי לכל לקוח",
    description: "כל לקוח בבית משובץ ליועץ ייעודי. אותו אדם מכיר את התיק, את הצרכים ואת המשפחה. קשר מקצועי, לא מוקד מתחלף.",
  },
  {
    title: "עצמאות מלאה",
    description: "אין לנו יעדי מכירה של חברה ספציפית. אין בונוסים לקידום מוצר. ההמלצה מבוססת על מה שמתאים ללקוח, ולא על מה שמשתלם לנו.",
  },
  {
    title: "12 חברות בהשוואה",
    description: "הראל, מגדל, כלל, הפניקס, איילון, מנורה, מיטב ועוד. גישה מקצועית לכל השחקניות המובילות בשוק הישראלי בזמן אמת.",
  },
  {
    title: "תשתית טכנולוגית",
    description: "פורטל לקוחות, מערכת ניהול תיקים וכלי השוואה מתקדמים. הטכנולוגיה מאפשרת לנו להתמקד במה שחשוב באמת: הייעוץ.",
  },
];

const insuranceTypes = [
  { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳ · השוואה בין כל החברות", href: "/insurance/vehicle" },
  { title: "ביטוח בריאות", description: "כיסוי שמשלים את הסל ולא כופל אותו", href: "/insurance/health" },
  { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה, לפי מה שבאמת צריך", href: "/insurance/life" },
  { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", href: "/insurance/home" },
  { title: "ביטוח שוכרים", description: "כיסוי תכולה ואחריות צד ג׳ לשוכרים", href: "/insurance/renters" },
  { title: "ביטוח עסקי", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק", href: "/insurance/business" },
  { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", href: "/insurance/travel" },
  { title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { title: "אובדן כושר עבודה", description: "תשלום חודשי אם לא תוכלו לעבוד", href: "/insurance/disability" },
  { title: "ביטוח סיעודי", description: "מימון טיפול סיעודי בבית או במוסד", href: "/insurance/nursing" },
  { title: "ביטוח משכנתא", description: "שמירה על הדירה גם במקרה בלתי צפוי", href: "/insurance/mortgage" },
  { title: "מחלות קשות", description: "פיצוי כספי חד־פעמי עם אבחון מחלה", href: "/insurance/critical-illness" },
  { title: "תאונות אישיות", description: "פיצוי על אשפוז, שבר או נכות מתאונה", href: "/insurance/accidents" },
  { title: "ביטוח שותפים", description: "רציפות עסקית במקרה של אובדן שותף", href: "/insurance/partners" },
  { title: "עובדים זרים", description: "ביטוח חובה בהתאם לחוק", href: "/insurance/foreign-workers" },
  { title: "סיעודי כללית", description: "כיסוי סיעודי משלים לחברי כללית", href: "/insurance/nursing-clalit" },
];

const savingsProducts = [
  { title: "קרנות פנסיה", description: "הפקדות, כיסויים ובחירת מסלול נכונה", href: "/savings/pension-funds" },
  { title: "קופות גמל", description: "חיסכון לטווח ארוך עם הטבות מס", href: "/savings/gemel-funds" },
  { title: "גמל להשקעה", description: "חיסכון נזיל בשוק ההון, ללא נעילה", href: "/savings/gemel-investment" },
  { title: "חיסכון לכל ילד", description: "ניהול כספי התוכנית הממשלתית", href: "/savings/child-savings" },
  { title: "קרנות השתלמות", description: "חיסכון לשש שנים עם פטור ממס", href: "/savings/training-funds" },
  { title: "השקעות", description: "בחירת מסלולים ומעקב תשואות", href: "/savings/investment" },
  { title: "ביטוח חיים פנסיוני", description: "חיסכון עם כיסוי למקרה מוות ונכות", href: "/insurance/life" },
  { title: "קופות מעסיקים", description: "הפקדות לעובדים וציות לחוק", href: "/savings/employer-funds" },
  { title: "טרום פרישה", description: "5–10 שנים לפנסיה? הזמן לסדר הכול", href: "/savings/pre-retirement" },
  { title: "לאחר פרישה", description: "משיכות, קצבאות ותכנון מס", href: "/savings/post-retirement" },
  { title: "תכנון פיננסי", description: "מיפוי מלא של הנכסים ובניית תוכנית", href: "/savings/financial-planning" },
];

const platformItems: { title: string; description: string; href?: string; tag: string; live?: boolean }[] = [
  { title: "אזור אישי ללקוח", description: "כל הפוליסות, החיסכון והמסמכים במקום אחד, מכל מכשיר.", href: "/personal-area", tag: "SECURE" },
  { title: "יועץ SEELD AI", description: "מענה על שאלות ביטוח ופנסיה בכל שעה, וחיבור ליועץ אנושי כשצריך.", tag: "LIVE · 24/7", live: true },
  { title: "איתור קרנות", description: "חיפוש והשוואה של קרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות.", href: "/fund-finder", tag: "DATABASE" },
  { title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש.", href: "/return-tables", tag: "MONTHLY" },
  { title: "מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין כל המסלולים בשוק.", href: "/investment-tracks", tag: "COMPARE" },
  { title: "מחשבונים", description: "משכנתא, פנסיה, חיסכון והשוואת מסלולים. חופשי, ללא רישום.", href: "/calculators", tag: "NO SIGNUP" },
];

// Capital-markets strip under the numbers — a standalone ticker band: mono,
// LTR container, values in their own dir="ltr" span (bidi safety).
const marketStrip: { label: string; value?: string; dot?: boolean }[] = [
  { label: "SEELD · MARKET", dot: true },
  { label: "חברות בהשוואה", value: "12" },
  { label: "מסלול מנייתי", value: "+11.4%" },
  { label: "בפיקוח רשות שוק ההון", value: "₪" },
];

const processSteps = [
  { title: "פנייה ראשונית", description: "שיחה קצרה להיכרות עם הצרכים, היועץ הייעודי והצעדים הבאים." },
  { title: "מיפוי התיק", description: "שליפת כל הפוליסות, הקרנות והחיסכון ממקורות רשמיים. מאובטח לחלוטין." },
  { title: "ניתוח ודוח", description: "תוך 48 שעות, דוח מקצועי: המצב הקיים, הזדמנויות והמלצות מנומקות." },
  { title: "פגישת ייעוץ", description: "פרונטלית או בזום. מעבר מעמיק על כל סעיף והחלטה מושכלת, ללא לחץ." },
  { title: "יישום", description: "אנחנו מטפלים בניודים, בטפסים ובחברות. אתה מקבל עדכון בכל שלב." },
  { title: "ליווי שוטף", description: "בחינה מחדש אחת לשנה ובכל אירוע חיים. הקשר עם היועץ נמשך." },
];

const faqItems = [
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "בודקים מה יש לכם בקופ״ח, מה חסר, ומשווים בין כל התוכניות בשוק. ההמלצה מותאמת לגיל, מצב בריאותי וצרכים, בלי עלות נוספת.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "בקרן פנסיה כולם חולקים את הסיכון, זה מוזיל עלויות. בביטוח מנהלים יש פוליסה אישית עם גמישות רבה יותר. מה עדיף? תלוי בגיל, בריאות ומצב תעסוקתי.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "הפגישה הראשונה ללא עלות. תקבלו תמונה מלאה של מצב הפנסיה שלכם: הפקדות, כיסויים, דמי ניהול, ותבינו בדיוק איפה אתם עומדים.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כל החברות: הפניקס, מגדל, הראל, כלל, מנורה מבטחים ועוד. ככה אפשר להשוות ולמצוא את מה שמתאים ומשתלם באמת.",
  },
  {
    question: "כמה זמן לוקח לעבור חברה?",
    answer: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכל: טפסים, ניוד, בדיקה שלא נפגעים כיסויים קיימים.",
  },
  {
    question: "מה זה סריקת תיק?",
    answer: "בדיקה של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים, ודמי ניהול גבוהים. בלי עלות ובלי התחייבות.",
  },
  {
    question: "מה קורה אם יש בעיה עם חברת הביטוח?",
    answer: "הצוות שלנו מטפל. זה בדיוק למה יש סוכן, שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם.",
  },
];

const trustList = [
  { title: "מורשים ומפוקחים", description: "סוכנות ביטוח פנסיונית מורשית תחת רשות שוק ההון. ביטוח אחריות מקצועית מלא." },
  { title: "מבית עמיתים הון", description: "ותק, מוניטין ותשתית של בית פיננסים מוביל בישראל." },
  { title: "יועץ ייעודי", description: "אדם אחד שמלווה את התיק לאורך כל שנות הקשר. רציף." },
  { title: "עצמאות גמורה", description: "ללא התחייבות לחברה. ללא יעדי מכירה. רק מה שנכון ללקוח." },
];

const leadSubjects = [
  "ביטוח בריאות",
  "ביטוח חיים",
  "ביטוח רכב",
  "ביטוח דירה",
  "פנסיה וחיסכון",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "סריקת תיק קיים",
  "ניוד פנסיה",
  "אחר",
];

// ── Shared UI ──

// DNA v3: the heading starts its block — no eyebrow, no ornamental index.
const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-12 sm:mb-16">
    <span className="dna-tick" aria-hidden="true" />
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)" }}>
      {title}
    </h2>
    {lede && (
      <p className="mt-4 text-base leading-[1.85] max-w-xl" style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

// Mobile shows the six flagship rows; the "see all" link below each tab carries the rest.
const ProductList = ({ items }: { items: { title: string; description: string; href: string }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
    {items.map((item, i) => (
      <Link
        key={item.title + item.href}
        to={item.href}
        className={`group items-baseline justify-between gap-6 py-[14px] px-3 -mx-3 rounded-md border-b border-[#E7EDF1] hover:bg-[#E1EAF1]/35 transition-colors ${i >= 6 ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-baseline gap-4 min-w-0">
          <h3 className="text-base font-medium text-[#1D2D3D] whitespace-nowrap">{item.title}</h3>
          <p className="text-[13px] text-[#5a6a78] truncate hidden sm:block">{item.description}</p>
        </div>
        <span className="text-[#5a6a78] group-hover:text-[#1D2D3D] transition-all group-hover:-translate-x-1 shrink-0">
          ←
        </span>
      </Link>
    ))}
  </div>
);

// DNA v3 boxed input: white, hairline border, navy focus
const inputClass =
  "w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] placeholder:text-[#5a6a78] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors min-h-[48px]";

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5a6a78] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors";

const Index = () => {
  const processRef = useRef<HTMLDivElement>(null);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", subject: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      toast.error("חסרים שם וטלפון. מלאו את שניהם ונדע לחזור אליכם.");
      return;
    }
    setLeadSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: leadForm.name.trim(),
        email: `${leadForm.phone.trim()}@lead.seeld.co.il`,
        subject: leadForm.subject || "פנייה מהאתר",
        message: `[טופס ראשי] טלפון: ${leadForm.phone}\nנושא: ${leadForm.subject || "לא צוין"}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: leadForm.name.trim(),
              phone: leadForm.phone.trim(),
              email: `${leadForm.phone.trim()}@lead.seeld.co.il`,
              insuranceType: leadForm.subject || "פנייה כללית",
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים אצלנו. נחזור אליכם באותו יום עבודה.");
      setLeadForm({ name: "", phone: "", subject: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast.error("חסרים שם וטלפון. מלאו את שניהם ונדע לחזור אליכם.");
      return;
    }
    setContactSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: contactForm.name.trim(),
        email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
        subject: "פנייה מתחתית העמוד",
        message: `טלפון: ${contactForm.phone}\n\n${contactForm.message}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: contactForm.name.trim(),
              phone: contactForm.phone.trim(),
              email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים אצלנו. נחזור אליכם באותו יום עבודה.");
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO */}
        <HeroSection />

        {/* PORTFOLIO REVIEW */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="בדיקת תיק ללא עלות"
                lede="השאירו פרטים. הצוות שלנו יבחן את התיק הקיים ויחזור אליכם עם דוח מקצועי הכולל המלצות מעשיות, בתוך 48 שעות."
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="dna-concept !p-6 sm:!p-8 max-w-3xl">
                <form onSubmit={handleLeadSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="שם מלא"
                      aria-label="שם מלא"
                      autoComplete="name"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
                      aria-label="טלפון"
                      autoComplete="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={inputClass}
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                    <select
                      value={leadForm.subject}
                      aria-label="נושא הפנייה"
                      onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors appearance-none cursor-pointer min-h-[48px]"
                    >
                      <option value="">נושא הפנייה</option>
                      {leadSubjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-7 flex flex-wrap items-center gap-6">
                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[180px]"
                    >
                      {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו ונתחיל"}
                    </button>
                    <span className="text-[13px]" style={{ color: MUTED }}>
                      או חייגו{" "}
                      <a
                        href="tel:0523097444"
                        className="text-[#1D2D3D] border-b border-[#1D2D3D]/25 hover:border-[#1D2D3D] transition-colors tabular-nums whitespace-nowrap"
                        dir="ltr"
                      >
                        052-309-7444
                      </a>
                    </span>
                  </div>
                  <div className="mt-5">
                    <span className="text-[12.5px]" style={{ color: MUTED }}>שתי דקות למלא. אפס אותיות קטנות.</span>
                  </div>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* THE METHOD */}
        <section className="dna-page border-t" style={{ borderColor: LINE }}>
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 260, height: 260, top: -100, left: -110, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 220, height: 220, bottom: -120, right: -90, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="השיטה"
                lede="ארבעה עקרונות שמגדירים את הדרך שבה אנחנו עובדים מול כל לקוח בבית."
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {whySeeld.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 80}>
                  <div className="h-full">
                    <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                    <h3
                      className="text-[19px] mb-3"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRACTICE AREAS */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="תחומי הליווי"
                lede="16 קטגוריות ביטוח ו־11 מוצרי חיסכון ופנסיה, מול כל החברות בישראל."
              />
            </ScrollReveal>

            <Tabs defaultValue="insurance" dir="rtl">
              <TabsList className="flex w-full justify-start gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none">
                <TabsTrigger value="insurance" className={tabTriggerClass}>
                  ביטוח
                </TabsTrigger>
                <TabsTrigger value="savings" className={tabTriggerClass}>
                  חיסכון ופנסיה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insurance" className="mt-0">
                <ProductList items={insuranceTypes} />
                <div className="mt-10">
                  <Link
                    to="/insurances"
                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                  >
                    לכל 16 הביטוחים
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="savings" className="mt-0">
                <ProductList items={savingsProducts} />
                <div className="mt-10">
                  <Link
                    to="/savings"
                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                  >
                    לכל 11 מוצרי החיסכון והפנסיה
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* THE PLATFORM */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="הפלטפורמה"
                lede="הכלים שהצוות שלנו עובד איתם, פתוחים גם לכם. נתונים בזמן אמת, שקיפות מלאה, זמינות מסביב לשעון."
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformItems.map((item, i) => {
                const inner = (
                  <div className="dna-concept dna-hover h-full text-start">
                    <div className="flex items-baseline justify-between gap-4 mb-2.5">
                      <h3 className="text-[17px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {item.title}
                      </h3>
                      <span className="text-[#5a6a78] group-hover:text-[#1D2D3D] transition-all group-hover:-translate-x-1">←</span>
                    </div>
                    <p className="text-[14px] leading-[1.8]" style={{ color: BODY }}>{item.description}</p>
                    <div className="mt-4" dir="ltr">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.12em] font-medium"
                        style={{ fontFamily: MONO, color: TURQ_TEXT }}
                      >
                        {item.live && <LiveDot size={6} />}
                        {item.tag}
                      </span>
                    </div>
                  </div>
                );
                return item.href ? (
                  <Link key={i} to={item.href} className="block group">
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="block w-full group"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
            <p className="mt-10 text-[13px]" style={{ color: MUTED }}>
              היועץ האנושי ישן בלילה. היועץ הדיגיטלי ער.
            </p>
          </div>
        </section>

        {/* NUMBERS */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <div className="flex items-end justify-between gap-6 mb-2">
                <span className="text-[11px] tracking-[0.14em]" style={{ fontFamily: MONO, color: MUTED }}>
                  PORTFOLIO · GROWTH
                </span>
                <DrawSpark color={TURQ} className="w-40 sm:w-64" height={44} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 border-t border-b py-10 sm:py-14" style={{ borderColor: LINE }}>
                {[
                  { to: 600, suffix: "+", label: "משפחות מלוות" },
                  { to: 12, suffix: "", label: "חברות בהשוואה" },
                  { to: 48, suffix: "", label: "שעות לדוח מלא" },
                  { to: 0, prefix: "₪", suffix: "", label: "פגישת ייעוץ ראשונה" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="tabular-nums mb-2"
                      dir="ltr"
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 900,
                        color: TURQ,
                        fontSize: "clamp(2.75rem, 4.5vw, 3.5rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      <CountUp to={stat.to} format={(v) => `${stat.prefix ?? ""}${v.toLocaleString("en-US")}${stat.suffix}`} />
                    </div>
                    <div className="text-[13px] tracking-[0.1em]" style={{ color: MUTED }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Market strip — standalone ticker band, hairlines top and bottom */}
              <div
                className="mt-8 border-t border-b py-3.5 flex flex-wrap items-center justify-center gap-x-7 gap-y-1.5"
                style={{ borderColor: LINE }}
                dir="ltr"
              >
                {marketStrip.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 text-[11.5px] tracking-[0.12em] font-medium whitespace-nowrap"
                    style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: MUTED }}
                  >
                    {item.dot && <LiveDot size={6} />}
                    {item.value && <span dir="ltr" style={{ color: NAVY }}>{item.value}</span>}
                    <span dir="auto">{item.label}</span>
                  </span>
                ))}
              </div>
              <p className="mt-5 text-center text-[13px]" style={{ color: MUTED }}>
                אנחנו לא צועקים. המספרים עושים את זה בשבילנו.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* THE HOUSE */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="הבית" />
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24">
              <ScrollReveal>
                <div className="space-y-6 text-base sm:text-[17px] leading-[1.95]" style={{ color: BODY }}>
                  <p
                    className="text-xl sm:text-2xl leading-[1.6]"
                    style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                  >
                    SEELD נבנתה סביב עקרון אחד פשוט: להעמיד את הלקוח מעל כל שיקול אחר.
                  </p>
                  <p>
                    הצוות שלנו כולל סוכני ביטוח מורשים, יועצי פנסיה ומומחי פיננסים.
                    כולם עצמאיים, כולם ללא תלות בחברה אחת. זו לא אמירה שיווקית.
                    זו התשתית המשפטית והעסקית שלנו.
                  </p>
                  <p>
                    לכל לקוח אצלנו יש יועץ אישי. אדם אחד שמכיר את התיק, את המשפחה
                    ואת השינויים שאתה עובר לאורך השנים. לא מוקד. לא נציג מתחלף.
                  </p>
                  <div className="pt-4 flex flex-wrap items-center gap-6">
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
                    >
                      קביעת פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                    >
                      הכירו את הצוות
                      <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t" style={{ borderColor: LINE }}>
                  {trustList.map((point) => (
                    <div key={point.title} className="dna-pill-item !py-5 border-b" style={{ borderColor: LINE }}>
                      <div>
                        <h3 className="text-base font-medium mb-1.5" style={{ color: NAVY }}>{point.title}</h3>
                        <p className="text-[13.5px] leading-relaxed" style={{ color: BODY }}>{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* The cast — the house's people, line-art figures */}
            <ScrollReveal>
              <div className="mt-16 border-t pt-12 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-12" style={{ borderColor: LINE }}>
                {[
                  { Figure: CastDana, name: "דנה", role: "יועצת פנסיה · מלווה 140 משפחות" },
                  { Figure: CastAvi, name: "אבי", role: "סוכן ביטוח מורשה · תיקי בריאות וחיים" },
                  { Figure: CastReader, name: "הלקוחה שלנו", role: "קוראת את הדוח. מבינה אותו." },
                ].map(({ Figure, name, role }) => (
                  <div key={name} className="text-center">
                    <Figure className="w-36 h-52 sm:w-40 sm:h-56 mx-auto" />
                    <div className="mt-4 text-[16px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                      {name}
                    </div>
                    <div className="mt-1 text-[13px]" style={{ color: BODY }}>{role}</div>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                      className="mt-3 text-[13px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/30 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                    >
                      דברו איתנו
                    </button>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* PROCESS */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="התהליך"
                lede="ששה שלבים מובנים, מהפנייה הראשונית ועד ליווי שוטף."
              />
            </ScrollReveal>

            <div ref={processRef} className="max-w-3xl relative pr-5 sm:pr-7">
              {/* The rail fills as you read through the steps */}
              <ProgressRail targetRef={processRef} color={TURQ} className="right-0" />
              {processSteps.map((step, i) => (
                <ScrollReveal key={step.title} delay={i * 60}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6 border-b" style={{ borderColor: LINE }}>
                    <h3
                      className="text-[19px] shrink-0 sm:w-44"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="border-t dna-warm-band" style={{ borderColor: LINE }}>
          <ScrollReveal>
            {/* Logo strip speaks for itself — no headline (user request 2026-07-20) */}
            <CompanyLogos variant="marquee" title="" />
          </ScrollReveal>
        </section>

        {/* FAQ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="שאלות שעולות בכל תיק"
                lede="שאלות שכולם שואלים. תשובות שפחות שומעים."
              />
            </ScrollReveal>

            <div className="max-w-3xl">
              <Accordion type="single" collapsible>
                {faqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-b border-[#E7EDF1] rounded-none px-0"
                  >
                    <AccordionTrigger className="text-base font-medium hover:no-underline py-5 px-3 -mx-3 rounded-md text-[#1D2D3D] text-start hover:bg-[#E1EAF1]/35 transition-colors">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[14.5px] leading-[1.85] pb-6 max-w-2xl text-[#3a4c5a]">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-10">
                <Link
                  to="/faq"
                  className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                >
                  לכל השאלות הנפוצות
                  <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="השיחה הראשונה, על חשבוננו"
                lede="השאירו פרטים ויועץ מהצוות שלנו יחזור אליכם באותו יום עבודה. שיחה אחת, בלי מרדף."
              />
            </ScrollReveal>

            <ScrollReveal>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="-mt-6 mb-12 block dna-hover rounded-full"
                aria-label="פתיחת שיחה עם יועץ SEELD AI"
              >
                <StatusPill>SEELD AI מחובר עכשיו · לחצו לשיחה</StatusPill>
              </button>
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24">
              <ScrollReveal>
                <div className="dna-concept !p-6 sm:!p-8">
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        aria-label="שם מלא"
                        autoComplete="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className={inputClass}
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        aria-label="טלפון"
                        autoComplete="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className={inputClass}
                        dir="ltr"
                        style={{ textAlign: "right" }}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="אימייל (לא חובה)"
                      aria-label="אימייל (לא חובה)"
                      autoComplete="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className={inputClass}
                    />
                    <textarea
                      placeholder="במה נוכל לעזור?"
                      aria-label="במה נוכל לעזור?"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] text-base placeholder:text-[#5a6a78] focus:outline-none focus:border-[#1D2D3D] transition-colors resize-none"
                    />
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={contactSubmitting}
                        className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                      >
                        {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שליחה"}
                      </button>
                    </div>
                  </form>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t" style={{ borderColor: LINE }}>
                  {[
                    { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                    { label: "WhatsApp", value: "שלחו הודעה", href: "https://wa.me/972523097444" },
                    { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                    { label: "משרדים", value: "רעננה · ירושלים" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between py-[15px] border-b" style={{ borderColor: LINE }}>
                      <span className="text-[13px]" style={{ color: MUTED }}>{row.label}</span>
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.href.startsWith("http") ? "_blank" : undefined}
                          rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-base text-[#1D2D3D] tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                          dir={row.ltr ? "ltr" : undefined}
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className="text-base tabular-nums" style={{ color: NAVY }}>{row.value}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between py-[15px]">
                    <span className="text-[13px]" style={{ color: MUTED }}>סוכן ביטוח?</span>
                    <Link
                      to="/app/auth"
                      className="text-base text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                    >
                      כניסה לפורטל הסוכנים ←
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CLOSING CTA — institutional navy band */}
        <section className="dna-navy-band" style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <ScrollReveal>
              <h2
                className="text-white leading-tight"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: "clamp(1.9rem, 3.6vw, 2.75rem)",
                  letterSpacing: "-0.5px",
                }}
              >
                כסף מסודר מתחיל בשיחה אחת.
              </h2>
              <p className="mt-4 text-base sm:text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,.65)" }}>
                בדיקת תיק מלאה, דוח בתוך 48 שעות, בלי עלות ובלי התחייבות.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center h-14 px-9 rounded-lg bg-white text-[#1D2D3D] text-[15px] font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-w-[220px]"
                >
                  בדיקת תיק ללא עלות
                </Link>
                <a
                  href="https://wa.me/972523097444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-14 px-9 rounded-lg text-white text-[15px] font-medium tracking-wide hover:bg-white/10 transition-colors min-w-[220px]"
                  style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.85)" }}
                >
                  שיחה עם יועץ
                </a>
              </div>
              <div className="mt-8 inline-flex items-center gap-2.5" dir="ltr">
                <LiveDot size={6} color={TURQ_ON_NAVY} />
                <span
                  className="text-[11px] tracking-[0.18em] font-medium"
                  style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: TURQ_ON_NAVY }}
                >
                  SEELD · LIVE · 24/6
                </span>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
