import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { BubbleCorner } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN } from "@/lib/brand";

// Property, vehicle, business and travel cover stay illustration-free (kit p.11):
// the corner bubbles in the hero margin, four doors, and the central path.

// Figures inside coverage copy (24/7 and the like) render tabular and LTR-safe.
const FIGURE_RE = /\d(?:[\d,.:/\-–]*\d)?/g;

const FigureText = ({ text }: { text: string }) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE_RE)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    nodes.push(
      <span key={i} dir="ltr" className="tabular-nums whitespace-nowrap">
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last === 0) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
};

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const Creativity = () => {
  const insuranceTypes = [
    { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳. השוואה בין כל החברות", features: ["ביטוח חובה", "ביטוח מקיף", "צד ג'", "נזקי גוף"], href: "/insurance/vehicle" },
    { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", features: ["ביטוח מבנה", "ביטוח תכולה", "צד ג'", "נזקי טבע"], href: "/insurance/home" },
    { title: "ביטוח עסק", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק בכל גודל", features: ["אחריות מקצועית", "רכוש עסקי", "הפסד הכנסות", "חבות מעסיקים"], href: "/insurance/business" },
    { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", features: ["הוצאות רפואיות", "ביטול טיסה", "אובדן מזוודות", "חירום 24/7"], href: "/insurance/travel" },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — ivory canvas, the corner bubbles in the margin */}
        <section className="dna-page overflow-hidden">
          <BubbleCorner className="hidden lg:block absolute -top-28 -left-28 w-[380px] opacity-70" flip />
          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
            <nav aria-label="ניווט משני" className="mb-8 sm:mb-12 flex items-center gap-2 text-[14px]" style={{ color: MUTED }}>
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">ביטוח רכוש ורכב</span>
            </nav>
            <div className="max-w-3xl">
              <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                ביטוח רכוש ורכב
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] leading-[1.7] max-w-2xl" style={{ color: MUTED }}>
                רכב, דירה, עסק ונסיעות: השוואת הצעות מחיר מול כל החברות בשוק, ללא עלות.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Link to="/contact" className="btn-primary sm:min-w-[220px]">
                  תיאום פגישה
                </Link>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <button type="button" className="mt-6 link-rule text-[15px]" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </section>

        {/* Insurance types — white card tiles, whole-tile links */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="mb-10 sm:mb-12">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  תחומי הכיסוי
                </h2>
                <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>
                  ארבעה תחומים, לכל אחד עמוד משלו עם הכיסויים, המדריך וטופס להצעה.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {insuranceTypes.map((type, i) => (
                <ScrollReveal key={type.title} delay={i * 60} className="h-full">
                  <Link
                    to={type.href}
                    className="group dna-concept dna-hover flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                    style={{ borderColor: LINE }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[20px] leading-snug" style={{ color: GREEN }}>{type.title}</h3>
                      <BrandIcon
                        name="arrow-left"
                        size={18}
                        className="shrink-0 mt-1.5 transition-transform group-hover:-translate-x-1"
                        style={{ color: GREEN }}
                      />
                    </div>
                    <p className="mt-2 text-[16px] leading-[1.7]" style={{ color: BODY }}>{type.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[14px]" style={{ color: MUTED }}>
                      {type.features.map((feature) => (
                        <li key={feature} className="dna-pill-item !py-0 !gap-2 text-[14px] !text-[#476356]">
                          <FigureText text={feature} />
                        </li>
                      ))}
                    </ul>
                    <span className="link-rule mt-auto pt-5 text-[15px] self-start">
                      לפרטי הביטוח
                      <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* How we compare */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="mb-8">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  איך משווים
                </h2>
              </div>
              <div className="max-w-3xl space-y-5 text-[17px] leading-[1.8]" style={{ color: BODY }}>
                <p>
                  משאירים פרטים בעמוד הביטוח המתאים, ואנחנו אוספים הצעות מכל חברות הביטוח שעובדות איתנו.
                  ההשוואה מתייחסת לכיסוי, להשתתפות העצמית ולחריגים, לא רק למחיר.
                </p>
                <p>
                  חוזרים אליכם עם המלצה מנומקת ומתועדת, ומטפלים בטפסים ובמעבר בין החברות. ללא עלות וללא התחייבות.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CLOSING — deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                רוצים להשוות הצעות מחיר?
              </h2>
              <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                השאירו פרטים ויועץ מהצוות יחזור אליכם עם הצעות להשוואה. אפשר גם לבדוק את כל התיק בבת אחת.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                  בדיקת תיק 360
                </Link>
                <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                  תיאום פגישה
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

export default Creativity;
