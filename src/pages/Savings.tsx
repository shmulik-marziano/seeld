import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { SERIF } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";
import { SproutFigure } from "@/components/brand/Figures";

// SEELD Bento: warm paper panels on ink gutters (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const savingsCategories = [
  { title: "קרנות פנסיה", description: "הפקדות, כיסויים ובחירת מסלול נכונה", href: "/savings/pension-funds" },
  { title: "קופות גמל", description: "חיסכון לטווח ארוך עם הטבות מס", href: "/savings/gemel-funds" },
  { title: "גמל להשקעה", description: "חיסכון נזיל בשוק ההון, ללא נעילה", href: "/savings/gemel-investment" },
  { title: "חיסכון לכל ילד", description: "ניהול כספי התוכנית הממשלתית", href: "/savings/child-savings" },
  { title: "קרנות השתלמות", description: "חיסכון לשש שנים עם פטור ממס", href: "/savings/training-funds" },
  { title: "השקעות", description: "בחירת מסלולים ומעקב תשואות", href: "/savings/investment" },
  { title: "ביטוח חיים פנסיוני", description: "חיסכון עם כיסוי למקרה מוות ונכות", href: "/savings/pension-life-insurance" },
  { title: "קופות מעסיקים", description: "הפקדות לעובדים וציות לחוק", href: "/savings/employer-funds" },
  { title: "טרום פרישה", description: "5–10 שנים לפנסיה? הזמן לסדר הכול", href: "/savings/pre-retirement" },
  { title: "לאחר פרישה", description: "משיכות, קצבאות ותכנון מס", href: "/savings/post-retirement" },
  { title: "תכנון פיננסי", description: "מיפוי מלא של הנכסים ובניית תוכנית", href: "/savings/financial-planning" },
];

const Savings = () => {
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* HERO — one idea: pick your product. The sprout peeks from the tile corner. */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
          <SproutFigure className="absolute -left-5 -bottom-6 w-32 h-32 sm:w-40 sm:h-40 opacity-60 rotate-6" />
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
              <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span>←</span>
                <span className="text-[#171717]/70 font-medium">חיסכון ופנסיה</span>
              </nav>
              <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium" style={{ color: PAPER_MUTED }}>
                11 מוצרי חיסכון
              </span>
            </div>

            <h1
              className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              חיסכון ופנסיה
            </h1>
            <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9]">
              11 מוצרי חיסכון ופנסיה, מקרן הפנסיה הראשונה ועד תכנון הפרישה. בחרו נושא.
            </p>
          </div>
        </div>
      </section>

      <main>
        {/* THE INDEX — hairline link list, one paper tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                {savingsCategories.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10 hover:border-[#171717]/40 transition-colors"
                  >
                    <div className="flex items-baseline gap-4 min-w-0">
                      <h2 className="text-base font-medium text-[#171717] whitespace-nowrap">{item.title}</h2>
                      <p className="text-[13px] text-[#5c5c5c] truncate hidden sm:block">{item.description}</p>
                    </div>
                    <span className="text-[#171717]/30 group-hover:text-[#171717] transition-all group-hover:-translate-x-1 shrink-0">
                      ←
                    </span>
                  </Link>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="mt-12">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                  className="block transition-transform hover:-translate-y-[1px]"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>לא יודעים מה מזה יש לכם? היועץ מחובר עכשיו</StatusPill>
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
                רוצים ניתוח פנסיוני?
              </h2>
              <p className="text-[#fafafa]/55 text-base leading-[1.85] mb-8 max-w-xl">
                נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם. ללא עלות, בלי התחייבות.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                צרו קשר
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Savings;
