import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, FileText, ShieldCheck, Handshake, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isValidIsraeliPhone } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

const Footer = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIsraeliPhone(formData.phone)) {
      toast.error("מספר הטלפון אינו תקין");
      return;
    }
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

  const socialLinks = [
    { href: "https://www.linkedin.com/company/seeld-ins", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>, label: "LinkedIn" },
    { href: "https://www.facebook.com/seeld.ins", icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>, label: "Facebook" },
    { href: "https://www.instagram.com/seeld.ins", icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>, label: "Instagram" },
    { href: "mailto:info@seeld.co.il", icon: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>, label: "Email" },
    { href: "https://wa.me/972523097444", icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.157-2.625.78.78-2.625-.157-.252A8 8 0 1112 20z"/>, label: "WhatsApp" },
  ];

  return (
    <footer>
      {/* Contact Section - Light lavender-gray background */}
      <section className="bg-[#f0f0f8] relative overflow-hidden py-12 sm:py-20 lg:py-24">
        {/* Decorative capsule/pill shape on the left */}
        <div className="absolute top-16 left-8 hidden lg:block">
          <svg width="60" height="120" viewBox="0 0 60 120" fill="none">
            <rect x="5" y="5" width="50" height="110" rx="25" stroke="#f06ba8" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
          </svg>
        </div>

        {/* Dashed curved line with arrow on the right */}
        <div className="absolute top-20 right-12 hidden lg:block">
          <svg width="150" height="200" viewBox="0 0 150 200" fill="none">
            <path d="M10 10 C 60 10, 140 40, 120 100 S 40 180, 80 190" stroke="#3b3f99" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.25" />
            <polygon points="80,190 72,182 86,184" fill="#3b3f99" opacity="0.25" />
          </svg>
        </div>

        {/* Small colored dots */}
        <div className="absolute top-12 right-[30%] w-3 h-3 rounded-full bg-[#6b6fc4] hidden lg:block" />
        <div className="absolute bottom-16 left-[25%] w-4 h-4 rounded-full bg-[#e23d92] hidden lg:block" />
        <div className="absolute top-[40%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#f06ba8] hidden lg:block" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Form - Left side */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a4b] mb-2">צרו קשר</h2>
              <p className="text-gray-500 mb-8 text-base">השאירו פרטים ונחזור אליכם בהקדם</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="שם מלא"
                    className="w-full bg-transparent border-0 border-b-2 border-[#1a1a4b]/20 focus:border-[#f06ba8] outline-none py-3 text-[#1a1a4b] placeholder:text-gray-400 text-base transition-colors min-h-[44px]"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    required
                    placeholder="טלפון"
                    dir="ltr"
                    className="w-full bg-transparent border-0 border-b-2 border-[#1a1a4b]/20 focus:border-[#f06ba8] outline-none py-3 text-[#1a1a4b] placeholder:text-gray-400 text-base transition-colors text-right min-h-[44px]"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                    placeholder="אימייל"
                    dir="ltr"
                    className="w-full bg-transparent border-0 border-b-2 border-[#1a1a4b]/20 focus:border-[#f06ba8] outline-none py-3 text-[#1a1a4b] placeholder:text-gray-400 text-base transition-colors text-right min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#1a1a4b] text-white rounded-full px-10 py-3.5 font-semibold text-base hover:bg-[#232159] transition-colors shadow-lg shadow-[#1a1a4b]/20 min-h-[48px] flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                </button>
              </form>

              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-8 flex-wrap">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-11 h-11 rounded-full bg-[#1a1a4b] flex items-center justify-center hover:bg-[#232159] transition-colors min-w-[44px] min-h-[44px]"
                  >
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">{social.icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Info - Right side */}
            <div className="lg:pt-4">
              <h3 className="text-xl font-bold text-[#1a1a4b] mb-6">דרכי התקשרות</h3>
              <div className="space-y-5">
                <a href="tel:0523097444" className="flex items-center gap-3 text-gray-600 hover:text-[#1a1a4b] transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-[#f06ba8] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#f06ba8]/20">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-medium" dir="ltr">052-309-7444</span>
                </a>
                <a href="mailto:info@seeld.co.il" className="flex items-center gap-3 text-gray-600 hover:text-[#1a1a4b] transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-[#3b3f99] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#3b3f99]/20">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-medium">info@seeld.co.il</span>
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-11 h-11 rounded-full bg-[#6b6fc4] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#6b6fc4]/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-medium">רעננה | ירושלים</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1a1a4b]/10">
                <Link to="/about" className="block text-sm text-gray-500 hover:text-[#1a1a4b] transition-colors mb-2 font-medium">הסיפור שלנו</Link>
                <Link to="/faq" className="block text-sm text-gray-500 hover:text-[#1a1a4b] transition-colors font-medium">שאלות נפוצות</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Badges Bar */}
      <div className="bg-[#1a1a4b] py-8 sm:py-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8 items-center text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f06ba8] flex items-center justify-center shadow-lg shadow-[#f06ba8]/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/80 text-sm font-medium leading-snug">
                רישיון סוכנות ביטוח<br />מטעם רשות שוק ההון
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#6b6fc4] flex items-center justify-center shadow-lg shadow-[#6b6fc4]/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/80 text-sm font-medium leading-snug">
                לשכת סוכני הביטוח<br />בישראל
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#e23d92] flex items-center justify-center shadow-lg shadow-[#e23d92]/20">
                <Handshake className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/80 text-sm font-medium leading-snug">
                מבית<br />עמיתים הון
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links & Bottom */}
      <div className="bg-[#1a1a4b] text-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 mb-10 sm:mb-14">
            {/* Column 1 - Services */}
            <div>
              <h3 className="font-bold text-white text-sm mb-5">שירותים</h3>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/onboarding" className="hover:text-white transition-colors">שאלון הצטרפות</Link></li>
                <li><Link to="/direct-debit" className="hover:text-white transition-colors">מילוי טופס הו"ק</Link></li>
                <li><Link to="/calculators" className="hover:text-white transition-colors">מחשבונים</Link></li>
                <li><Link to="/return-tables" className="hover:text-white transition-colors">טבלאות תשואה</Link></li>
                <li><Link to="/rights-extraction" className="hover:text-white transition-colors">מיצוי זכויות</Link></li>
              </ul>
            </div>

            {/* Column 2 - Insurance */}
            <div>
              <h3 className="font-bold text-white text-sm mb-5">ביטוחים</h3>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/insurance/health" className="hover:text-white transition-colors">ביטוח בריאות</Link></li>
                <li><Link to="/insurance/life" className="hover:text-white transition-colors">ביטוח חיים</Link></li>
                <li><Link to="/insurance/vehicle" className="hover:text-white transition-colors">ביטוח רכב</Link></li>
                <li><Link to="/insurance/home" className="hover:text-white transition-colors">ביטוח דירה</Link></li>
                <li><Link to="/insurance/mortgage" className="hover:text-white transition-colors">ביטוח משכנתא</Link></li>
                <li><Link to="/insurance/travel" className="hover:text-white transition-colors">ביטוח נסיעות</Link></li>
                <li><Link to="/insurance/disability" className="hover:text-white transition-colors">אובדן כושר עבודה</Link></li>
                <li><Link to="/insurance/business" className="hover:text-white transition-colors">ביטוח עסק</Link></li>
              </ul>
            </div>

            {/* Column 3 - Savings */}
            <div>
              <h3 className="font-bold text-white text-sm mb-5">חיסכון ופנסיה</h3>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/savings/pension-funds" className="hover:text-white transition-colors">קרנות פנסיה</Link></li>
                <li><Link to="/savings/gemel-funds" className="hover:text-white transition-colors">קופות גמל</Link></li>
                <li><Link to="/savings/training-funds" className="hover:text-white transition-colors">קרנות השתלמות</Link></li>
                <li><Link to="/savings/gemel-investment" className="hover:text-white transition-colors">גמל להשקעה</Link></li>
                <li><Link to="/savings/child-savings" className="hover:text-white transition-colors">חיסכון לילד</Link></li>
                <li><Link to="/savings/pre-retirement" className="hover:text-white transition-colors">לקראת פרישה</Link></li>
                <li><Link to="/savings/financial-planning" className="hover:text-white transition-colors">תכנון פיננסי</Link></li>
              </ul>
            </div>

            {/* Column 4 - Contact */}
            <div>
              <h3 className="font-bold text-white text-sm mb-5">צור קשר</h3>
              <ul className="space-y-4 text-sm text-white/50">
                <li>
                  <a href="tel:0523097444" className="flex items-center gap-2.5 hover:text-white transition-colors">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    052-309-7444
                  </a>
                </li>
                <li>
                  <a href="mailto:info@seeld.co.il" className="flex items-center gap-2.5 hover:text-white transition-colors break-all">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    info@seeld.co.il
                  </a>
                </li>
                <li>
                  <span className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    רעננה | ירושלים
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[11px] text-white/25 leading-relaxed max-w-3xl mx-auto text-center px-4 mb-8">
            המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי.
            אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. SEELD פועלת בכפוף
            לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-white/30">
                &copy; {new Date().getFullYear()} SEELD — ביטוח, חיסכון ופנסיה | מבית עמיתים הון. כל הזכויות שמורות.
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
