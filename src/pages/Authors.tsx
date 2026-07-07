import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, Award, Shield, Heart, Briefcase, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { BODY, DISPLAY, LINE, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TURQ } from "@/lib/brand";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// Outline contact buttons — white with a hairline border
const contactBtnClass =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white border border-[#E7EDF1] text-[#1D2D3D] hover:bg-[#F4F8F7] transition-colors text-sm font-medium min-h-[44px]";

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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* ══════ THE AGENT — white canvas, pastel circles ══════ */}
        <section className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ"
              style={{ width: 200, height: 200, bottom: -110, right: "18%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="mb-12 sm:mb-16">
              <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
                הסוכן שלכם
              </h1>
              <p className="mt-4 text-lg leading-relaxed max-w-3xl" style={{ color: MUTED }}>
                ליווי אישי ומקצועי בתחומי הפיננסים והביטוח
              </p>
            </div>

            {/* Agent card */}
            <ScrollReveal>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div
                  className="w-32 h-32 rounded-full bg-white border flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: LINE }}
                >
                  <span className="text-4xl" style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY }}>שמ</span>
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h2
                    className="mb-1.5"
                    style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
                  >
                    שמוליק מרציאנו
                  </h2>
                  <p className="font-medium text-lg mb-4" style={{ color: MUTED }}>סוכן ביטוח ופנסיה מוסמך</p>
                  <p className="leading-[1.9] max-w-2xl mb-6" style={{ color: BODY }}>
                    שמוליק מרציאנו הוא סוכן ביטוח ופנסיה מוסמך עם ניסיון עשיר בתחום הפיננסי.
                    מתמחה בבניית תוכניות ביטוח וחיסכון מותאמות אישית, תוך שקיפות מלאה
                    ומחויבות לאינטרס הלקוח. מלווה לקוחות רבים בכל שלבי החיים, מתכנון פנסיוני חכם
                    ועד הגנה ביטוחית מקיפה.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <a href="tel:0523097444" className={contactBtnClass}>
                      <Phone className="w-4 h-4" />
                      <span dir="ltr" className="tabular-nums whitespace-nowrap">052-309-7444</span>
                    </a>
                    <a href="mailto:shmulik@seeld.co.il" className={contactBtnClass}>
                      <Mail className="w-4 h-4" />
                      אימייל
                    </a>
                    <a
                      href="https://wa.me/972523097444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1D2D3D] text-white hover:bg-[#16222f] transition-colors text-sm font-medium min-h-[44px]"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════ SPECIALTIES — ruled list ══════ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <ScrollReveal>
              <div className="mb-10 sm:mb-12">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}>
                  תחומי התמחות
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
              {specialties.map((spec, index) => (
                <ScrollReveal key={spec.title} delay={index * 60}>
                  <div className="h-full">
                    <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                    <spec.icon className="w-5 h-5 mb-3" strokeWidth={1.5} style={{ color: NAVY }} />
                    <h3 className="text-[19px] mb-1.5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                      {spec.title}
                    </h3>
                    <p className="text-sm leading-[1.8]" style={{ color: BODY }}>{spec.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA — institutional navy band ══════ */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <ScrollReveal>
              <div className="max-w-3xl">
                <h2
                  className="text-white leading-tight mb-3"
                  style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
                >
                  רוצים להתחיל?
                </h2>
                <p className="text-base leading-[1.85] max-w-xl mb-8" style={{ color: "rgba(255,255,255,.65)" }}>
                  פגישת ייעוץ ראשונית ללא עלות וללא התחייבות. בואו נכיר ונבנה יחד תוכנית מותאמת.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg px-9 py-4 bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
                >
                  קבעו פגישה
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Authors;
