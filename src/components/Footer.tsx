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
