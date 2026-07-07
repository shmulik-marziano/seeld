import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { DISPLAY, LINE, MUTED, NAVY, PASTEL_MINT, PASTEL_PEACH, TINT_TURQ } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// Repeating coin-and-growth line-art — navy ink at low opacity on the turquoise tint (craft bar)
const GROWTH_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231D2D3D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.14'%3E%3Ccircle cx='16' cy='38' r='7'/%3E%3Cpath d='M16 34.5 v7 M13.5 36 c0 -1 5 -1 5 0.8 c0 1.8 -5 1.5 -5 3 c0 1.5 5 1.5 5 0.5'/%3E%3Cpath d='M30 40 C34 32 38 22 46 16'/%3E%3Cpath d='M41 16 L46 16 L46 21'/%3E%3C/g%3E%3C/svg%3E")`;

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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — one idea: pick your product */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -90, backgroundColor: PASTEL_MINT, opacity: 0.5 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 210, height: 210, bottom: -110, right: -70, backgroundColor: PASTEL_PEACH, opacity: 0.5 }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>חיסכון ופנסיה</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] items-stretch">
              <div>
                <h1
                  className="dna-display leading-[1.12] mb-6 max-w-3xl"
                  style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
                >
                  חיסכון ופנסיה
                </h1>
                <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
                  11 מוצרי חיסכון ופנסיה, מקרן הפנסיה הראשונה ועד תכנון הפרישה. בחרו נושא.
                </p>
              </div>

              {/* The growth tile — brand line-art, the page's craft gesture */}
              <div
                className="hidden lg:block relative rounded-xl overflow-hidden min-h-[160px]"
                style={{ backgroundColor: TINT_TURQ }}
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: GROWTH_PATTERN, backgroundSize: "56px 56px" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* THE INDEX — hairline link list */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                {savingsCategories.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-baseline justify-between gap-6 py-[14px] px-3 -mx-3 rounded-md border-b border-[#E7EDF1] hover:bg-[#E1EAF1]/35 transition-colors"
                  >
                    <div className="flex items-baseline gap-4 min-w-0">
                      <h2 className="text-base font-medium text-[#1D2D3D] whitespace-nowrap">{item.title}</h2>
                      <p className="text-[13px] text-[#5a6a78] truncate hidden sm:block">{item.description}</p>
                    </div>
                    <span className="text-[#5a6a78] group-hover:text-[#1D2D3D] transition-all group-hover:-translate-x-1 shrink-0">
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
                  className="block dna-hover rounded-full"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>לא יודעים מה מזה יש לכם? היועץ מחובר עכשיו</StatusPill>
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
              רוצים ניתוח פנסיוני?
            </h2>
            <p className="text-base leading-[1.85] mb-9 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם. ללא עלות, בלי התחייבות.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
            >
              צרו קשר
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Savings;
