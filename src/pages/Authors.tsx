import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, Award, Shield, Heart, Briefcase, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { RING } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

// Outline contact buttons — white rectangles on the paper tile
const contactBtnClass =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-[#171717] hover:bg-[#fafafa] transition-colors text-sm font-medium min-h-[44px]";

const Authors = () => {
  const specialties = [
    { icon: Shield, title: "ביטוח כללי", description: "ביטוחי בריאות, חיים, רכב, דירה, עסקי ונסיעות" },
    { icon: TrendingUp, title: "חיסכון ופנסיה", description: "קרנות פנסיה, קופות גמל, קרנות השתלמות והשקעות" },
    { icon: Heart, title: "ביטוח סיעודי", description: "תכנון כיסוי סיעודי מותאם אישית למבוגרים ומשפחות" },
    { icon: Users, title: "תכנון פיננסי למשפחות", description: "ליווי מקיף לתכנון כלכלי בכל שלבי החיים" },
    { icon: Briefcase, title: "ביטוח עסקי", description: "פתרונות ביטוח מקיפים לעסקים קטנים וגדולים" },
    { icon: Award, title: "מיצוי זכויות", description: "איתור כספים אבודים והחזרי מס" },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      <main>
        {/* ══════ THE AGENT — one quiet paper tile, no figures ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-[#171717]/20 pt-6 mb-12 sm:mb-16">
              <h1
                className="text-[#171717] leading-[1.15]"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", letterSpacing: "-0.03em" }}
              >
                הסוכן שלכם
              </h1>
              <p className="mt-4 text-lg text-[#5c5c5c] leading-relaxed max-w-3xl">
                ליווי אישי ומקצועי בתחומי הפיננסים והביטוח
              </p>
            </div>

            {/* Agent card */}
            <ScrollReveal>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div
                  className="w-32 h-32 rounded-full bg-white flex items-center justify-center flex-shrink-0"
                  style={{ boxShadow: RING }}
                >
                  <span className="text-4xl text-[#171717]" style={{ fontFamily: HEEBO, fontWeight: 600 }}>שמ</span>
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h2
                    className="text-[#171717] mb-1.5"
                    style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
                  >
                    שמוליק מרציאנו
                  </h2>
                  <p className="text-[#5c5c5c] font-medium text-lg mb-4">סוכן ביטוח ופנסיה מוסמך</p>
                  <p className="text-[#4d4d4d] leading-[1.9] max-w-2xl mb-6">
                    שמוליק מרציאנו הוא סוכן ביטוח ופנסיה מוסמך עם ניסיון עשיר בתחום הפיננסי.
                    מתמחה בבניית תוכניות ביטוח וחיסכון מותאמות אישית, תוך שקיפות מלאה
                    ומחויבות לאינטרס הלקוח. מלווה לקוחות רבים בכל שלבי החיים, מתכנון פנסיוני חכם
                    ועד הגנה ביטוחית מקיפה.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <a href="tel:0523097444" className={contactBtnClass} style={{ boxShadow: RING }}>
                      <Phone className="w-4 h-4" />
                      <span dir="ltr" className="tabular-nums">052-309-7444</span>
                    </a>
                    <a href="mailto:shmulik@seeld.co.il" className={contactBtnClass} style={{ boxShadow: RING }}>
                      <Mail className="w-4 h-4" />
                      אימייל
                    </a>
                    <a
                      href="https://wa.me/972523097444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#171717] text-[#fafafa] hover:bg-black transition-colors text-sm font-medium min-h-[44px]"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div></div>
        </section>

        {/* ══════ SPECIALTIES — ruled list on paper ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-16 relative z-10">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)", letterSpacing: "-0.02em" }}
                >
                  תחומי התמחות
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
              {specialties.map((spec, index) => (
                <ScrollReveal key={spec.title} delay={index * 60}>
                  <div className="border-t border-[#171717]/15 pt-5 h-full">
                    <spec.icon className="w-5 h-5 text-[#171717] mb-3" strokeWidth={1.5} />
                    <h3 className="text-base text-[#171717] mb-1.5" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                      {spec.title}
                    </h3>
                    <p className="text-[#5c5c5c] text-sm leading-[1.8]">{spec.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div></div>
        </section>

        {/* ══════ CTA — ink tile ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20 relative z-10">
            <ScrollReveal>
              <div className="border-t border-white/20 pt-6 max-w-3xl">
                <h2
                  className="text-[#fafafa] leading-tight mb-3"
                  style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
                >
                  רוצים להתחיל?
                </h2>
                <p className="text-[#fafafa]/50 text-base leading-[1.85] max-w-xl mb-8">
                  פגישת ייעוץ ראשונית ללא עלות וללא התחייבות. בואו נכיר ונבנה יחד תוכנית מותאמת.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-md px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
                >
                  קבעו פגישה
                </Link>
              </div>
            </ScrollReveal>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Authors;
