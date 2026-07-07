import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LiveDot, StatusPill } from "@/components/brand/Live";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import {
  BODY, DISPLAY, LICENSE_LINE, LINE, MONO, MUTED, NAVY, REGULATORY_LINE, SANS, TURQ,
} from "@/lib/brand";

// DNA v3 boxed input: white, hairline border, navy focus (STYLESEED.md)
const inputClass =
  "w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] placeholder:text-[#5a6a78] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors min-h-[48px]";

// The license number must never break across lines (STYLESEED.md rule 8):
// split the verbatim LICENSE_LINE so the trailing number gets its own LTR nowrap span.
const licenseParts = LICENSE_LINE.match(/^(.*?)(\d+)\s*$/);

const linkColumns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "שירותים",
    links: [
      { href: "/onboarding", label: "שאלון הצטרפות" },
      { href: "/direct-debit", label: "מילוי טופס הו\"ק" },
      { href: "/calculators", label: "מחשבונים" },
      { href: "/return-tables", label: "טבלאות תשואה" },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: formData.name,
        email: formData.email,
        subject: "פנייה מהפוטר",
        message: `טלפון: ${formData.phone}`
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: formData.name,
              phone: formData.phone,
              email: formData.email,
            }
          }
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים אצלנו. נחזור אליכם באותו יום עבודה.");
      setFormData({ name: "", phone: "", email: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer dir="rtl" className="bg-white border-t" style={{ borderColor: LINE }}>
      {/* Contact band */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24 items-start">
          {/* Form */}
          <div>
            <h2 className="dna-display mb-2" style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)" }}>
              נדבר?
            </h2>
            <p className="text-[15px] mb-5" style={{ color: MUTED }}>
              בלי ספאם. בלי טלפונים בשמונה בערב. שיחה אחת, ואתם מחליטים.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
              className="mb-9 block dna-hover rounded-full"
              aria-label="פתיחת שיחה עם יועץ SEELD AI"
            >
              <StatusPill>SEELD AI מחובר עכשיו · לחצו לשיחה</StatusPill>
            </button>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                required
                placeholder="שם מלא"
                className={inputClass}
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                required
                placeholder="טלפון"
                dir="ltr"
                style={{ textAlign: "right" }}
                className={inputClass}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                required
                placeholder="אימייל"
                dir="ltr"
                style={{ textAlign: "right" }}
                className={inputClass}
              />
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                </button>
              </div>
            </form>
          </div>

          {/* Contact details */}
          <div>
            <div className="border-t" style={{ borderColor: LINE }}>
              {[
                { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                { label: "משרדים", value: "רעננה · ירושלים" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between py-[15px] border-b"
                  style={{ borderColor: LINE }}
                >
                  <span className="text-[13px]" style={{ color: MUTED }}>{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="text-base tabular-nums whitespace-nowrap text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                      dir={row.ltr ? "ltr" : undefined}
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="text-base" style={{ color: NAVY }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Capital-markets mono line — LTR, tabular (bidi-safe: ASCII only) */}
            <div className="mt-6 flex items-center gap-2.5" dir="ltr">
              <LiveDot size={6} />
              <span
                className="text-[11px] tracking-[0.18em] font-medium"
                style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: MUTED }}
              >
                SEELD · TLV · 24/6
              </span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[#5a6a78] hover:text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/30 transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>

            <div className="mt-9 pt-6 border-t flex flex-wrap gap-x-6 gap-y-2" style={{ borderColor: LINE }}>
              <Link to="/about" className="text-[13px] text-[#5a6a78] hover:text-[#1D2D3D] transition-colors">הסיפור שלנו</Link>
              <Link to="/faq" className="text-[13px] text-[#5a6a78] hover:text-[#1D2D3D] transition-colors">שאלות נפוצות</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          {/* Wordmark + affiliations */}
          <div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-10 border-b"
            style={{ borderColor: LINE }}
          >
            <div>
              <div
                dir="ltr"
                className="text-right"
                style={{ fontFamily: SANS, fontWeight: 700, fontSize: "2rem", color: NAVY, letterSpacing: "-0.02em" }}
              >
                SEELD<span style={{ color: TURQ }}>.</span>
              </div>
              <div className="text-[12px] tracking-[0.2em] mt-1.5" style={{ color: MUTED }}>
                בית פיננסים וביטוח
              </div>
              <div className="mt-3" dir="ltr">
                <span
                  className="text-[11px] tracking-[0.12em] font-medium"
                  style={{ fontFamily: MONO, color: MUTED }}
                >
                  SEELD · EST. 2018 · רעננה · ירושלים
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12px]" style={{ color: MUTED }}>
              <span>רישיון סוכנות ביטוח · רשות שוק ההון</span>
              <span>לשכת סוכני הביטוח בישראל</span>
              <span>מבית עמיתים הון</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-10 mb-12">
            {linkColumns.map((col) => (
              <div key={col.title}>
                <h3
                  className="text-[15px] mb-5"
                  style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                >
                  {col.title}
                </h3>
                <ul className="space-y-2.5 text-[13.5px] text-[#5a6a78]">
                  {col.links.map((l, i) => (
                    <li key={l.href + l.label} className={i >= 5 ? "hidden md:list-item" : undefined}>
                      <Link to={l.href} className="hover:text-[#1D2D3D] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3
                className="text-[15px] mb-5"
                style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
              >
                צור קשר
              </h3>
              <ul className="space-y-2.5 text-[13.5px] text-[#5a6a78]">
                <li>
                  <a
                    href="tel:0523097444"
                    className="hover:text-[#1D2D3D] transition-colors tabular-nums whitespace-nowrap"
                    dir="ltr"
                  >
                    052-309-7444
                  </a>
                </li>
                <li>
                  <a href="mailto:info@seeld.co.il" className="hover:text-[#1D2D3D] transition-colors break-all">
                    info@seeld.co.il
                  </a>
                </li>
                <li>רעננה · ירושלים</li>
                <li className="pt-2">
                  <Link to="/personal-area" className="text-[#3a4c5a] hover:text-[#1D2D3D] transition-colors">
                    האזור האישי ←
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Regulatory block (STYLESEED.md — verbatim, on every page) */}
          <div className="border-t pt-6 mb-8" style={{ borderColor: LINE }}>
            <p className="text-[13px] font-medium" style={{ color: BODY }}>
              {licenseParts ? (
                <>
                  {licenseParts[1]}
                  <span dir="ltr" className="whitespace-nowrap tabular-nums">{licenseParts[2]}</span>
                </>
              ) : (
                LICENSE_LINE
              )}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed max-w-3xl" style={{ color: MUTED }}>
              {REGULATORY_LINE}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed max-w-3xl" style={{ color: MUTED }}>
              המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי.
              אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. SEELD פועלת בכפוף
              לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t" style={{ borderColor: LINE }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs" style={{ color: MUTED }}>
                &copy; {new Date().getFullYear()} SEELD · הכסף שלך, מסודר. כל הזכויות שמורות.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-[#5a6a78]">
                <Link to="/privacy" className="hover:text-[#1D2D3D] transition-colors">מדיניות פרטיות</Link>
                <Link to="/terms" className="hover:text-[#1D2D3D] transition-colors">תנאי שימוש</Link>
                <Link to="/accessibility" className="hover:text-[#1D2D3D] transition-colors">נגישות</Link>
                <Link to="/agents" className="hover:text-[#1D2D3D] transition-colors">פורטל סוכנים</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The signature — closes every page */}
      <div className="dna-gbar" />
    </footer>
  );
};

export default Footer;
