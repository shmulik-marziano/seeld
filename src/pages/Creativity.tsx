import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { MONO, FAINT } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

const Creativity = () => {
  const insuranceTypes = [
    { title: "ביטוח רכב", description: "ביטוח חובה, מקיף וצד ג' - כל מה שהרכב שלך צריך", features: ["ביטוח חובה", "ביטוח מקיף", "צד ג'", "נזקי גוף"], href: "/insurance/vehicle" },
    { title: "ביטוח דירה", description: "הגנה מלאה על הבית והתכולה מפני כל סיכון", features: ["ביטוח מבנה", "ביטוח תכולה", "צד ג'", "נזקי טבע"], href: "/insurance/home" },
    { title: "ביטוח עסק", description: "פתרונות ביטוח מקיפים לעסק בכל גודל", features: ["אחריות מקצועית", "רכוש עסקי", "הפסד הכנסות", "חבות מעסיקים"], href: "/insurance/business" },
    { title: "ביטוח נסיעות", description: "נסיעה לחו\"ל בראש שקט עם כיסוי מלא", features: ["הוצאות רפואיות", "ביטול טיסה", "אובדן מזוודות", "חירום 24/7"], href: "/insurance/travel" },
  ];

  const stats = [
    { value: "מגוון", label: "חברות ביטוח להשוואה", ltr: false },
    { value: "30%", label: "חיסכון ממוצע ללקוחות", ltr: true },
    { value: "24/7", label: "שירות ותמיכה", ltr: true },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-14 sm:pb-20">
            <div className="border-t border-[#171717]/20 pt-4">
              <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px] text-[#171717]/45">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span aria-hidden="true">/</span>
                <span className="text-[#171717]">ביטוח רכוש ורכב</span>
              </nav>
            </div>
            <div className="mt-12 sm:mt-16 max-w-3xl">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: FAINT }}>
                PROPERTY · VEHICLE
              </span>
              <h1
                className="mt-4 text-[#171717] leading-[1.1]"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", letterSpacing: "-0.03em" }}
              >
                ביטוח רכוש ורכב
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-[#171717]/60 leading-[1.8] max-w-2xl">
                הגנו על הנכסים החשובים לכם עם פוליסות ביטוח מותאמות אישית.
                השוו הצעות מחיר מחברות הביטוח המובילות וחסכו אלפי שקלים בשנה.
              </p>
              <div className="mt-8">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#262626] transition-colors min-h-[52px]"
                >
                  להצטרפות ל-SEELD
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 01 — Insurance types, ruled list */}
        <section style={{ backgroundColor: "#fafafa" }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-12 sm:mb-14 flex items-baseline gap-6 sm:gap-10">
                <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: FAINT, fontFamily: MONO }}>
                  01
                </span>
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
                >
                  תחומי הכיסוי
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14">
              {insuranceTypes.map((type, i) => (
                <ScrollReveal key={type.title} delay={i * 60}>
                  <Link to={type.href} className="group block border-t border-[#171717]/15 hover:border-[#171717]/40 transition-colors pt-5 pb-8">
                    <div className="flex items-baseline justify-between gap-4 mb-2.5">
                      <h3 className="text-lg text-[#171717]" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                        {type.title}
                      </h3>
                      <span className="text-[#171717]/30 group-hover:text-[#171717] transition-all group-hover:-translate-x-1" aria-hidden="true">←</span>
                    </div>
                    <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{type.description}</p>
                    <p className="mt-3 text-[13px] text-[#171717]/40">
                      {type.features.join(" · ")}
                    </p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 border-t border-b border-[#171717]/15 py-10 sm:py-14">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="text-[#171717] tabular-nums mb-2"
                      dir={stat.ltr ? "ltr" : undefined}
                      style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[12px] tracking-[0.12em] text-[#171717]/45">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-[12px] text-[#171717]/35">
                למה לבחור ב-SEELD? המספרים עונים.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA — the one dark band */}
        <section style={{ backgroundColor: "#171717" }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <div className="border-t border-white/20 pt-6 max-w-3xl">
                <h2
                  className="text-[#fafafa] leading-tight"
                  style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}
                >
                  מוכנים לחסוך על הביטוח?
                </h2>
                <p className="mt-3 text-base text-[#fafafa]/50 leading-[1.85] max-w-xl">
                  מלאו את הפרטים ונציג יחזור אליכם עם הצעות מחיר מותאמות אישית תוך שעות.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
                  >
                    התחילו עכשיו
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creativity;
