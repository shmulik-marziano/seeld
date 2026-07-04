import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/brand/Live";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

const INK = "#171717";
const BONE = "#fafafa";
const PINE = "#171717";
const BRONZE = "#6e6e6e";
const SERIF = "'Heebo', sans-serif";

const inputClass =
  "w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#171717]/35 text-base focus:outline-none focus:border-[#171717] transition-colors min-h-[44px] rounded-none";

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
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
      setFormData({ name: "", phone: "", email: "" });
    } catch {
      toast.error("שגיאה בשליחה, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer dir="rtl">
      {/* Contact band */}
      <section style={{ backgroundColor: BONE }} className="border-t border-[#171717]/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24 items-start">
            {/* Form */}
            <div>
              <h2
                className="text-[#171717] mb-2"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}
              >
                נדבר?
              </h2>
              <p className="text-[14px] text-[#171717]/50 mb-5">
                בלי ספאם. בלי טלפונים בשמונה בערב. שיחה אחת — ואתם מחליטים.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="mb-9 block transition-transform hover:-translate-y-[1px]"
                aria-label="פתיחת שיחה עם יועץ SEELD AI"
              >
                <StatusPill>SEELD AI מחובר עכשיו · לחצו לשיחה</StatusPill>
              </button>

              <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
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
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact details */}
            <div>
              <div className="border-t border-[#171717]/15">
                {[
                  { label: "טלפון", value: "052-309-7444", href: "tel:0523097444", ltr: true },
                  { label: "אימייל", value: "info@seeld.co.il", href: "mailto:info@seeld.co.il", ltr: true },
                  { label: "משרדים", value: "רעננה · ירושלים" },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-[15px] border-b border-[#171717]/10">
                    <span className="text-[13px] text-[#171717]/45">{row.label}</span>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="text-base text-[#171717] tabular-nums border-b border-transparent hover:border-[#171717]/40 transition-colors"
                        dir={row.ltr ? "ltr" : undefined}
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="text-base text-[#171717]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-[#171717]/50 hover:text-[#171717] border-b border-transparent hover:border-[#171717]/30 transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>

              <div className="mt-9 pt-6 border-t border-[#171717]/10 flex flex-wrap gap-x-6 gap-y-2">
                <Link to="/about" className="text-[13px] text-[#171717]/50 hover:text-[#171717] transition-colors">הסיפור שלנו</Link>
                <Link to="/faq" className="text-[13px] text-[#171717]/50 hover:text-[#171717] transition-colors">שאלות נפוצות</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main footer */}
      <div style={{ backgroundColor: PINE }} className="text-[#fafafa]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          {/* Wordmark + regulatory line */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-10 border-b border-white/10">
            <div>
              <div dir="ltr" className="text-right" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "2rem" }}>
                SEELD<span style={{ color: BRONZE }}>.</span>
              </div>
              <div className="text-[11px] tracking-[0.22em] text-white/40 mt-1.5">בית פיננסים פרטי</div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-white/40">
              <span>רישיון סוכנות ביטוח · רשות שוק ההון</span>
              <span>לשכת סוכני הביטוח בישראל</span>
              <span>מבית עמיתים הון</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-10 mb-12">
            {linkColumns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[12px] tracking-[0.18em] font-medium mb-5" style={{ color: BRONZE }}>
                  {col.title}
                </h3>
                <ul className="space-y-2.5 text-[14px] text-white/50">
                  {col.links.map((l, i) => (
                    <li key={l.href + l.label} className={i >= 5 ? "hidden md:list-item" : undefined}>
                      <Link to={l.href} className="hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-[12px] tracking-[0.18em] font-medium mb-5" style={{ color: BRONZE }}>
                צור קשר
              </h3>
              <ul className="space-y-2.5 text-[14px] text-white/50">
                <li>
                  <a href="tel:0523097444" className="hover:text-white transition-colors tabular-nums" dir="ltr">
                    052-309-7444
                  </a>
                </li>
                <li>
                  <a href="mailto:info@seeld.co.il" className="hover:text-white transition-colors break-all">
                    info@seeld.co.il
                  </a>
                </li>
                <li>רעננה · ירושלים</li>
                <li className="pt-2">
                  <Link to="/personal-area" className="text-white/70 hover:text-white transition-colors">
                    האזור האישי ←
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[11px] text-white/25 leading-relaxed max-w-3xl mb-8">
            המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי.
            אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. SEELD פועלת בכפוף
            לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-white/30">
                &copy; {new Date().getFullYear()} SEELD — הכסף שלך, מסודר. כל הזכויות שמורות.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-white/30">
                <Link to="/privacy" className="hover:text-white/60 transition-colors">מדיניות פרטיות</Link>
                <Link to="/terms" className="hover:text-white/60 transition-colors">תנאי שימוש</Link>
                <Link to="/accessibility" className="hover:text-white/60 transition-colors">נגישות</Link>
                <Link to="/agents" className="hover:text-white/60 transition-colors">פורטל סוכנים</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
