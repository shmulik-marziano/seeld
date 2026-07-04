import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import CompanyLogos from "@/components/CompanyLogos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// ── Design tokens: architectural monochrome ──
const INK = "#171717";
const BONE = "#fafafa";
const PINE = "#171717";
const BRONZE = "#6e6e6e";
const SERIF = "'Heebo', sans-serif";

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
  { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳ — השוואה בין כל החברות", href: "/insurance/vehicle" },
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

const platformItems: { title: string; description: string; href?: string }[] = [
  { title: "אזור אישי ללקוח", description: "כל הפוליסות, החיסכון והמסמכים במקום אחד, מכל מכשיר.", href: "/personal-area" },
  { title: "יועץ SEELD AI", description: "מענה על שאלות ביטוח ופנסיה בכל שעה, וחיבור ליועץ אנושי כשצריך." },
  { title: "איתור קרנות", description: "חיפוש והשוואה של קרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות.", href: "/fund-finder" },
  { title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש.", href: "/return-tables" },
  { title: "מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין כל המסלולים בשוק.", href: "/investment-tracks" },
  { title: "מחשבונים", description: "משכנתא, פנסיה, חיסכון והשוואת מסלולים. חופשי, ללא רישום.", href: "/calculators" },
];

const processSteps = [
  { number: "01", title: "פנייה ראשונית", description: "שיחה קצרה להיכרות עם הצרכים, היועץ הייעודי והצעדים הבאים." },
  { number: "02", title: "מיפוי התיק", description: "שליפת כל הפוליסות, הקרנות והחיסכון ממקורות רשמיים. מאובטח לחלוטין." },
  { number: "03", title: "ניתוח ודוח", description: "תוך 48 שעות — דוח מקצועי: המצב הקיים, הזדמנויות והמלצות מנומקות." },
  { number: "04", title: "פגישת ייעוץ", description: "פרונטלית או בזום. מעבר מעמיק על כל סעיף והחלטה מושכלת, ללא לחץ." },
  { number: "05", title: "יישום", description: "אנחנו מטפלים בניודים, בטפסים ובחברות. אתה מקבל עדכון בכל שלב." },
  { number: "06", title: "ליווי שוטף", description: "בחינה מחדש אחת לשנה ובכל אירוע חיים. הקשר עם היועץ נמשך." },
];

const faqItems = [
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "בודקים מה יש לכם בקופ״ח, מה חסר, ומשווים בין כל התוכניות בשוק. ההמלצה מותאמת לגיל, מצב בריאותי וצרכים — בלי עלות נוספת.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "בקרן פנסיה כולם חולקים את הסיכון — זה מוזיל עלויות. בביטוח מנהלים יש פוליסה אישית עם גמישות רבה יותר. מה עדיף? תלוי בגיל, בריאות ומצב תעסוקתי.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "הפגישה הראשונה ללא עלות. תקבלו תמונה מלאה של מצב הפנסיה שלכם — הפקדות, כיסויים, דמי ניהול — ותבינו בדיוק איפה אתם עומדים.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כל החברות — הפניקס, מגדל, הראל, כלל, מנורה מבטחים ועוד. ככה אפשר להשוות ולמצוא את מה שמתאים ומשתלם באמת.",
  },
  {
    question: "כמה זמן לוקח לעבור חברה?",
    answer: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכל — טפסים, ניוד, בדיקה שלא נפגעים כיסויים קיימים.",
  },
  {
    question: "מה זה סריקת תיק?",
    answer: "בדיקה של כל מה שיש לכם — ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים, ודמי ניהול גבוהים. בלי עלות ובלי התחייבות.",
  },
  {
    question: "מה קורה אם יש בעיה עם חברת הביטוח?",
    answer: "הצוות שלנו מטפל. זה בדיוק למה יש סוכן — שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם.",
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

const SectionHead = ({ index, title, lede }: { index: string; title: string; lede?: string }) => (
  <div className="border-t border-[#171717]/20 pt-6 mb-12 sm:mb-16">
    <div className="flex items-baseline gap-6 sm:gap-10">
      <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE }}>
        {index}
      </span>
      <div>
        <h2
          className="text-[#171717] leading-tight"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
        >
          {title}
        </h2>
        {lede && (
          <p className="mt-3 text-base text-[#171717]/50 leading-[1.85] max-w-xl">{lede}</p>
        )}
      </div>
    </div>
  </div>
);

const ProductList = ({ items }: { items: { title: string; description: string; href: string }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
    {items.map((item) => (
      <Link
        key={item.title + item.href}
        to={item.href}
        className="group flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10 hover:border-[#171717]/40 transition-colors"
      >
        <div className="flex items-baseline gap-4 min-w-0">
          <h3 className="text-base font-medium text-[#171717] whitespace-nowrap">{item.title}</h3>
          <p className="text-[13px] text-[#171717]/40 truncate hidden sm:block">{item.description}</p>
        </div>
        <span className="text-[#171717]/30 group-hover:text-[#171717] transition-all group-hover:-translate-x-1 shrink-0">
          ←
        </span>
      </Link>
    ))}
  </div>
);

const inputClass =
  "w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#171717]/35 text-base focus:outline-none focus:border-[#171717] transition-colors min-h-[44px] rounded-none";

const Index = () => {
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", subject: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      toast.error("נא למלא שם וטלפון");
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
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
      setLeadForm({ name: "", phone: "", subject: "" });
    } catch {
      toast.error("שגיאה בשליחה, נסו שוב");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast.error("נא למלא שם וטלפון");
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
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("שגיאה בשליחה, נסו שוב");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      <main>
        {/* HERO */}
        <HeroSection />

        {/* 01 — PORTFOLIO REVIEW */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="01"
                title="בדיקת תיק, ללא עלות"
                lede="השאירו פרטים. הצוות שלנו יבחן את התיק הקיים ויחזור אליכם עם דוח מקצועי הכולל המלצות מעשיות — בתוך 48 שעות."
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <form onSubmit={handleLeadSubmit} className="max-w-3xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-5">
                  <input
                    type="text"
                    placeholder="שם מלא"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    placeholder="טלפון"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                  <select
                    value={leadForm.subject}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] text-base focus:outline-none focus:border-[#171717] transition-colors appearance-none cursor-pointer min-h-[44px] rounded-none"
                  >
                    <option value="">נושא הפנייה</option>
                    {leadSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[180px]"
                  >
                    {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו ונתחיל"}
                  </button>
                  <span className="text-[13px] text-[#171717]/40">
                    או חייגו{" "}
                    <a href="tel:0523097444" className="text-[#171717] border-b border-[#171717]/25 hover:border-[#171717] transition-colors tabular-nums" dir="ltr">
                      052-309-7444
                    </a>
                  </span>
                </div>
                <div className="mt-6">
                  <span className="text-[12px] text-[#171717]/35">שתי דקות למלא. אפס אותיות קטנות.</span>
                </div>
              </form>
            </ScrollReveal>
          </div>
        </section>

        {/* 02 — THE METHOD */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="02"
                title="השיטה"
                lede="ארבעה עקרונות שמגדירים את הדרך שבה אנחנו עובדים מול כל לקוח בבית."
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {whySeeld.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 80}>
                  <div className="border-t border-[#171717]/15 pt-5 h-full">
                    <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="text-lg text-[#171717] mb-3"
                      style={{ fontFamily: SERIF, fontWeight: 600 }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — PRACTICE AREAS */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="03"
                title="תחומי הליווי"
                lede="16 קטגוריות ביטוח ו־11 מוצרי חיסכון ופנסיה, מול כל החברות בישראל."
              />
            </ScrollReveal>

            <Tabs defaultValue="insurance" dir="rtl">
              <TabsList className="flex w-full justify-start gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none">
                <TabsTrigger
                  value="insurance"
                  className="rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#171717]/40 border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                >
                  ביטוח
                </TabsTrigger>
                <TabsTrigger
                  value="savings"
                  className="rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#171717]/40 border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                >
                  חיסכון ופנסיה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insurance" className="mt-0">
                <ProductList items={insuranceTypes} />
                <div className="mt-10">
                  <Link
                    to="/insurances"
                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                  >
                    לכל הביטוחים
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="savings" className="mt-0">
                <ProductList items={savingsProducts} />
                <div className="mt-10">
                  <Link
                    to="/savings"
                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                  >
                    לכל מוצרי החיסכון והפנסיה
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* 04 — THE PLATFORM (quiet dark) */}
        <section style={{ backgroundColor: PINE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <div className="border-t border-white/20 pt-6 mb-12 sm:mb-16">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE }}>
                    04
                  </span>
                  <div>
                    <h2
                      className="text-[#fafafa] leading-tight"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
                    >
                      הפלטפורמה
                    </h2>
                    <p className="mt-3 text-base text-[#fafafa]/45 leading-[1.85] max-w-xl">
                      הכלים שהצוות שלנו עובד איתם, פתוחים גם לכם. נתונים בזמן אמת, שקיפות מלאה, זמינות מסביב לשעון.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-14 gap-y-2">
              {platformItems.map((item, i) => {
                const inner = (
                  <div className="border-t border-white/10 group-hover:border-white/40 transition-colors pt-5 pb-7 h-full text-start">
                    <div className="flex items-baseline justify-between gap-4 mb-2.5">
                      <h3 className="text-[17px] text-[#fafafa]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        {item.title}
                      </h3>
                      <span className="text-[#fafafa]/25 group-hover:text-[#fafafa] transition-all group-hover:-translate-x-1">←</span>
                    </div>
                    <p className="text-[14px] text-[#fafafa]/40 leading-[1.8]">{item.description}</p>
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
            <p className="mt-10 text-[12px] text-[#fafafa]/30">
              היועץ האנושי ישן בלילה. ה‑AI לא.
            </p>
          </div>
        </section>

        {/* NUMBERS */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 border-t border-b border-[#171717]/15 py-10 sm:py-14">
                {[
                  { number: "600+", label: "משפחות מלוות" },
                  { number: "12", label: "חברות בהשוואה" },
                  { number: "48", label: "שעות לדוח מלא" },
                  { number: "₪0", label: "פגישת ייעוץ ראשונה" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="text-[#171717] tabular-nums mb-2"
                      dir="ltr"
                      style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontWeight: 600, fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", letterSpacing: "-0.02em" }}
                    >
                      {stat.number}
                    </div>
                    <div className="text-[12px] tracking-[0.12em] text-[#171717]/45">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-[12px] text-[#171717]/35">
                אנחנו לא צועקים. המספרים עושים את זה בשבילנו.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* 05 — THE HOUSE */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead index="05" title="הבית" />
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24">
              <ScrollReveal>
                <div className="space-y-6 text-[#171717]/65 text-base sm:text-[17px] leading-[1.95]">
                  <p
                    className="text-[#171717] text-xl sm:text-2xl leading-[1.6]"
                    style={{ fontFamily: SERIF, fontWeight: 600 }}
                  >
                    SEELD נבנתה סביב עקרון אחד פשוט: להעמיד את הלקוח מעל כל שיקול אחר.
                  </p>
                  <p>
                    הצוות שלנו כולל סוכני ביטוח מורשים, יועצי פנסיה ומומחי פיננסים.
                    כולם עצמאיים, כולם ללא תלות בחברה אחת. זו לא אמירה שיווקית —
                    זו התשתית המשפטית והעסקית שלנו.
                  </p>
                  <p>
                    לכל לקוח אצלנו יש יועץ אישי. אדם אחד שמכיר את התיק, את המשפחה
                    ואת השינויים שאתה עובר לאורך השנים. לא מוקד. לא נציג מתחלף.
                  </p>
                  <div className="pt-4 flex flex-wrap items-center gap-6">
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
                    >
                      קביעת פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                    >
                      הכירו את הצוות
                      <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t border-[#171717]/15">
                  {trustList.map((point) => (
                    <div key={point.title} className="py-5 border-b border-[#171717]/10">
                      <h3 className="text-base font-medium text-[#171717] mb-1.5">{point.title}</h3>
                      <p className="text-[13px] text-[#171717]/45 leading-relaxed">{point.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* 06 — PROCESS */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="06"
                title="התהליך"
                lede="ששה שלבים מובנים, מהפנייה הראשונית ועד ליווי שוטף."
              />
            </ScrollReveal>

            <div className="max-w-3xl">
              {processSteps.map((step, i) => (
                <ScrollReveal key={step.number} delay={i * 60}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6 border-b border-[#171717]/10">
                    <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0 w-8" style={{ color: BRONZE }}>
                      {step.number}
                    </span>
                    <h3
                      className="text-lg text-[#171717] shrink-0 sm:w-44"
                      style={{ fontFamily: SERIF, fontWeight: 600 }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <ScrollReveal>
          <CompanyLogos
            variant="marquee"
            title="עובדים מול כל השחקניות המובילות"
            subtitle="12 חברות ביטוח ו-6 בתי השקעות בישראל. גישה מקצועית בזמן אמת. השוואה שקופה. המלצה מבוססת."
          />
        </ScrollReveal>

        {/* 07 — FAQ */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="07"
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
                    className="border-b border-[#171717]/10 rounded-none px-0"
                  >
                    <AccordionTrigger className="text-base sm:text-base font-medium hover:no-underline py-5 text-[#171717] text-start">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[14px] text-[#171717]/50 leading-[1.85] pb-6 max-w-2xl">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-10">
                <Link
                  to="/faq"
                  className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                >
                  לכל השאלות הנפוצות
                  <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 08 — CONTACT */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                index="08"
                title="השיחה הראשונה, על חשבוננו"
                lede="השאירו פרטים ויועץ מהצוות שלנו יחזור אליכם באותו יום עבודה. שיחה אחת — בלי מרדף."
              />
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24">
              <ScrollReveal>
                <form className="space-y-6" onSubmit={handleContactSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                    <input
                      type="text"
                      placeholder="שם מלא"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
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
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                  <textarea
                    placeholder="במה נוכל לעזור?"
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] text-base placeholder:text-[#171717]/35 focus:outline-none focus:border-[#171717] transition-colors resize-none rounded-none"
                  />
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                  >
                    {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שליחה"}
                  </button>
                </form>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t border-[#171717]/15">
                  {[
                    { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                    { label: "WhatsApp", value: "שלחו הודעה", href: "https://wa.me/972523097444" },
                    { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                    { label: "משרדים", value: "רעננה · ירושלים" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between py-[15px] border-b border-[#171717]/10">
                      <span className="text-[13px] text-[#171717]/45">{row.label}</span>
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.href.startsWith("http") ? "_blank" : undefined}
                          rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-base text-[#171717] tabular-nums border-b border-transparent hover:border-[#171717]/40 transition-colors"
                          dir={row.ltr ? "ltr" : undefined}
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className="text-base text-[#171717] tabular-nums">{row.value}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between py-[15px]">
                    <span className="text-[13px] text-[#171717]/45">סוכן ביטוח?</span>
                    <Link
                      to="/app/auth"
                      className="text-base text-[#171717] border-b border-transparent hover:border-[#171717]/40 transition-colors"
                    >
                      כניסה לפורטל הסוכנים ←
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
