import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { BODY, DISPLAY, LINE, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TURQ } from "@/lib/brand";
import { FamilyFigure } from "@/components/brand/Figures";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

const Creativity = () => {
  const insuranceTypes = [
    { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳ · השוואה בין כל החברות", features: ["ביטוח חובה", "ביטוח מקיף", "צד ג'", "נזקי גוף"], href: "/insurance/vehicle" },
    { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", features: ["ביטוח מבנה", "ביטוח תכולה", "צד ג'", "נזקי טבע"], href: "/insurance/home" },
    { title: "ביטוח עסק", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק בכל גודל", features: ["אחריות מקצועית", "רכוש עסקי", "הפסד הכנסות", "חבות מעסיקים"], href: "/insurance/business" },
    { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", features: ["הוצאות רפואיות", "ביטול טיסה", "אובדן מזוודות", "חירום 24/7"], href: "/insurance/travel" },
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
        {/* Hero — white canvas, pastel circles; the family peeks from the corner */}
        <section className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 260, height: 260, top: -110, left: -90, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ"
              style={{ width: 200, height: 200, bottom: -100, right: "20%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20">
            <nav aria-label="ניווט משני" className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">/</span>
              <span style={{ color: NAVY }}>ביטוח רכוש ורכב</span>
            </nav>
            <div className="mt-10 sm:mt-14 max-w-3xl">
              <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(34px, 5vw, 50px)" }}>
                ביטוח רכוש ורכב
              </h1>
              <p className="mt-5 text-lg sm:text-xl leading-[1.8] max-w-2xl" style={{ color: MUTED }}>
                רכב, דירה, עסק ונסיעות: השוואת הצעות מחיר מול כל החברות בשוק, ללא עלות.
              </p>
              <div className="mt-8">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg px-9 py-4 bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
                >
                  הצטרפו ל-SEELD
                </Link>
              </div>
            </div>
          </div>
          <FamilyFigure className="absolute left-2 bottom-2 w-16 h-16 opacity-60 rotate-12 pointer-events-none" />
        </section>

        {/* Insurance types — the unified .dna-concept card tiles */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <div className="mb-12 sm:mb-14">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                  תחומי הכיסוי
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insuranceTypes.map((type, i) => (
                <ScrollReveal key={type.title} delay={i * 60} className="h-full">
                  <Link
                    to={type.href}
                    className="dna-concept dna-hover group flex h-full flex-col !p-5 sm:!p-6"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[17px] leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {type.title}
                      </h3>
                      <span className="text-[#5a6a78] group-hover:text-[#1D2D3D] transition-all group-hover:-translate-x-1 shrink-0">←</span>
                    </div>
                    <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: BODY }}>{type.description}</p>
                    <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
                      {type.features.join(" · ")}
                    </p>
                    <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#1D2D3D]">
                      לפרטים
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 border-t border-b py-10 sm:py-14" style={{ borderColor: LINE }}>
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="tabular-nums mb-2"
                      dir={stat.ltr ? "ltr" : undefined}
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 900,
                        color: TURQ,
                        fontSize: "clamp(2rem, 4vw, 3rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[13px] tracking-[0.1em]" style={{ color: MUTED }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-[13px]" style={{ color: MUTED }}>
                למה לבחור ב-SEELD? המספרים עונים.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <div className="max-w-3xl">
                <h2
                  className="text-white leading-tight"
                  style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
                >
                  מוכנים לחסוך על הביטוח?
                </h2>
                <p className="mt-3 text-base leading-[1.85] max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
                  השאירו פרטים ויועץ יחזור אליכם עם הצעות מחיר תוך שעות.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-lg px-9 py-4 bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
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
