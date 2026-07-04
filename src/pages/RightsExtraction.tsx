import { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { BONE, PINE, BRONZE, SERIF, MONO, CHIP_GREEN } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { ProgressRail } from "@/components/brand/Strokes";

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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* HERO — one idea: money you didn't know was yours */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">מיצוי זכויות</span>
            </nav>
            <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              מיצוי זכויות
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            כסף שמגיע לכם. באמת.
          </h1>
          <p className="text-base sm:text-[17px] text-[#171717]/55 max-w-2xl leading-[1.9]">
            החזרי מס, קצבאות וקופות שנשכחו. נבדוק מה מגיע לכם מהמדינה, ונדאג שתקבלו את זה.
          </p>
        </div>
      </section>

      <main>
        {/* 01 — WHAT WE CHECK */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE }}>
                    01
                  </span>
                  <div>
                    <h2
                      className="text-[#171717] leading-tight"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
                    >
                      מה בודקים
                    </h2>
                    <p className="mt-3 text-base text-[#171717]/50 leading-[1.85] max-w-xl">
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
                    <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{right.description}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 02 — HOW IT WORKS (a real sequence) */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE }}>
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
                      style={{ color: BRONZE, fontFamily: MONO }}
                    >
                      {step.number}
                    </span>
                    <h3 className="text-lg text-[#171717] shrink-0 sm:w-44" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-[#171717]/50 leading-[1.8]">{step.description}</p>
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
          </div>
        </section>

        {/* CTA — the one next action */}
        <section style={{ backgroundColor: PINE }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-6">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                נבדוק מה מגיע לכם
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                בדיקת זכאות
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
