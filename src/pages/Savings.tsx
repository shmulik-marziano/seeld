import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoodleIcon from "@/components/DoodleIcon";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface SavingsCategory {
  id: string;
  title: string;
  description: string;
  href: string;
  doodle: string;
  highlights: string[];
  color: string;
}

const savingsCategories: SavingsCategory[] = [
  {
    id: "pension",
    title: "קרנות פנסיה",
    description: "הפקדות, כיסויים ומסלול נכון — כי ברירת המחדל היא לא תמיד הכי טובה",
    href: "/savings/pension-funds",
    doodle: "pension",
    highlights: ["מסלולי השקעה", "כיסוי נכות ושאירים", "דמי ניהול"],
    color: "#5ec6c6",
  },
  {
    id: "gemel",
    title: "קופות גמל",
    description: "חיסכון לטווח ארוך עם הטבות מס",
    href: "/savings/gemel-funds",
    doodle: "savings",
    highlights: ["הטבות מס", "גמישות במשיכה", "תשואות מנוהלות"],
    color: "#90be6d",
  },
  {
    id: "gemel-invest",
    title: "גמל להשקעה",
    description: "חיסכון נזיל בשוק ההון — בלי שקופות ובלי תקופות נעילה",
    href: "/savings/gemel-investment",
    doodle: "growth",
    highlights: ["נזילות מלאה", "פטור ממס רווחי הון", "מגוון מסלולים"],
    color: "#f4a261",
  },
  {
    id: "child",
    title: "חיסכון לכל ילד",
    description: "ניהול כספי התוכנית הממשלתית",
    href: "/savings/child-savings",
    doodle: "family",
    highlights: ["הפקדה ממשלתית", "בחירת מסלול", "פטור ממס"],
    color: "#e76f51",
  },
  {
    id: "training",
    title: "קרנות השתלמות",
    description: "חיסכון לשש שנים עם פטור ממס רווחי הון",
    href: "/savings/training-funds",
    doodle: "lightbulb",
    highlights: ["פטור ממס", "נזילות אחרי 6 שנים", "תשואות גבוהות"],
    color: "#6c63ff",
  },
  {
    id: "investment",
    title: "השקעות",
    description: "בחירת מסלולי השקעה ומעקב תשואות",
    href: "/savings/investment",
    doodle: "charts",
    highlights: ["מסלולים מותאמים", "מעקב תשואות", "ניהול מקצועי"],
    color: "#5ec6c6",
  },
  {
    id: "pension-life",
    title: "ביטוח חיים פנסיוני",
    description: "חיסכון עם כיסוי למקרה מוות ונכות",
    href: "/savings/pension-life-insurance",
    doodle: "shield",
    highlights: ["כיסוי ביטוחי", "חיסכון משולב", "גמישות"],
    color: "#e76f51",
  },
  {
    id: "employer",
    title: "קופות מעסיקים",
    description: "הפקדות לעובדים, ציות לחוק ובחירת מוצרים",
    href: "/savings/employer-funds",
    doodle: "handshake",
    highlights: ["ציות לחוק", "ניהול הפקדות", "בחירת מוצרים"],
    color: "#f4a261",
  },
  {
    id: "pre-retirement",
    title: "טרום פרישה",
    description: "עוד 5-10 שנים לפנסיה? עכשיו זה הזמן לבדוק שהכל מסודר",
    href: "/savings/pre-retirement",
    doodle: "target",
    highlights: ["בדיקת צבירה", "תכנון מס", "התאמת מסלול"],
    color: "#90be6d",
  },
  {
    id: "post-retirement",
    title: "לאחר פרישה",
    description: "משיכת כספים, קצבאות ותכנון מס — שלא תפסידו שקל מיותר",
    href: "/savings/post-retirement",
    doodle: "savings",
    highlights: ["קצבה חודשית", "תכנון מס", "משיכת כספים"],
    color: "#6c63ff",
  },
  {
    id: "financial-planning",
    title: "תכנון פיננסי",
    description: "מיפוי מלא של הנכסים ובניית תוכנית",
    href: "/savings/financial-planning",
    doodle: "calculator",
    highlights: ["מיפוי נכסים", "תוכנית פעולה", "ליווי שוטף"],
    color: "#5ec6c6",
  },
];

const Savings = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner — identical style to Insurances */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#90be6d]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            חיסכון <span className="text-[#90be6d]">ופנסיה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            קרנות פנסיה, קופות גמל, קרנות השתלמות והכנה לפרישה — הכל מסודר ומנוהל. בחרו את הנושא שמעניין אתכם.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">חיסכון ופנסיה</span>
        </nav>
      </div>

      <main>
        {/* Categories Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsCategories.map((category) => (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 block"
                >
                  <div className="w-14 h-14 flex items-center justify-center mb-5">
                    <DoodleIcon name={category.doodle} size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0a3d3d] mb-2">{category.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {category.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-[#f8f9fc] text-[#0a3d3d] rounded-full border border-gray-100"
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
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="growth" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">תשואות מנוהלות</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  הכספים שלכם מנוהלים על ידי מנהלי השקעות מקצועיים. אנחנו דואגים שתהיו במסלול הנכון.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="savings" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">דמי ניהול נמוכים</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  מנהלים משא ומתן מול כל החברות כדי להוריד את דמי הניהול שלכם למינימום.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <DoodleIcon name="target" size={48} />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">תכנון לטווח ארוך</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  בונים איתכם תוכנית פיננסית שעובדת לאורך שנים — מההפקדה הראשונה ועד הפנסיה.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-[#90be6d] opacity-10" />
              <div className="absolute bottom-4 left-10 w-14 h-14 rounded-full bg-[#5ec6c6] opacity-10" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-3 relative z-10">רוצים ניתוח פנסיוני?</h2>
              <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xl mx-auto relative z-10">
                נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם — בחינם ובלי התחייבות
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#90be6d] text-white font-semibold rounded-full hover:bg-[#7dab5a] transition-colors relative z-10"
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

export default Savings;
