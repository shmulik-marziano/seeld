import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoodleIcon from "@/components/DoodleIcon";
import { Heart, Shield, AlertTriangle, Users, Home, Handshake, ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

interface InsuranceCategory {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  doodle: string;
  highlights: string[];
  color: string;
}

const insuranceCategories: InsuranceCategory[] = [
  {
    id: "health",
    title: "ביטוחי בריאות",
    description: "כיסוי מקיף לטיפולים רפואיים, ניתוחים, תרופות ובדיקות מתקדמות",
    href: "/insurance/health",
    icon: Heart,
    doodle: "family",
    highlights: ["ניתוחים בארץ ובחו״ל", "תרופות מחוץ לסל", "ייעוץ ובדיקות"],
    color: "#3b3f99",
  },
  {
    id: "critical",
    title: "מחלות קשות",
    description: "הגנה כלכלית במקרה של אבחון מחלה קשה עם מענק כספי חד פעמי",
    href: "/insurance/critical-illness",
    icon: Shield,
    doodle: "shield",
    highlights: ["מענק חד פעמי", "כיסוי מגוון מחלות", "ללא תלות בהוצאות"],
    color: "#6c63ff",
  },
  {
    id: "accidents",
    title: "תאונות אישיות",
    description: "פיצוי במקרה של פגיעה או נכות כתוצאה מתאונה",
    href: "/insurance/accidents",
    icon: AlertTriangle,
    doodle: "umbrella",
    highlights: ["כיסוי 24/7", "נכות תעסוקתית", "הרחבות לספורט"],
    color: "#6b6fc4",
  },
  {
    id: "life",
    title: "ביטוחי חיים",
    description: "הבטחת עתיד המשפחה עם כיסוי למקרה מוות ונכות",
    href: "/insurance/life",
    icon: Users,
    doodle: "family",
    highlights: ["ביטוח חיים זוגי", "שחרור מפרמיה", "כיסוי נכות"],
    color: "#f06ba8",
  },
  {
    id: "mortgage",
    title: "ביטוח משכנתא",
    description: "הגנה על הבית והמשפחה במקרה של פטירה או אובדן כושר עבודה",
    href: "/insurance/mortgage",
    icon: Home,
    doodle: "pension",
    highlights: ["כיסוי יתרת משכנתא", "פרמיה יורדת", "התאמה אישית"],
    color: "#d6157e",
  },
  {
    id: "partners",
    title: "ריסק שותפים",
    description: "הגנה על העסק והשותפים במקרה של פטירת אחד השותפים",
    href: "/insurance/partners",
    icon: Handshake,
    doodle: "handshake",
    highlights: ["הגנה על העסק", "רכישת מניות", "המשכיות עסקית"],
    color: "#3b3f99",
  },
];

const Insurances = () => {
  usePageMeta("מוצרי ביטוח", "סקירה מקיפה של כל סוגי הביטוחים: בריאות, חיים, רכב, דירה, עסק ועוד — והשוואה בין כל החברות.");
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#d6157e]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#3b3f99]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#6b6fc4]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#1a1a4b" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#1a1a4b" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1a1a4b] mb-4 leading-tight">
            מוצרי <span className="text-[#d6157e]">ביטוח</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            סקירה מקיפה של כל סוגי הביטוחים והכיסויים הזמינים עבורכם. בחרו את הקטגוריה המתאימה וקבלו מידע מפורט.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#1a1a4b] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1a1a4b] font-medium">ביטוח</span>
        </nav>
      </div>

      <main>
        {/* Insurance Categories Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {insuranceCategories.map((category) => (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 block"
                >
                  <div className="w-14 h-14 flex items-center justify-center mb-5">
                    <DoodleIcon name={category.doodle} size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a4b] mb-2">{category.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {category.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-[#f8f9fc] text-[#1a1a4b] rounded-full border border-gray-100"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-[#1a1a4b] text-sm font-medium group-hover:gap-2 transition-all">
                    <span>למידע נוסף</span>
                    <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="shield" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a4b] mb-2">ייעוץ מקצועי</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  צוות מומחים מנוסה שמלווה אתכם בבחירת הביטוח המושלם עם התאמה אישית לצרכים שלכם.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="family" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a4b] mb-2">הגנה מלאה למשפחה</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  כיסוי ביטוחי מקיף שמגן עליכם ועל יקיריכם בכל תרחיש, מבריאות ועד רכוש.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="handshake" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a4b] mb-2">ליווי בתביעות</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  תמיכה מלאה בעת הגשת תביעות ומימוש הזכויות שלכם. אנחנו איתכם בכל שלב.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-[#d6157e] opacity-10" />
              <div className="absolute bottom-4 left-10 w-14 h-14 rounded-full bg-[#3b3f99] opacity-10" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a4b] mb-3 relative z-10">רוצים לדעת יותר?</h2>
              <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xl mx-auto relative z-10">
                צרו קשר עם הסוכנים שלנו לקבלת הצעת מחיר מותאמת אישית
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#d6157e] text-white font-semibold rounded-full hover:bg-[#cc1672] transition-colors relative z-10"
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
