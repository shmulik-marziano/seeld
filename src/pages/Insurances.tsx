import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { DISPLAY, LINE, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TINT_GOLD } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// Repeating umbrella line-art — navy ink at low opacity on the gold tint (craft bar)
const UMBRELLA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231D2D3D' stroke-width='2' stroke-linecap='round' opacity='0.14'%3E%3Cpath d='M14 26 C14 17 20 13 28 13 C36 13 42 17 42 26'/%3E%3Cpath d='M14 26 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0'/%3E%3Cpath d='M28 13 v-3'/%3E%3Cpath d='M28 26 v12 c0 4 6 4 6 1'/%3E%3C/g%3E%3C/svg%3E")`;

const insuranceTypes = [
  { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳. השוואה בין כל החברות", href: "/insurance/vehicle" },
  { title: "ביטוח בריאות", description: "כיסוי שמשלים את הסל ולא כופל אותו", href: "/insurance/health" },
  { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה, לפי מה שבאמת צריך", href: "/insurance/life" },
  { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", href: "/insurance/home" },
  { title: "ביטוח שוכרים", description: "כיסוי תכולה ואחריות צד ג׳ לשוכרים", href: "/insurance/renters" },
  { title: "ביטוח עסקי", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק", href: "/insurance/business" },
  { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", href: "/insurance/travel" },
  { title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { title: "אובדן כושר עבודה", description: "תשלום חודשי אם לא תוכלו לעבוד", href: "/insurance/disability" },
  { title: "ביטוח סיעודי", description: "מימון טיפול סיעודי בבית או במוסד", href: "/insurance/nursing" },
  { title: "ביטוח משכנתא", description: "שמירה על הדירה גם במקרה בלתי צפוי", href: "/insurance/mortgage" },
  { title: "מחלות קשות", description: "פיצוי כספי חד־פעמי עם אבחון מחלה", href: "/insurance/critical-illness" },
  { title: "תאונות אישיות", description: "פיצוי על אשפוז, שבר או נכות מתאונה", href: "/insurance/accidents" },
  { title: "ביטוח שותפים", description: "רציפות עסקית במקרה של אובדן שותף", href: "/insurance/partners" },
  { title: "עובדים זרים", description: "ביטוח חובה בהתאם לחוק", href: "/insurance/foreign-workers" },
  { title: "סיעודי כללית", description: "כיסוי סיעודי משלים לחברי כללית", href: "/insurance/nursing-clalit" },
];

const Insurances = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — one idea: pick your coverage */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -90, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 210, height: 210, bottom: -110, right: -70, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>ביטוח</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] items-stretch">
              <div>
                <h1
                  className="dna-display leading-[1.12] mb-6 max-w-3xl"
                  style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
                >
                  ביטוח
                </h1>
                <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
                  16 תחומי ביטוח, מול כל החברות בישראל. בחרו תחום וקבלו את התמונה המלאה.
                </p>
              </div>

              {/* The umbrella tile — brand line-art, the page's craft gesture */}
              <div
                className="hidden lg:block relative rounded-xl overflow-hidden min-h-[160px]"
                style={{ backgroundColor: TINT_GOLD }}
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: UMBRELLA_PATTERN, backgroundSize: "56px 56px" }}
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
                {insuranceTypes.map((item) => (
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
                  <StatusPill>לא בטוחים מה חסר לכם? היועץ מחובר עכשיו</StatusPill>
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
              לא חייבים לבחור לבד
            </h2>
            <p className="text-base leading-[1.85] mb-9 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              נבדוק מה יש לכם, מה כפול ומה חסר. שיחה ראשונה על חשבוננו.
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

export default Insurances;
