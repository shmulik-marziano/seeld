import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Shield, AlertTriangle, Users, Home, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

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
    color: "#e76f51",
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
    color: "#f4a261",
  },
  {
    id: "life",
    title: "ביטוחי חיים",
    description: "הבטחת עתיד המשפחה עם כיסוי למקרה מוות ונכות",
    href: "/insurance/life",
    icon: Users,
    doodle: "family",
    highlights: ["ביטוח חיים זוגי", "שחרור מפרמיה", "כיסוי נכות"],
    color: "#90be6d",
  },
  {
    id: "mortgage",
    title: "ביטוח משכנתא",
    description: "הגנה על הבית והמשפחה במקרה של פטירה או אובדן כושר עבודה",
    href: "/insurance/mortgage",
    icon: Home,
    doodle: "pension",
    highlights: ["כיסוי יתרת משכנתא", "פרמיה יורדת", "התאמה אישית"],
    color: "#5ec6c6",
  },
  {
    id: "partners",
    title: "ריסק שותפים",
    description: "הגנה על העסק והשותפים במקרה של פטירת אחד השותפים",
    href: "/insurance/partners",
    icon: Handshake,
    doodle: "handshake",
    highlights: ["הגנה על העסק", "רכישת מניות", "המשכיות עסקית"],
    color: "#e76f51",
  },
];

const valueProps = [
  {
    title: "ייעוץ מקצועי",
    description: "צוות מומחים מנוסה שמלווה אתכם בבחירת הביטוח המושלם עם התאמה אישית לצרכים שלכם.",
  },
  {
    title: "הגנה מלאה למשפחה",
    description: "כיסוי ביטוחי מקיף שמגן עליכם ועל יקיריכם בכל תרחיש, מבריאות ועד רכוש.",
  },
  {
    title: "ליווי בתביעות",
    description: "תמיכה מלאה בעת הגשת תביעות ומימוש הזכויות שלכם. אנחנו איתכם בכל שלב.",
  },
];

const Insurances = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#1a1a18]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#1a1a18]/40">
              <Link to="/" className="hover:text-[#1a1a18] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#1a1a18]/70 font-medium">ביטוח</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              תחומי ביטוח
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            מוצרי ביטוח
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9]">
            סקירה מקיפה של כל סוגי הביטוחים והכיסויים הזמינים עבורכם. בחרו את הקטגוריה המתאימה וקבלו מידע מפורט.
          </p>
        </div>
      </section>

      <main>
        {/* Insurance Categories */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                הקטגוריות
              </div>
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                בחרו תחום
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-x-16">
              {insuranceCategories.map((category) => (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group flex items-baseline justify-between gap-6 py-[14px] border-b border-[#1a1a18]/10 hover:border-[#1a1a18]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[#1a1a18] mb-1">{category.title}</h3>
                    <p className="text-[13px] text-[#1a1a18]/40 leading-relaxed">{category.description}</p>
                    <p className="text-[12px] text-[#1a1a18]/35 mt-1.5">
                      {category.highlights.map((highlight, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span style={{ color: BRONZE }}> · </span>}
                          {highlight}
                        </span>
                      ))}
                    </p>
                  </div>
                  <span className="text-[#1a1a18]/30 group-hover:text-[#1a1a18] transition-all group-hover:-translate-x-1 shrink-0">
                    ←
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                למה איתנו
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-x-10 gap-y-10">
              {valueProps.map((prop, idx) => (
                <div key={prop.title} className="border-t border-[#1a1a18]/15 pt-5">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg text-[#1a1a18] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {prop.title}
                  </h3>
                  <p className="text-[13.5px] text-[#1a1a18]/50 leading-[1.8]">{prop.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#f6f5f1] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                רוצים לדעת יותר?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-[1.85] mb-8 max-w-xl">
                צרו קשר עם הסוכנים שלנו לקבלת הצעת מחיר מותאמת אישית
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#f6f5f1] text-[#1a1a18] text-[15px] font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
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
