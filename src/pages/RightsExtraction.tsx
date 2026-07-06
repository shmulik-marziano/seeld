import { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { SERIF, MONO, CHIP_GREEN } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { FamilyFigure } from "@/components/brand/Figures";
import { ProgressRail } from "@/components/brand/Strokes";

// SEELD Bento: warm paper panels on ink gutters (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const rights = [
  { title: "החזרי מס הכנסה", description: "בדיקת החזרי מס עבור 6 שנים אחורה" },
  { title: "קצבאות ביטוח לאומי", description: "מיצוי זכויות לקצבת נכות, זקנה, ילדים ועוד" },
  { title: "הטבות מס לעצמאים", description: "ניכויים והקלות מס לבעלי עסקים" },
  { title: "זכויות פנסיוניות", description: "איתור קופות אבודות וכספים שלא ידעתם עליהם" },
];

const steps = [
  { number: "01", title: "מלאו פרטים", description: "כמה שאלות קצרות. שתי דקות, לא יותר." },
  { number: "02", title: "נבדוק עבורכם", description: "סריקה של כל הזכויות המגיעות לכם מהמדינה, מביטוח לאומי ומרשויות המס." },
  { number: "03", title: "קבלו דוח", description: "רשימת זכויות מסודרת והמלצות לפעולה. בלי אותיות קטנות." },
];

const RightsExtraction = () => {
  const stepsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
      <Header />

      {/* HERO — bento row: money you didn't know was yours + the family orange tile */}
      <section className="px-2 pt-2">
        <div className="grid gap-2 lg:grid-cols-[1.6fr_1fr] items-stretch">
          <div className="bento-panel"><div className="px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
              <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span>←</span>
                <span className="text-[#171717]/70 font-medium">מיצוי זכויות</span>
              </nav>
              <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: PAPER_MUTED }}>
                מיצוי זכויות
              </span>
            </div>

            <h1
              className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              כסף שמגיע לכם. באמת.
            </h1>
            <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9]">
              החזרי מס, קצבאות וקופות שנשכחו. נבדוק מה מגיע לכם מהמדינה, ונדאג שתקבלו את זה.
            </p>
          </div></div>

          {/* Orange tile — the family in the corner */}
          <div className="bento-panel-orange relative p-6 sm:p-8 flex flex-col justify-between min-h-[200px]">
            <FamilyFigure className="absolute -left-4 -bottom-5 w-32 h-32 sm:w-36 sm:h-36 opacity-70" />
            <span
              className="text-[10px] tracking-[0.2em] font-semibold text-[#171717]/80"
              style={{ fontFamily: MONO }}
              dir="ltr"
            >
              RIGHTS · CHECK
            </span>
            <div className="relative z-10">
              <div className="text-[22px] sm:text-[26px] font-semibold text-[#171717] leading-tight">
                כסף שמגיע לכם
              </div>
              <div className="mt-1.5 text-[13px] font-medium text-[#171717]/80">
                הבדיקה ללא עלות. אם אין, לפחות תדעו.
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* 01 — WHAT WE CHECK */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: PAPER_MUTED }}>
                    01
                  </span>
                  <div>
                    <h2
                      className="text-[#171717] leading-tight"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
                    >
                      מה בודקים
                    </h2>
                    <p className="mt-3 text-base text-[#4d4d4d] leading-[1.85] max-w-xl">
                      ארבעה ערוצים שבהם רוב הישראלים משאירים כסף על השולחן.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="max-w-3xl border-t border-[#171717]/15">
                {rights.map((right) => (
                  <div
                    key={right.title}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-10 py-5 border-b border-[#171717]/10"
                  >
                    <h3 className="text-base font-medium text-[#171717] shrink-0 sm:w-52">{right.title}</h3>
                    <p className="text-[14px] text-[#4d4d4d] leading-[1.8]">{right.description}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div></div>
        </section>

        {/* 02 — HOW IT WORKS (a real sequence) */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: PAPER_MUTED }}>
                    02
                  </span>
                  <h2
                    className="text-[#171717] leading-tight"
                    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
                  >
                    איך זה עובד
                  </h2>
                </div>
              </div>
            </ScrollReveal>

            <div ref={stepsRef} className="max-w-3xl relative pr-5 sm:pr-7">
              {/* The rail fills as you read through the steps */}
              <ProgressRail targetRef={stepsRef} color={CHIP_GREEN} className="right-0" />
              {steps.map((step, i) => (
                <ScrollReveal key={step.number} delay={i * 60}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6 border-b border-[#171717]/10">
                    <span
                      className="text-[12px] tabular-nums tracking-[0.2em] shrink-0 w-8"
                      style={{ color: PAPER_MUTED, fontFamily: MONO }}
                    >
                      {step.number}
                    </span>
                    <h3 className="text-lg text-[#171717] shrink-0 sm:w-44" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-[#4d4d4d] leading-[1.8]">{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={80}>
              <div className="mt-12">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                  className="block transition-transform hover:-translate-y-[1px]"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>היועץ מחובר עכשיו · שאלו אם זה רלוונטי אליכם</StatusPill>
                </button>
              </div>
            </ScrollReveal>
          </div></div>
        </section>

        {/* CTA — the one next action (ink tile) */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-6">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                נבדוק מה מגיע לכם
              </h2>
              <p className="text-[#fafafa]/55 text-base leading-[1.85] mb-8 max-w-xl">
                הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                בדיקת זכאות
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
