import { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import {
  BODY, DISPLAY, LINE, MUTED, NAVY, PASTEL_BLUE, PASTEL_PEACH, TURQ,
} from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { ProgressRail } from "@/components/brand/Strokes";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

const rights = [
  { title: "החזרי מס הכנסה", description: "בדיקת החזרי מס עבור 6 שנים אחורה" },
  { title: "קצבאות ביטוח לאומי", description: "מיצוי זכויות לקצבת נכות, זקנה, ילדים ועוד" },
  { title: "הטבות מס לעצמאים", description: "ניכויים והקלות מס לבעלי עסקים" },
  { title: "זכויות פנסיוניות", description: "איתור קופות אבודות וכספים שלא ידעתם עליהם" },
];

// Plain-word steps — no ornamental numerals (STYLESEED ban 2)
const steps = [
  { title: "מלאו פרטים", description: "כמה שאלות קצרות. שתי דקות, לא יותר." },
  { title: "נבדוק עבורכם", description: "סריקה של כל הזכויות המגיעות לכם מהמדינה, מביטוח לאומי ומרשויות המס." },
  { title: "קבלו דוח", description: "רשימת זכויות מסודרת והמלצות לפעולה. בלי אותיות קטנות." },
];

// The heading starts its block — no eyebrow, no index (STYLESEED bans).
const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-12 sm:mb-16">
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)" }}>
      {title}
    </h2>
    {lede && (
      <p className="mt-4 text-base leading-[1.85] max-w-xl" style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

const RightsExtraction = () => {
  const stepsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — money you didn't know was yours */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -90, backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 210, height: 210, bottom: -110, right: -70, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>מיצוי זכויות</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] items-start">
              <div>
                <h1
                  className="dna-display leading-[1.12] mb-6 max-w-3xl"
                  style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
                >
                  כסף שמגיע לכם. באמת.
                </h1>
                <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
                  החזרי מס, קצבאות וקופות שנשכחו. נבדוק מה מגיע לכם מהמדינה, ונדאג שתקבלו את זה.
                </p>
              </div>

              <div className="dna-quote gold">
                <div className="dna-ql">בדיקת זכאות</div>
                <div className="dna-qt">
                  הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE CHECK */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="מה בודקים"
                lede="ארבעה ערוצים שבהם רוב הישראלים משאירים כסף על השולחן."
              />
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="max-w-3xl border-t" style={{ borderColor: LINE }}>
                {rights.map((right) => (
                  <div key={right.title} className="dna-pill-item !py-5 border-b" style={{ borderColor: LINE }}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-10 w-full">
                      <h3 className="text-base font-medium shrink-0 sm:w-52" style={{ color: NAVY }}>{right.title}</h3>
                      <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{right.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* HOW IT WORKS — a real sequence, plain-word steps */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="איך זה עובד" />
            </ScrollReveal>

            <div ref={stepsRef} className="max-w-3xl relative pr-5 sm:pr-7">
              {/* The rail fills as you read through the steps */}
              <ProgressRail targetRef={stepsRef} color={TURQ} className="right-0" />
              {steps.map((step, i) => (
                <ScrollReveal key={step.title} delay={i * 60}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6 border-b" style={{ borderColor: LINE }}>
                    <h3
                      className="text-[19px] shrink-0 sm:w-44"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={80}>
              <div className="mt-12">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                  className="block dna-hover rounded-full"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>היועץ מחובר עכשיו · שאלו אם זה רלוונטי אליכם</StatusPill>
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <h2
              className="text-white leading-tight mb-3"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)",
                letterSpacing: "-0.5px",
              }}
            >
              נבדוק מה מגיע לכם
            </h2>
            <p className="text-base leading-[1.85] mb-9 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
            >
              בדיקת זכאות
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
