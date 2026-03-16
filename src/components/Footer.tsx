import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0a3d3d] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-14">
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
                <a href="mailto:info@seeld-ins.co.il" className="flex items-center gap-2.5 hover:text-white transition-colors break-all">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  info@seeld-ins.co.il
                </a>
              </li>
              <li>
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  ישראל
                </span>
              </li>
            </ul>
            <div className="mt-6 space-y-2">
              <Link to="/about" className="block text-sm text-white/50 hover:text-white transition-colors">הסיפור שלנו</Link>
              <Link to="/faq" className="block text-sm text-white/50 hover:text-white transition-colors">שאלות נפוצות</Link>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { href: "https://www.facebook.com/", icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>, label: "Facebook" },
            { href: "https://www.instagram.com/", icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>, label: "Instagram" },
            { href: "https://www.linkedin.com/", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>, label: "LinkedIn" },
            { href: "https://www.tiktok.com/", icon: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>, label: "TikTok" },
            { href: "https://www.youtube.com/", icon: <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>, label: "YouTube" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all"
            >
              <svg className="w-4 h-4 fill-white/60" viewBox="0 0 24 24">{social.icon}</svg>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-white/25 leading-relaxed max-w-3xl mx-auto text-center px-4 mb-8">
          המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי.
          אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. SeelD פועלת בכפוף
          לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} SEELD — חלק מבית עמיתים הון, סוכנות ביטוח ופיננסים. כל הזכויות שמורות.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-white/30">
              <Link to="/privacy" className="hover:text-white/60 transition-colors">מדיניות פרטיות</Link>
              <Link to="/terms" className="hover:text-white/60 transition-colors">תנאי שימוש</Link>
              <Link to="/accessibility" className="hover:text-white/60 transition-colors">נגישות</Link>
              <Link to="/app/auth" className="hover:text-white/60 transition-colors">פורטל סוכנים</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
