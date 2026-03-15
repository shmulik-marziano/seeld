import { Link } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative mt-20">
      {/* Top wave separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="bg-gradient-to-b from-card/80 to-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Top: Logo + Contact */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-14">
            <div className="space-y-4">
              <SeeIDLogo size="lg" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                הבית שלכם לפתרונות פיננסיים וביטוחיים מותאמים אישית. ליווי מקצועי בכל שלבי החיים.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="tel:0523097444" className="inline-flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="w-3.5 h-3.5" />
                052-309-7444
              </a>
              <a href="mailto:info@seeld-ins.co.il" className="inline-flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="w-3.5 h-3.5" />
                info@seeld-ins.co.il
              </a>
              <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                ישראל
              </span>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            <div>
              <h3 className="font-bold mb-5 text-xs tracking-widest uppercase text-accent">שירותים</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/onboarding" className="hover:text-foreground transition-colors">שאלון הצטרפות</Link></li>
                <li><Link to="/direct-debit" className="hover:text-foreground transition-colors">מילוי טופס הו"ק</Link></li>
                <li><Link to="/insurance/health" className="hover:text-foreground transition-colors">ביטוח בריאות</Link></li>
                <li><a href="https://perspective-bloom-317.lovable.app/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">ביטוח בקליק</a></li>
                <li><Link to="/insurance/vehicle" className="hover:text-foreground transition-colors">ביטוח רכב</Link></li>
                <li><Link to="/savings/pension-funds" className="hover:text-foreground transition-colors">חיסכון ופנסיה</Link></li>
                <li><Link to="/calculators" className="hover:text-foreground transition-colors">מחשבונים</Link></li>
                <li><Link to="/return-tables" className="hover:text-foreground transition-colors">טבלאות תשואה</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-5 text-xs tracking-widest uppercase text-accent">ביטוחים</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/insurance/life" className="hover:text-foreground transition-colors">ביטוח חיים</Link></li>
                <li><Link to="/insurance/mortgage" className="hover:text-foreground transition-colors">ביטוח משכנתא</Link></li>
                <li><Link to="/insurance/critical-illness" className="hover:text-foreground transition-colors">מחלות קשות</Link></li>
                <li><Link to="/insurance/disability" className="hover:text-foreground transition-colors">אובדן כושר עבודה</Link></li>
                <li><Link to="/insurance/accidents" className="hover:text-foreground transition-colors">תאונות אישיות</Link></li>
                <li><Link to="/insurance/home" className="hover:text-foreground transition-colors">ביטוח דירה</Link></li>
                <li><Link to="/insurance/travel" className="hover:text-foreground transition-colors">ביטוח נסיעות</Link></li>
                <li><Link to="/insurance/dental" className="hover:text-foreground transition-colors">ביטוח שיניים</Link></li>
                <li><Link to="/insurance/nursing" className="hover:text-foreground transition-colors">ביטוח סיעודי</Link></li>
                <li><Link to="/insurance/business" className="hover:text-foreground transition-colors">ביטוח עסק</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-5 text-xs tracking-widest uppercase text-accent">חיסכון ופנסיה</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/savings/pension-funds" className="hover:text-foreground transition-colors">קרנות פנסיה</Link></li>
                <li><Link to="/savings/gemel-funds" className="hover:text-foreground transition-colors">קופות גמל</Link></li>
                <li><Link to="/savings/training-funds" className="hover:text-foreground transition-colors">קרנות השתלמות</Link></li>
                <li><Link to="/savings/gemel-investment" className="hover:text-foreground transition-colors">גמל להשקעה</Link></li>
                <li><Link to="/savings/child-savings" className="hover:text-foreground transition-colors">חיסכון לילד</Link></li>
                <li><Link to="/savings/pre-retirement" className="hover:text-foreground transition-colors">לקראת פרישה</Link></li>
                <li><Link to="/savings/post-retirement" className="hover:text-foreground transition-colors">אחרי פרישה</Link></li>
                <li><Link to="/savings/financial-planning" className="hover:text-foreground transition-colors">תכנון פיננסי</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-5 text-xs tracking-widest uppercase text-accent">אודות</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
                <li><Link to="/about" className="hover:text-foreground transition-colors">הסיפור שלנו</Link></li>
                <li><Link to="/authors" className="hover:text-foreground transition-colors">הצוות</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">יצירת קשר</Link></li>
                <li><a href="/#articles" className="hover:text-foreground transition-colors">מאמרים</a></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">שאלות נפוצות</Link></li>
                <li><a href="https://seeld.co.il" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-medium">שמוליק מרציאנו ←</a></li>
                <li><a href="https://perspective-bloom-317.lovable.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-medium">שירותים בקליק ←</a></li>
                <li><Link to="/app/auth" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">כניסה לסוכנים ←</Link></li>
              </ul>
              <h3 className="font-bold mb-4 text-xs tracking-widest uppercase text-muted-foreground/50">משפטי</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">מדיניות פרטיות</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">תנאי שימוש</Link></li>
                <li><Link to="/accessibility" className="hover:text-foreground transition-colors">הצהרת נגישות</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-foreground transition-colors">מדיניות עוגיות</Link></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="pb-6 text-[11px] text-muted-foreground/40 leading-relaxed max-w-3xl mx-auto text-center">
            המידע באתר זה הינו כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי. 
            אין להסתמך על המידע באתר כתחליף לייעוץ מקצועי אישי. SeelD פועלת בכפוף 
            לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-border/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground/50">
                © {new Date().getFullYear()} SEELD — סוכנות לביטוח ופיננסים בבעלות שמוליק מרציאנו. כל הזכויות שמורות.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/app/auth" className="text-xs text-muted-foreground/50 hover:text-accent transition-colors">
                  פורטל סוכנים
                </Link>
                <span className="text-xs text-muted-foreground/40">בנוי באהבה 🇮🇱</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
