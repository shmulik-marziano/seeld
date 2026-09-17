import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { TIERS, type ProductTier } from "@/data/productDirectory";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import CompanyLogos from "@/components/CompanyLogos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Illustration } from "@/components/brand/Illustration";
import { BubbleCorner, PathDivider } from "@/components/brand/Elements";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { FormSuccess } from "@/components/brand/FormSuccess";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, RUST, SAGE, SAGE_ON_GREEN, SAND, TINT_SAGE } from "@/lib/brand";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// ── Data ──

// "במה אפשר לעזור?" — the three services from the design mock. The products
// themselves are listed in the directory below, by tier.
const serviceAreas: {
  title: string;
  description: string;
  href: string;
  icon: BrandIconName;
  tint: string;
}[] = [
  {
    title: "בדיקת תיק 360",
    description: "סוקרים את כל הפוליסות, הקרנות והחיסכון, ומזהים חסרים, כפילויות ודמי ניהול גבוהים.",
    href: "#portfolio-review",
    icon: "document",
    tint: PASTEL_SAGE,
  },
  {
    title: "תכנון פיננסי ופנסיוני",
    description: "בונים תוכנית שמתאימה לכם ולמטרות שלכם: הפקדות, מסלולים, מיסוי ותזמון.",
    href: "/savings/financial-planning",
    icon: "chart",
    tint: PASTEL_SAND,
  },
  {
    title: "ליווי שוטף",
    description: "אנחנו כאן גם בהמשך: מעקב שנתי, עדכונים באירועי חיים וטיפול מול החברות.",
    href: "#process",
    icon: "family",
    tint: PASTEL_MINT,
  },
];

// Icon and tint per product tier (panels below the service cards)
const TIER_STYLE: Record<ProductTier["key"], { icon: BrandIconName; tint: string }> = {
  finance: { icon: "leaf", tint: PASTEL_SAGE },
  life: { icon: "heart", tint: PASTEL_SAND },
  general: { icon: "home", tint: PASTEL_MINT },
};

// The process, as a numbered timeline (mock: 01 sage, 02 sand, 03 rust, 04 green).
const processSteps: { title: string; short: string; icon: BrandIconName; color: string }[] = [
  { title: "מיפוי התיק", short: "מרכזים את כל המידע הקיים ממקורות רשמיים.", icon: "document", color: SAGE },
  { title: "פגישה והחלטות", short: "מבינים את התמונה ואת האפשרויות, ומחליטים יחד.", icon: "family", color: SAND },
  { title: "ביצוע הפעולות", short: "מקדמים את מה שסוכם: טפסים, ניודים וחברות.", icon: "settings", color: RUST },
  { title: "מעקב ועדכון", short: "בודקים מה הושלם ומה נותר, אחת לשנה ובכל שינוי.", icon: "chart", color: GREEN },
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
  "פנסיה וחיסכון",
  "פוליסות השקעה, גמל והשתלמות",
  "ניוד פנסיה",
  "ביטוח חיים",
  "ביטוח משכנתא",
  "ביטוח בריאות",
  "ביטוח רכב",
  "ביטוח דירה",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "אחר",
];

// ── Shared UI ──

const SectionHead = ({ title, lede, center = false }: { title: string; lede?: string; center?: boolean }) => (
  <div className={`mb-10 sm:mb-14 ${center ? "text-center mx-auto" : ""}`}>
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
      {title}
    </h2>
    {lede && (
      <p className={`mt-4 text-[17px] leading-[1.7] max-w-xl ${center ? "mx-auto" : ""}`} style={{ color: MUTED }}>{lede}</p>
    )}
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


const PHONE_RE = /^0\d{1,2}-?\d{7}$/;

const Index = () => {
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", subject: "" });
  const [leadErrors, setLeadErrors] = useState<{ name?: string; phone?: string }>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);

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
      setLeadSent(true);
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
      setContactSent(true);
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
                title="במה אפשר לעזור?"
                lede="כמו בבית השקעות גדול ובחברת ביטוח גדולה, רק עם יועץ אחד שמכיר אתכם. קודם הכסף והנכסים, אחר כך ההגנה עליהם."
              />
            </ScrollReveal>

            {/* Three service cards (mock): icon in a tinted disc, title, two lines, a rule link */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {serviceAreas.map((area, i) => {
                const inner = (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: area.tint }}>
                      <BrandIcon name={area.icon} size={28} style={{ color: GREEN }} />
                    </span>
                    <h3 className="mt-5 text-[20px] leading-tight md:text-[22px]" style={{ color: GREEN }}>{area.title}</h3>
                    <p className="mt-2 text-[15px] leading-[1.6] md:text-[16px] md:leading-[1.7]" style={{ color: BODY }}>{area.description}</p>
                    <span className="link-rule mt-5 text-[15px]">
                      לפרטים נוספים
                      <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
                    </span>
                  </>
                );
                const cls = "group flex h-full flex-col items-start rounded-2xl bg-white border p-6 dna-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]";
                return (
                  <ScrollReveal key={area.href} delay={i * 80}>
                    {area.href.startsWith("#") ? (
                      <a href={area.href} className={cls} style={{ borderColor: LINE }}>{inner}</a>
                    ) : (
                      <Link to={area.href} className={cls} style={{ borderColor: LINE }}>{inner}</Link>
                    )}
                  </ScrollReveal>
                );
              })}
            </div>

            {/* The directory: three tiers in the owner's order (finance, then
                life and health cover, then general insurance). Every product
                keeps its link; the same order runs through the hubs and the footer. */}
            {/* Three panels in the card grammar of the mock (icon disc, title, one
                line, a short list with arrows, one link), finance first. */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {TIERS.map((tier, i) => (
                <ScrollReveal key={tier.key} delay={i * 60} className="h-full">
                  <section
                    id={`home-${tier.key}`}
                    aria-labelledby={`home-${tier.key}-title`}
                    className="flex h-full flex-col rounded-2xl bg-white border p-6 scroll-mt-24"
                    style={{ borderColor: LINE }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: TIER_STYLE[tier.key].tint }}>
                        <BrandIcon name={TIER_STYLE[tier.key].icon} size={24} style={{ color: GREEN }} />
                      </span>
                      <h3 id={`home-${tier.key}-title`} className="text-[21px] leading-tight" style={{ color: GREEN }}>{tier.title}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: MUTED }}>{tier.lede}</p>
                    <ul className="mt-4 flex-1 divide-y divide-[#E1E8E1]">
                      {tier.items.slice(0, tier.homeCount).map((item) => (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            className="group flex min-h-[48px] items-center justify-between gap-4 py-2 text-[16px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                            style={{ color: GREEN }}
                          >
                            <span>{item.title}</span>
                            <BrandIcon name="arrow-left" size={18} className="shrink-0 transition-transform group-hover:-translate-x-1" style={{ color: SAGE }} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link to={tier.href} className="link-rule mt-5 self-start text-[15px]">
                      {tier.linkLabel}
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </section>
                </ScrollReveal>
              ))}
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
                  {leadSent ? (
                  <FormSuccess className="max-w-xl" next="נחזור אליכם ביום העסקים הבא לתיאום הבדיקה." onReset={() => setLeadSent(false)} />
                  ) : (
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
                    {/* Phone: the button spans the form like the fields above it */}
                    <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-5">
                      <button type="submit" disabled={leadSubmitting} className="btn-primary w-full sm:w-auto sm:min-w-[200px]">
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
                  )}
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
        <section id="process" className="relative border-t overflow-hidden scroll-mt-24" style={{ borderColor: LINE }}>
          <BubbleCorner className="hidden lg:block absolute -top-24 -left-24 w-[380px] opacity-70" flip />
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="כך עובדים יחד."
                lede="כל שלב ברור. כל החלטה מתועדת."
              />
            </ScrollReveal>

            {/* The timeline (mock): numbered discs in the brand colours. Phone: a
                vertical line down the right with white cards; from 768px: one row
                on the sage band with arrows between the steps. */}
            <ol className="relative grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-6 md:rounded-2xl md:p-8" style={{ background: undefined }}>
              <div className="pointer-events-none absolute inset-0 hidden rounded-2xl md:block" style={{ background: TINT_SAGE }} aria-hidden="true" />
              {processSteps.map((step, i) => (
                <li key={step.title} className="relative flex items-start gap-4 md:flex-col md:gap-5">
                  {/* connector: vertical on the phone, arrow on desktop */}
                  {i < processSteps.length - 1 && (
                    <>
                      <span className="absolute right-[27px] top-[60px] -bottom-5 w-px md:hidden" style={{ background: LINE }} aria-hidden="true" />
                      <span className="absolute -left-6 top-[14px] hidden md:block" style={{ color: MUTED }} aria-hidden="true">
                        <BrandIcon name="arrow-left" size={20} />
                      </span>
                    </>
                  )}
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-bold tabular-nums"
                    style={{ background: step.color, color: "#FAF7EF" }}
                    dir="ltr"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 rounded-2xl bg-white border p-5 md:p-5" style={{ borderColor: LINE }}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: PASTEL_SAGE }}>
                        <BrandIcon name={step.icon} size={20} style={{ color: GREEN }} />
                      </span>
                      <h3 className="text-[18px] leading-tight" style={{ color: GREEN }}>{step.title}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: BODY }}>{step.short}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* The green promise band (mock) */}
            <div className="dna-navy-band relative mt-8 overflow-hidden rounded-2xl px-6 py-8 sm:mt-10 sm:px-10 sm:py-10">
              <BubbleCorner className="absolute -bottom-16 -left-16 w-[260px] opacity-60" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[24px] leading-tight sm:text-[28px]" style={{ color: IVORY }}>תמיד יודעים מה השלב הבא</h3>
                  <p className="mt-2 text-[16px] sm:text-[17px]" style={{ color: SAGE_ON_GREEN }}>ליווי רציף שמחזיק אתכם בדרך הנכונה.</p>
                </div>
                <Link to="/contact" className="btn-on-green sm:min-w-[220px]">
                  לתיאום פגישה
                  <BrandIcon name="arrow-left" size={18} />
                </Link>
              </div>
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
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: PASTEL_SAGE }}>
                        <BrandIcon name={item.icon} size={22} style={{ color: GREEN }} />
                      </span>
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
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <Link to="/contact" className="btn-primary w-full sm:w-auto">תיאום פגישה</Link>
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
                {faqItems.slice(0, 4).map((item, i) => (
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
                {contactSent ? (
                <FormSuccess next="נחזור אליכם ביום העסקים הבא לתיאום הפגישה." onReset={() => setContactSent(false)} />
                ) : (
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
                    <button type="submit" disabled={contactSubmitting} className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
                      {contactSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו לתיאום"}
                    </button>
                  </div>
                </form>
                )}
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
          {/* Phone: aligned to the start like every other section; centred from 640px */}
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24 text-start sm:text-center">
            <ScrollReveal>
              <h2 className="leading-tight" style={{ color: IVORY, fontSize: "clamp(28px, 3.6vw, 40px)" }}>
                תמונה ברורה מתחילה בשיחה אחת.
              </h2>
              <p className="mt-4 text-[17px] sm:text-[18px] max-w-xl sm:mx-auto" style={{ color: SAGE_ON_GREEN }}>
                בדיקת תיק 360 ללא עלות וללא התחייבות. מכאן ממשיכים יחד.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-3">
                <a href="#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                  בדיקת תיק 360
                </a>
                <Link to="/contact" className="btn-on-green-outline sm:min-w-[220px]">
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
