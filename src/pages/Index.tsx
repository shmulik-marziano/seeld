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
import { Illustration, type IllustrationName } from "@/components/brand/Illustration";
import { BrandDots, BubbleCorner, PathDivider } from "@/components/brand/Elements";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN } from "@/lib/brand";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// ── Data ──

const serviceAreas: {
  title: string;
  description: string;
  href: string;
  illustration: IllustrationName;
  icon: BrandIconName;
}[] = [
  {
    title: "משפחה והגנה",
    description: "ביטוחי בריאות, חיים, אובדן כושר עבודה וסיעוד, כחלק מתמונה משפחתית אחת. בודקים מה יש, מה חסר ומה כפול.",
    href: "/insurances",
    illustration: "02-family-protection",
    icon: "shield",
  },
  {
    title: "חיסכון ותכנון",
    description: "מבט מסודר על הפנסיה, קרנות ההשתלמות, קופות הגמל והמטרות קדימה. דמי ניהול, מסלולים והפקדות במקום אחד.",
    href: "/savings",
    illustration: "03-saving-growth",
    icon: "leaf",
  },
  {
    title: "לקראת פרישה",
    description: "הבנת התמונה הקיימת והכנה לשלב הבא: קצבאות, משיכות, מיסוי ותזמון. תוכנית שאפשר לעקוב אחריה.",
    href: "/savings/pre-retirement",
    illustration: "04-retirement-horizon",
    icon: "retirement",
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

const processSteps: { title: string; you: string; we: string }[] = [
  {
    title: "מיפוי התיק",
    you: "משאירים פרטים וחותמים על ייפוי כוח לשליפת הנתונים.",
    we: "שולפים את כל הפוליסות, הקרנות והחיסכון ממקורות רשמיים ומסדרים אותם בתמונה אחת.",
  },
  {
    title: "פגישה והחלטות",
    you: "עוברים איתנו על התמונה, שואלים ומחליטים בקצב שלכם.",
    we: "מציגים את המצב הקיים, את הפערים ואת האפשרויות, עם המלצות מנומקות ומתועדות.",
  },
  {
    title: "ביצוע הפעולות",
    you: "מאשרים את מה שהוחלט.",
    we: "מטפלים בטפסים, בניודים ובחברות, ומעדכנים אתכם בכל שלב.",
  },
  {
    title: "מעקב ועדכון",
    you: "מעדכנים אותנו באירועי חיים: עבודה חדשה, ילד, דירה, פרישה.",
    we: "בוחנים את התיק מחדש אחת לשנה ובכל שינוי, ומתעדים כל החלטה באזור האישי.",
  },
];

const knowledgeItems: { title: string; description: string; href?: string; icon: BrandIconName }[] = [
  { title: "מחשבונים", description: "משכנתא, פנסיה, חיסכון, מס והשוואת מסלולים. חופשי, ללא רישום.", href: "/calculators", icon: "calculator" },
  { title: "איתור קרנות", description: "חיפוש והשוואה של קרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות.", href: "/fund-finder", icon: "search" },
  { title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש.", href: "/return-tables", icon: "chart" },
  { title: "מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין המסלולים בשוק.", href: "/investment-tracks", icon: "route" },
  { title: "מידע ולמידה", description: "מדריכים, מאמרים ותשובות לשאלות שעולות בכל תיק.", href: "/learn", icon: "document" },
  { title: "אזור אישי", description: "הפוליסות, החיסכון, המסמכים וסיכומי הפגישות שלכם במקום אחד.", href: "/personal-area", icon: "folder" },
];

const faqItems = [
  {
    question: "מה זה בדיקת תיק 360?",
    answer: "בדיקה של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים ודמי ניהול גבוהים, ומסכמים הכול בדוח מסודר. בלי עלות ובלי התחייבות.",
  },
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "בודקים מה יש לכם בקופת החולים, מה חסר, ומשווים בין התוכניות בשוק. ההמלצה מותאמת לגיל, למצב הבריאותי ולצרכים.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "בקרן פנסיה כולם חולקים את הסיכון, וזה מוזיל עלויות. בביטוח מנהלים יש פוליסה אישית עם גמישות רבה יותר. מה עדיף? תלוי בגיל, בבריאות ובמצב התעסוקתי.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "הפגישה הראשונה ללא עלות. תקבלו תמונה של מצב הפנסיה שלכם: הפקדות, כיסויים ודמי ניהול, ותבינו בדיוק איפה אתם עומדים.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כל החברות: הפניקס, מגדל, הראל, כלל, מנורה מבטחים ועוד. כך אפשר להשוות ולמצוא את מה שמתאים ומשתלם באמת.",
  },
  {
    question: "כמה זמן לוקח לעבור חברה?",
    answer: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכול: טפסים, ניוד ובדיקה שלא נפגעים כיסויים קיימים.",
  },
  {
    question: "מה קורה אם יש בעיה עם חברת הביטוח?",
    answer: "הצוות שלנו מטפל. זה בדיוק בשביל זה יש סוכן, כדי שלא תצטרכו להתמודד עם החברה לבד.",
  },
];

const trustList = [
  { title: "ברישיון ובפיקוח", description: "סוכנות ביטוח פנסיונית ברישיון תחת רשות שוק ההון. ביטוח אחריות מקצועית מלא." },
  { title: "מבית עמיתים הון", description: "ותק, מוניטין ותשתית של בית פיננסים בישראל." },
  { title: "יועץ ייעודי", description: "אדם אחד שמלווה את התיק לאורך כל שנות הקשר." },
  { title: "עצמאות", description: "ללא התחייבות לחברה. ללא יעדי מכירה. רק מה שנכון ללקוח." },
];

const leadSubjects = [
  "בדיקת תיק 360",
  "ביטוח בריאות",
  "ביטוח חיים",
  "ביטוח רכב",
  "ביטוח דירה",
  "פנסיה וחיסכון",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "ניוד פנסיה",
  "אחר",
];

// ── Shared UI ──

const SectionHead = ({ title, lede, center = false }: { title: string; lede?: string; center?: boolean }) => (
  <div className={`mb-10 sm:mb-14 ${center ? "text-center mx-auto" : ""}`}>
    <BrandDots className="mb-4" />
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
      {title}
    </h2>
    {lede && (
      <p className={`mt-4 text-[17px] leading-[1.7] max-w-xl ${center ? "mx-auto" : ""}`} style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

const ProductList = ({ items }: { items: { title: string; description: string; href: string }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
    {items.map((item, i) => (
      <Link
        key={item.title + item.href}
        to={item.href}
        className={`group items-baseline justify-between gap-6 py-[14px] px-3 -mx-3 rounded-lg border-b hover:bg-white transition-colors ${i >= 6 ? "hidden md:flex" : "flex"}`}
        style={{ borderColor: LINE }}
      >
        <div className="flex items-baseline gap-4 min-w-0">
          <h3 className="text-[16px] font-bold whitespace-nowrap" style={{ color: GREEN }}>{item.title}</h3>
          <p className="text-[14px] truncate hidden sm:block" style={{ color: MUTED }}>{item.description}</p>
        </div>
        <BrandIcon name="arrow-left" size={18} className="shrink-0 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
      </Link>
    ))}
  </div>
);

const FieldLabel = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
    {children}
    {required && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{children}</p> : null;

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-[16px] font-bold text-[#476356] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors";

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;

const Index = () => {
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", subject: "" });
  const [leadErrors, setLeadErrors] = useState<{ name?: string; phone?: string }>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadSubmitting) return;
    const errs: typeof leadErrors = {};
    if (!leadForm.name.trim()) errs.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(leadForm.phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר טלפון ישראלי תקין.";
    setLeadErrors(errs);
    if (Object.keys(errs).length) return;
    setLeadSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: leadForm.name.trim(),
        email: `${leadForm.phone.trim()}@lead.seeld.co.il`,
        subject: leadForm.subject || "בדיקת תיק 360",
        message: `[בדיקת תיק 360] טלפון: ${leadForm.phone}\nנושא: ${leadForm.subject || "לא צוין"}`,
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
              insuranceType: leadForm.subject || "בדיקת תיק 360",
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים התקבלו. נחזור אליכם לתיאום הבדיקה.");
      setLeadForm({ name: "", phone: "", subject: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSubmitting) return;
    const errs: typeof contactErrors = {};
    if (!contactForm.name.trim()) errs.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(contactForm.phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errs.email = "כתובת האימייל אינה תקינה.";
    setContactErrors(errs);
    if (Object.keys(errs).length) return;
    setContactSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: contactForm.name.trim(),
        email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
        subject: "תיאום פגישה",
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
      toast.success("הפרטים התקבלו. נחזור אליכם לתיאום הפגישה.");
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO */}
        <HeroSection />

        {/* SERVICE AREAS — three illustrated doors */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="לכל שירות יש נושא מזוהה"
                lede="שלושה תחומי ליווי, משפחה חזותית אחת. בוחרים את הדלת המתאימה, ואנחנו ממשיכים משם."
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {serviceAreas.map((area, i) => (
                <ScrollReveal key={area.href} delay={i * 80}>
                  {/* Phone: a row (small art beside the text) so three cards fit in
                      one and a half screens instead of three. Tablet and up: the
                      full illustration card. */}
                  <Link
                    to={area.href}
                    className="group flex h-full items-start gap-4 rounded-2xl bg-white border overflow-hidden p-4 dna-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30] md:block md:p-0"
                    style={{ borderColor: LINE }}
                  >
                    <div
                      className="w-[104px] shrink-0 overflow-hidden rounded-xl border md:w-auto md:rounded-none md:border-0 md:border-b"
                      style={{ borderColor: LINE }}
                    >
                      <Illustration
                        name={area.illustration}
                        sizes="(min-width: 768px) 380px, 104px"
                        className="!rounded-none"
                      />
                    </div>
                    <div className="min-w-0 md:p-6">
                      <div className="flex items-center gap-3 mb-2 md:mb-3">
                        <BrandIcon name={area.icon} size={32} className="hidden md:block" style={{ color: GREEN }} />
                        <h3 className="text-[19px] leading-tight md:text-[22px]" style={{ color: GREEN }}>{area.title}</h3>
                      </div>
                      <p className="text-[15px] leading-[1.6] md:text-[16px] md:leading-[1.7]" style={{ color: BODY }}>{area.description}</p>
                      <span className="link-rule mt-3 text-[15px] md:mt-5">
                        לפרטי השירות
                        <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* The full catalogue — every product keeps its link */}
            <div className="mt-14 sm:mt-20">
              <Tabs defaultValue="insurance" dir="rtl">
                <TabsList className="flex w-full justify-start gap-10 h-auto bg-transparent p-0 mb-8 border-b rounded-none" style={{ borderColor: LINE }}>
                  <TabsTrigger value="insurance" className={tabTriggerClass}>
                    כל הביטוחים
                  </TabsTrigger>
                  <TabsTrigger value="savings" className={tabTriggerClass}>
                    חיסכון ופנסיה
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insurance" className="mt-0">
                  <ProductList items={insuranceTypes} />
                  <div className="mt-8">
                    <Link to="/insurances" className="link-rule text-[15px]">
                      לכל 16 תחומי הביטוח
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="savings" className="mt-0">
                  <ProductList items={savingsProducts} />
                  <div className="mt-8">
                    <Link to="/savings" className="link-rule text-[15px]">
                      לכל 11 מוצרי החיסכון והפנסיה
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* PORTFOLIO REVIEW 360 — the central action */}
        <section id="portfolio-review" className="scroll-mt-24 border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-center">
              <div>
                <ScrollReveal>
                  <SectionHead
                    title="בדיקת תיק 360"
                    lede="השאירו שם וטלפון. נבחן את הביטוחים, הפנסיה והחיסכון הקיימים, ונחזור אליכם עם תמונה מסודרת והמלצות מנומקות. ללא עלות וללא התחייבות."
                  />
                </ScrollReveal>

                <ScrollReveal delay={100}>
                  <form onSubmit={handleLeadSubmit} noValidate className="max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel htmlFor="lead-name" required>שם מלא</FieldLabel>
                        <input
                          id="lead-name"
                          type="text"
                          autoComplete="name"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                          className="field"
                          aria-invalid={leadErrors.name ? "true" : undefined}
                          aria-describedby={leadErrors.name ? "lead-name-err" : undefined}
                        />
                        <FieldError id="lead-name-err">{leadErrors.name}</FieldError>
                      </div>
                      <div>
                        <FieldLabel htmlFor="lead-phone" required>טלפון</FieldLabel>
                        <input
                          id="lead-phone"
                          type="tel"
                          autoComplete="tel"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="field"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                          aria-invalid={leadErrors.phone ? "true" : undefined}
                          aria-describedby={leadErrors.phone ? "lead-phone-err" : undefined}
                        />
                        <FieldError id="lead-phone-err">{leadErrors.phone}</FieldError>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel htmlFor="lead-subject">במה נתחיל?</FieldLabel>
                        <select
                          id="lead-subject"
                          value={leadForm.subject}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="field appearance-none cursor-pointer"
                        >
                          <option value="">בדיקת תיק 360 (ברירת מחדל)</option>
                          {leadSubjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <button type="submit" disabled={leadSubmitting} className="btn-primary min-w-[200px]">
                        {leadSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו ונתחיל בבדיקה"}
                      </button>
                      <span className="text-[15px]" style={{ color: MUTED }}>
                        או חייגו{" "}
                        <a
                          href="tel:0523097444"
                          className="font-bold border-b border-[#003D30]/30 hover:border-[#003D30] transition-colors tabular-nums whitespace-nowrap"
                          style={{ color: GREEN }}
                          dir="ltr"
                        >
                          052-309-7444
                        </a>
                      </span>
                    </div>
                    <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
                      הפרטים משמשים ליצירת קשר בלבד. אנחנו לא מעבירים אותם לגורם שלישי.
                    </p>
                  </form>
                </ScrollReveal>
              </div>

              {/* Decoration only; on a phone it would sit below the form and push
                  the next section a full screen down. */}
              <ScrollReveal delay={150} className="hidden md:block">
                <Illustration
                  name="05-clarity-decisions"
                  sizes="(min-width: 1024px) 460px, 80vw"
                  className="max-w-md mx-auto lg:max-w-none"
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* PROCESS — how we work together */}
        <section className="relative border-t overflow-hidden" style={{ borderColor: LINE }}>
          <BubbleCorner className="hidden lg:block absolute -top-24 -left-24 w-[380px] opacity-70" flip />
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="איך עובדים יחד"
                lede="ארבעה שלבים, מהמיפוי ועד המעקב. בכל שלב ברור מה אתם עושים ומה אנחנו עושים."
              />
            </ScrollReveal>

            <ol className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl">
              {processSteps.map((step, i) => (
                <li key={step.title} className="h-full">
                  <ScrollReveal delay={i * 70} className="h-full">
                    <div className="dna-concept h-full !p-6">
                      <h3 className="text-[20px] mb-4" style={{ color: GREEN }}>{step.title}</h3>
                      <dl className="space-y-3 text-[15px] leading-[1.7]">
                        <div>
                          <dt className="font-bold" style={{ color: GREEN }}>אתם</dt>
                          <dd style={{ color: BODY }}>{step.you}</dd>
                        </div>
                        <div>
                          <dt className="font-bold" style={{ color: GREEN }}>אנחנו</dt>
                          <dd style={{ color: BODY }}>{step.we}</dd>
                        </div>
                      </dl>
                    </div>
                  </ScrollReveal>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a href="#portfolio-review" className="btn-primary sm:min-w-[220px]">בדיקת תיק 360</a>
              <Link to="/contact" className="btn-secondary sm:min-w-[200px]">תיאום פגישה</Link>
            </div>
          </div>
        </section>

        <PathDivider className="max-w-brand mx-auto px-5 sm:px-8 h-16 sm:h-24" />

        {/* KNOWLEDGE & TOOLS */}
        <section>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-20">
            <ScrollReveal>
              <SectionHead
                title="ידע וכלים"
                lede="הכלים שהצוות שלנו עובד איתם, פתוחים גם לכם."
              />
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {knowledgeItems.map((item) => (
                <Link key={item.title} to={item.href!} className="group block dna-concept dna-hover h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <BrandIcon name={item.icon} size={28} style={{ color: GREEN }} />
                      <h3 className="text-[18px]" style={{ color: GREEN }}>{item.title}</h3>
                    </div>
                    <BrandIcon name="arrow-left" size={18} className="shrink-0 mt-1 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
                  </div>
                  <p className="text-[15px] leading-[1.7]" style={{ color: BODY }}>{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* THE HOUSE */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24">
              <ScrollReveal>
                <SectionHead title="מי אנחנו" />
                <div className="space-y-5 text-[17px] leading-[1.8]" style={{ color: BODY }}>
                  <p className="text-[20px] sm:text-[22px] leading-[1.5] font-bold" style={{ color: GREEN }}>
                    שילד נבנתה סביב עיקרון אחד: הלקוח מעל כל שיקול אחר.
                  </p>
                  <p>
                    הצוות שלנו כולל סוכני ביטוח ברישיון, יועצי פנסיה ואנשי פיננסים.
                    כולם עצמאיים, ללא תלות בחברה אחת. זו לא אמירה שיווקית, זו התשתית העסקית שלנו.
                  </p>
                  <p>
                    לכל לקוח יש יועץ אישי: אדם אחד שמכיר את התיק, את המשפחה ואת השינויים לאורך השנים.
                    לא מוקד, לא נציג מתחלף.
                  </p>
                  <div className="pt-3 flex flex-wrap items-center gap-6">
                    <Link to="/contact" className="btn-primary">תיאום פגישה</Link>
                    <Link to="/about" className="link-rule text-[16px]">
                      הכירו את הצוות
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t lg:mt-24" style={{ borderColor: LINE }}>
                  {trustList.map((point) => (
                    <div key={point.title} className="dna-pill-item !py-5 border-b" style={{ borderColor: LINE }}>
                      <div>
                        <h3 className="text-[17px] mb-1.5" style={{ color: GREEN }}>{point.title}</h3>
                        <p className="text-[15px] leading-relaxed" style={{ color: BODY }}>{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="border-t dna-warm-band" style={{ borderColor: LINE }}>
          <ScrollReveal>
            <CompanyLogos variant="marquee" title="" />
          </ScrollReveal>
        </section>

        {/* FAQ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="שאלות שעולות בכל תיק"
                lede="תשובות קצרות לשאלות שכולם שואלים."
              />
            </ScrollReveal>

            <div className="max-w-3xl">
              <Accordion type="single" collapsible>
                {faqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-b rounded-none px-0"
                    style={{ borderColor: LINE }}
                  >
                    <AccordionTrigger className="text-[17px] font-bold hover:no-underline py-5 px-3 -mx-3 rounded-lg text-start hover:bg-white transition-colors" style={{ color: GREEN }}>
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[16px] leading-[1.75] pb-6 max-w-2xl" style={{ color: BODY }}>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-10">
                <Link to="/faq" className="link-rule text-[15px]">
                  לכל השאלות הנפוצות
                  <BrandIcon name="arrow-left" size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="תיאום פגישה"
                lede="השאירו פרטים ויועץ מהצוות יחזור אליכם לתיאום. פגישה במשרד, בזום או בטלפון."
              />
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24">
              <ScrollReveal>
                <form className="space-y-4" onSubmit={handleContactSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="contact-name" required>שם מלא</FieldLabel>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="field"
                        aria-invalid={contactErrors.name ? "true" : undefined}
                        aria-describedby={contactErrors.name ? "contact-name-err" : undefined}
                      />
                      <FieldError id="contact-name-err">{contactErrors.name}</FieldError>
                    </div>
                    <div>
                      <FieldLabel htmlFor="contact-phone" required>טלפון</FieldLabel>
                      <input
                        id="contact-phone"
                        type="tel"
                        autoComplete="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="field"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                        aria-invalid={contactErrors.phone ? "true" : undefined}
                        aria-describedby={contactErrors.phone ? "contact-phone-err" : undefined}
                      />
                      <FieldError id="contact-phone-err">{contactErrors.phone}</FieldError>
                    </div>
                  </div>
                  <div>
                    <FieldLabel htmlFor="contact-email">אימייל <span className="font-normal" style={{ color: MUTED }}>(לא חובה)</span></FieldLabel>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="field"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                      aria-invalid={contactErrors.email ? "true" : undefined}
                      aria-describedby={contactErrors.email ? "contact-email-err" : undefined}
                    />
                    <FieldError id="contact-email-err">{contactErrors.email}</FieldError>
                  </div>
                  <div>
                    <FieldLabel htmlFor="contact-message">במה נוכל לעזור?</FieldLabel>
                    <textarea
                      id="contact-message"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="field resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={contactSubmitting} className="btn-primary min-w-[180px]">
                      {contactSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו לתיאום"}
                    </button>
                  </div>
                </form>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="border-t" style={{ borderColor: LINE }}>
                  {[
                    { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                    { label: "WhatsApp", value: "שלחו הודעה", href: "https://wa.me/972523097444" },
                    { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                    { label: "משרדים", value: "רעננה · ירושלים" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                      <span className="text-[14px]" style={{ color: MUTED }}>{row.label}</span>
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.href.startsWith("http") ? "_blank" : undefined}
                          rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-[16px] font-bold tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                          style={{ color: GREEN }}
                          dir={row.ltr ? "ltr" : undefined}
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className="text-[16px] tabular-nums" style={{ color: GREEN }}>{row.value}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 py-[15px]">
                    <span className="text-[14px]" style={{ color: MUTED }}>סוכן ביטוח?</span>
                    <Link to="/app/auth" className="link-rule text-[15px]">
                      כניסה לפורטל הסוכנים
                      <BrandIcon name="arrow-left" size={16} />
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="mt-6 btn-secondary w-full sm:w-auto"
                  >
                    <BrandIcon name="message" size={20} />
                    שאלה קצרה ליועץ הדיגיטלי
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CLOSING — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
            <ScrollReveal>
              <h2 className="leading-tight" style={{ color: IVORY, fontSize: "clamp(28px, 3.6vw, 40px)" }}>
                תמונה ברורה מתחילה בשיחה אחת.
              </h2>
              <p className="mt-4 text-[17px] sm:text-[18px] max-w-xl mx-auto" style={{ color: SAGE_ON_GREEN }}>
                בדיקת תיק 360 ללא עלות וללא התחייבות. מכאן ממשיכים יחד.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#portfolio-review" className="btn-on-green min-w-[220px]">
                  בדיקת תיק 360
                </a>
                <Link to="/contact" className="btn-on-green-outline min-w-[220px]">
                  תיאום פגישה
                </Link>
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
