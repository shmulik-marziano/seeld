import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Shield, AlertTriangle, Users, Home, Handshake, ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface InsuranceCategory {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
}

const insuranceCategories: InsuranceCategory[] = [
  {
    id: "health",
    title: "ביטוחי בריאות",
    description: "כיסוי מקיף לטיפולים רפואיים, ניתוחים, תרופות ובדיקות מתקדמות",
    href: "/insurance/health",
    icon: Heart,
    highlights: ["ניתוחים בארץ ובחו״ל", "תרופות מחוץ לסל", "ייעוץ ובדיקות"],
  },
  {
    id: "critical",
    title: "מחלות קשות",
    description: "הגנה כלכלית במקרה של אבחון מחלה קשה עם מענק כספי חד פעמי",
    href: "/insurance/critical-illness",
    icon: Shield,
    highlights: ["מענק חד פעמי", "כיסוי מגוון מחלות", "ללא תלות בהוצאות"],
  },
  {
    id: "accidents",
    title: "תאונות אישיות",
    description: "פיצוי במקרה של פגיעה או נכות כתוצאה מתאונה",
    href: "/insurance/accidents",
    icon: AlertTriangle,
    highlights: ["כיסוי 24/7", "נכות תעסוקתית", "הרחבות לספורט"],
  },
  {
    id: "life",
    title: "ביטוחי חיים",
    description: "הבטחת עתיד המשפחה עם כיסוי למקרה מוות ונכות",
    href: "/insurance/life",
    icon: Users,
    highlights: ["ביטוח חיים זוגי", "שחרור מפרמיה", "כיסוי נכות"],
  },
  {
    id: "mortgage",
    title: "ביטוח משכנתא",
    description: "הגנה על הבית והמשפחה במקרה של פטירה או אובדן כושר עבודה",
    href: "/insurance/mortgage",
    icon: Home,
    highlights: ["כיסוי יתרת משכנתא", "פרמיה יורדת", "התאמה אישית"],
  },
  {
    id: "partners",
    title: "ריסק שותפים",
    description: "הגנה על העסק והשותפים במקרה של פטירת אחד השותפים",
    href: "/insurance/partners",
    icon: Handshake,
    highlights: ["הגנה על העסק", "רכישת מניות", "המשכיות עסקית"],
  },
];

const Insurances = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#0a3d3d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            מוצרי ביטוח
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            סקירה מקיפה של כל סוגי הביטוחים והכיסויים הזמינים עבורכם. בחרו את הקטגוריה המתאימה וקבלו מידע מפורט.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">ביטוח</span>
        </nav>
      </div>

      <main>
        {/* Insurance Categories Grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {insuranceCategories.map((category) => (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 block"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-5">
                    <category.icon className="w-6 h-6 text-[#0a3d3d]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0a3d3d] mb-2">{category.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {category.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-gray-50 text-[#0a3d3d] rounded-full border border-gray-100"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-[#0a3d3d] text-sm font-medium group-hover:gap-2 transition-all">
                    <span>למידע נוסף</span>
                    <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">ייעוץ מקצועי</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  צוות מומחים מנוסה שמלווה אתכם בבחירת הביטוח המושלם עם התאמה אישית לצרכים שלכם.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">הגנה מלאה למשפחה</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  כיסוי ביטוחי מקיף שמגן עליכם ועל יקיריכם בכל תרחיש, מבריאות ועד רכוש.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">ליווי בתביעות</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  תמיכה מלאה בעת הגשת תביעות ומימוש הזכויות שלכם. אנחנו איתכם בכל שלב.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">רוצים לדעת יותר?</h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                צרו קשר עם הסוכנים שלנו לקבלת הצעת מחיר מותאמת אישית
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#5ec6c6] text-[#0a3d3d] font-semibold rounded-full hover:bg-[#4db5b5] transition-colors"
              >
                צרו קשר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Insurances;
