import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { BrandDots, OliveBranch } from "@/components/brand/Elements";
import { GREEN, IVORY, LICENSE_LINE, LINE, MUTED, REGULATORY_LINE, SAGE_ON_GREEN } from "@/lib/brand";

// The license number must never break across lines: split the verbatim
// LICENSE_LINE so the trailing number gets its own LTR nowrap span.
const licenseParts = LICENSE_LINE.match(/^(.*?)(\d+)\s*$/);

const linkColumns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "שירותים",
    links: [
      { href: "/contact", label: "בדיקת תיק 360" },
      { href: "/onboarding", label: "שאלון הצטרפות" },
      { href: "/direct-debit", label: "מילוי טופס הו\"ק" },
      { href: "/calculators", label: "מחשבונים" },
      { href: "/return-tables", label: "לוח התשואות" },
      { href: "/rights-extraction", label: "מיצוי זכויות" },
    ],
  },
  {
    title: "ביטוחים",
    links: [
      { href: "/insurance/health", label: "ביטוח בריאות" },
      { href: "/insurance/life", label: "ביטוח חיים" },
      { href: "/insurance/vehicle", label: "ביטוח רכב" },
      { href: "/insurance/home", label: "ביטוח דירה" },
      { href: "/insurance/mortgage", label: "ביטוח משכנתא" },
      { href: "/insurance/travel", label: "ביטוח נסיעות" },
      { href: "/insurance/disability", label: "אובדן כושר עבודה" },
      { href: "/insurance/business", label: "ביטוח עסק" },
    ],
  },
  {
    title: "חיסכון ופנסיה",
    links: [
      { href: "/savings/pension-funds", label: "קרנות פנסיה" },
      { href: "/savings/gemel-funds", label: "קופות גמל" },
      { href: "/savings/training-funds", label: "קרנות השתלמות" },
      { href: "/savings/gemel-investment", label: "גמל להשקעה" },
      { href: "/savings/child-savings", label: "חיסכון לילד" },
      { href: "/savings/pre-retirement", label: "לקראת פרישה" },
      { href: "/savings/financial-planning", label: "תכנון פיננסי" },
    ],
  },
];

const socialLinks = [
  { href: "https://www.linkedin.com/company/seeld-ins", label: "LinkedIn" },
  { href: "https://www.facebook.com/seeld.ins", label: "Facebook" },
  { href: "https://www.instagram.com/seeld.ins", label: "Instagram" },
  { href: "https://wa.me/972523097444", label: "WhatsApp" },
];

const Footer = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!formData.name.trim()) next.name = "נא למלא שם מלא.";
    if (!/^0\d{1,2}-?\d{7}$/.test(formData.phone.replace(/\s/g, ""))) next.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = "כתובת האימייל אינה תקינה.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.phone.trim()}@lead.seeld.co.il`,
        subject: "פנייה מהפוטר",
        message: `טלפון: ${formData.phone}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: formData.name.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim(),
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים התקבלו. נחזור אליכם בהקדם.");
      setFormData({ name: "", phone: "", email: "" });
      setErrors({});
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer dir="rtl" style={{ backgroundColor: IVORY }}>
      {/* ── Contact band: ivory ── */}
      <div className="border-t" style={{ borderColor: LINE }}>
        <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-20 overflow-hidden">
          <OliveBranch className="hidden lg:block absolute -bottom-10 left-6 w-40 opacity-70" />
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24 items-start relative">
            <div>
              <BrandDots className="mb-5" />
              <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
                נדבר על התיק שלכם?
              </h2>
              <p className="mt-3 mb-8 text-[17px] leading-[1.7] max-w-md" style={{ color: MUTED }}>
                השאירו שם וטלפון. נחזור אליכם לתיאום שיחה ראשונה, בלי התחייבות.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 max-w-md" noValidate>
                <div>
                  <label htmlFor="footer-name" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                    שם מלא <span aria-hidden="true" style={{ color: "#BD582D" }}>*</span>
                  </label>
                  <input
                    id="footer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                    autoComplete="name"
                    className="field"
                    aria-invalid={errors.name ? "true" : undefined}
                    aria-describedby={errors.name ? "footer-name-err" : undefined}
                  />
                  {errors.name && <p id="footer-name-err" className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="footer-phone" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                    טלפון <span aria-hidden="true" style={{ color: "#BD582D" }}>*</span>
                  </label>
                  <input
                    id="footer-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    required
                    autoComplete="tel"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                    className="field"
                    aria-invalid={errors.phone ? "true" : undefined}
                    aria-describedby={errors.phone ? "footer-phone-err" : undefined}
                  />
                  {errors.phone && <p id="footer-phone-err" className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="footer-email" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                    אימייל <span className="font-normal" style={{ color: MUTED }}>(לא חובה)</span>
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    autoComplete="email"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                    className="field"
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "footer-email-err" : undefined}
                  />
                  {errors.email && <p id="footer-email-err" className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{errors.email}</p>}
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-5">
                  <button type="submit" disabled={submitting} className="btn-primary min-w-[180px]">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו ונחזור אליכם"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="link-rule text-[15px]"
                  >
                    או שאלו את היועץ הדיגיטלי
                  </button>
                </div>
              </form>
            </div>

            {/* Contact details */}
            <div>
              <div className="border-t" style={{ borderColor: LINE }}>
                {[
                  { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                  { label: "WhatsApp", value: "שלחו הודעה", href: "https://wa.me/972523097444" },
                  { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                  { label: "משרדים", value: "רעננה · ירושלים" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-[7px] border-b"
                    style={{ borderColor: LINE }}
                  >
                    <span className="text-[14px]" style={{ color: MUTED }}>{row.label}</span>
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.href.startsWith("http") ? "_blank" : undefined}
                        rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-[44px] items-center text-base font-bold tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                        style={{ color: GREEN }}
                        dir={row.ltr ? "ltr" : undefined}
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-[44px] items-center text-base" style={{ color: GREEN }}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-0 mt-5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center px-0.5 text-[14px] font-bold border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                    style={{ color: MUTED }}
                  >
                    {social.label}
                  </a>
                ))}
              </div>

              <div className="mt-7 pt-4 border-t flex flex-wrap gap-x-5 gap-y-0 text-[14px]" style={{ borderColor: LINE }}>
                <Link to="/about" className="inline-flex min-h-[44px] items-center px-0.5 hover:underline underline-offset-4" style={{ color: MUTED }}>מי אנחנו</Link>
                <Link to="/faq" className="inline-flex min-h-[44px] items-center px-0.5 hover:underline underline-offset-4" style={{ color: MUTED }}>שאלות נפוצות</Link>
                <Link to="/learn" className="inline-flex min-h-[44px] items-center px-0.5 hover:underline underline-offset-4" style={{ color: MUTED }}>מידע ולמידה</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main footer: deep green ── */}
      <div style={{ backgroundColor: GREEN, color: IVORY }}>
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-16">
          {/* Logo on a light card (the logo never sits directly on a dark ground) */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-10 mb-10 border-b"
            style={{ borderColor: "rgba(250,247,239,0.18)" }}
          >
            <div className="inline-flex items-center rounded-2xl px-5 py-3 self-start" style={{ backgroundColor: IVORY }}>
              <img
                src="/brand/logo.png"
                alt="שילד ביטוח ופיננסים"
                width={121}
                height={52}
                style={{ height: 52, width: "auto" }}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[14px]" style={{ color: SAGE_ON_GREEN }}>
              <span>סוכנות ביטוח ברישיון · רשות שוק ההון</span>
              <span>לשכת סוכני הביטוח בישראל</span>
              <span>מבית עמיתים הון</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-10 mb-12">
            {linkColumns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[16px] mb-5" style={{ color: IVORY }}>
                  {col.title}
                </h3>
                <ul className="space-y-1 text-[15px]" style={{ color: SAGE_ON_GREEN }}>
                  {col.links.map((l, i) => (
                    <li key={l.href + l.label} className={i >= 6 ? "hidden md:list-item" : undefined}>
                      {/* 44px rows: the footer is read with a thumb more than with a mouse */}
                      <Link to={l.href} className="inline-flex min-h-[44px] items-center hover:text-[#FAF7EF] hover:underline underline-offset-4 transition-colors md:min-h-0 md:py-1">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-[16px] mb-5" style={{ color: IVORY }}>
                צור קשר
              </h3>
              <ul className="space-y-1 text-[15px]" style={{ color: SAGE_ON_GREEN }}>
                <li>
                  <a
                    href="tel:0523097444"
                    className="inline-flex min-h-[44px] items-center hover:text-[#FAF7EF] transition-colors tabular-nums whitespace-nowrap md:min-h-0 md:py-1"
                    dir="ltr"
                  >
                    052-309-7444
                  </a>
                </li>
                <li>
                  <a href="mailto:info@seeld.co.il" className="inline-flex min-h-[44px] items-center hover:text-[#FAF7EF] transition-colors break-all md:min-h-0 md:py-1" dir="ltr">
                    info@seeld.co.il
                  </a>
                </li>
                <li className="py-2 md:py-1">רעננה · ירושלים</li>
                <li className="pt-2">
                  <Link to="/personal-area" className="inline-flex min-h-[44px] items-center font-bold hover:underline underline-offset-4 md:min-h-0 md:py-1" style={{ color: IVORY }}>
                    לאזור האישי
                  </Link>
                </li>
                <li>
                  <Link to="/agents" className="inline-flex min-h-[44px] items-center hover:text-[#FAF7EF] transition-colors md:min-h-0 md:py-1">
                    כניסה לסוכנים
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Regulatory block (verbatim, on every page) */}
          <div className="border-t pt-6 mb-8" style={{ borderColor: "rgba(250,247,239,0.18)" }}>
            <p className="text-[14px] font-bold" style={{ color: IVORY }}>
              {licenseParts ? (
                <>
                  {licenseParts[1]}
                  <span dir="ltr" className="whitespace-nowrap tabular-nums">{licenseParts[2]}</span>
                </>
              ) : (
                LICENSE_LINE
              )}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed max-w-3xl" style={{ color: SAGE_ON_GREEN }}>
              {REGULATORY_LINE}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed max-w-3xl" style={{ color: SAGE_ON_GREEN }}>
              המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי.
              אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. שילד פועלת בכפוף
              לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t" style={{ borderColor: "rgba(250,247,239,0.18)" }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[14px]" style={{ color: SAGE_ON_GREEN }}>
                &copy; {new Date().getFullYear()} שילד ביטוח ופיננסים. כל הזכויות שמורות.
              </p>
              {/* 14px minimum and a 44px tap height (WCAG 2.5.8) on the legal links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-0 text-[14px]" style={{ color: SAGE_ON_GREEN }}>
                <Link to="/privacy" className="inline-flex min-h-[44px] items-center px-1 hover:text-[#FAF7EF] transition-colors">מדיניות פרטיות</Link>
                <Link to="/terms" className="inline-flex min-h-[44px] items-center px-1 hover:text-[#FAF7EF] transition-colors">תנאי שימוש</Link>
                <Link to="/accessibility" className="inline-flex min-h-[44px] items-center px-1 hover:text-[#FAF7EF] transition-colors">נגישות</Link>
                <Link to="/cookie-policy" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-1 hover:text-[#FAF7EF] transition-colors">עוגיות</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
