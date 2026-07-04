import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

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

const valueProps = [
  {
    title: "תשואות מנוהלות",
    description: "הכספים שלכם מנוהלים על ידי מנהלי השקעות מקצועיים. אנחנו דואגים שתהיו במסלול הנכון.",
  },
  {
    title: "דמי ניהול נמוכים",
    description: "מנהלים משא ומתן מול כל החברות כדי להוריד את דמי הניהול שלכם למינימום.",
  },
  {
    title: "תכנון לטווח ארוך",
    description: "בונים איתכם תוכנית פיננסית שעובדת לאורך שנים — מההפקדה הראשונה ועד הפנסיה.",
  },
];

const Savings = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">חיסכון ופנסיה</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              חיסכון ופנסיה
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            חיסכון ופנסיה
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9]">
            קרנות פנסיה, קופות גמל, קרנות השתלמות והכנה לפרישה — הכל מסודר ומנוהל. בחרו את הנושא שמעניין אתכם.
          </p>
        </div>
      </section>

      <main>
        {/* Categories */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                הקטגוריות
              </div>
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                בחרו נושא
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-x-16">
              {savingsCategories.map((category) => (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10 hover:border-[#171717]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-[#171717] mb-1">{category.title}</h3>
                    <p className="text-[13px] text-[#171717]/40 leading-relaxed">{category.description}</p>
                    <p className="text-[12px] text-[#171717]/35 mt-1.5">
                      {category.highlights.map((highlight, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span style={{ color: BRONZE }}> · </span>}
                          {highlight}
                        </span>
                      ))}
                    </p>
                  </div>
                  <span className="text-[#171717]/30 group-hover:text-[#171717] transition-all group-hover:-translate-x-1 shrink-0">
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
            <div className="border-t border-[#171717]/20 pt-5 mb-10">
              <h2
                className="text-[#171717] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                למה איתנו
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-x-10 gap-y-10">
              {valueProps.map((prop, idx) => (
                <div key={prop.title} className="border-t border-[#171717]/15 pt-5">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    {prop.title}
                  </h3>
                  <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{prop.description}</p>
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
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                רוצים ניתוח פנסיוני?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם — בחינם ובלי התחייבות
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
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
