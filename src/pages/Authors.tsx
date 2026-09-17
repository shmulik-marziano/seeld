import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, SAGE_ON_GREEN } from "@/lib/brand";

// The agent page: ivory canvas, typography and the kit icons carry it. No
// illustration and no vector element here (dosage, STYLESEED.md).

const specialties: { icon: BrandIconName; title: string; description: string }[] = [
  { icon: "shield", title: "ביטוח כללי", description: "ביטוחי בריאות, חיים, רכב, דירה, עסקי ונסיעות" },
  { icon: "leaf", title: "חיסכון ופנסיה", description: "קרנות פנסיה, קופות גמל, קרנות השתלמות והשקעות" },
  { icon: "heart", title: "ביטוח סיעודי", description: "תכנון כיסוי סיעודי מותאם אישית למבוגרים ומשפחות" },
  { icon: "family", title: "תכנון פיננסי למשפחות", description: "ליווי מקיף לתכנון כלכלי בכל שלבי החיים" },
  { icon: "chart", title: "ביטוח עסקי", description: "פתרונות ביטוח מקיפים לעסקים קטנים וגדולים" },
  { icon: "search", title: "מיצוי זכויות", description: "איתור כספים אבודים והחזרי מס" },
];

const Authors = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* THE AGENT */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>
          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">הסוכן שלכם</span>
            </nav>

            <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
              הסוכן שלכם
            </h1>
            <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] mb-10 sm:mb-14" style={{ color: MUTED }}>
              ליווי אישי ומקצועי בתחומי הפיננסים והביטוח.
            </p>

            {/* Agent card */}
            <ScrollReveal>
              <div className="dna-concept !p-6 sm:!p-8 flex flex-col md:flex-row md:items-start gap-6 sm:gap-8 max-w-4xl">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: PASTEL_SAGE, color: GREEN }}
                  aria-hidden="true"
                >
                  <BrandIcon name="user" size={40} />
                </div>
                <div className="flex-1">
                  <h2 className="leading-tight mb-1.5" style={{ fontSize: "clamp(26px, 3vw, 32px)", color: GREEN }}>
                    שמוליק מרציאנו
                  </h2>
                  <p className="text-[17px] font-bold mb-4" style={{ color: MUTED }}>סוכן ביטוח ופנסיה מוסמך</p>
                  <p className="text-[17px] leading-[1.8] max-w-2xl mb-6" style={{ color: BODY }}>
                    שמוליק מרציאנו הוא סוכן ביטוח ופנסיה מוסמך עם ניסיון עשיר בתחום הפיננסי.
                    מתמחה בבניית תוכניות ביטוח וחיסכון מותאמות אישית, תוך שקיפות מלאה
                    ומחויבות לאינטרס הלקוח. מלווה לקוחות רבים בכל שלבי החיים, מתכנון פנסיוני חכם
                    ועד הגנה ביטוחית מקיפה.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                    <a
                      href="https://wa.me/972523097444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary sm:min-w-[180px]"
                    >
                      <BrandIcon name="message" size={20} />
                      WhatsApp
                    </a>
                    <a href="tel:0523097444" className="btn-secondary">
                      <span dir="ltr" className="tabular-nums whitespace-nowrap">052-309-7444</span>
                    </a>
                    <a href="mailto:shmulik@seeld.co.il" className="btn-secondary">
                      אימייל
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SPECIALTIES */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="mb-10 sm:mb-14">
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  תחומי התמחות
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {specialties.map((spec, index) => (
                <ScrollReveal key={spec.title} delay={index * 60}>
                  <div className="dna-concept h-full" style={{ backgroundColor: IVORY }}>
                    <BrandIcon name={spec.icon} size={32} className="mb-4" style={{ color: GREEN }} />
                    <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>{spec.title}</h3>
                    <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>{spec.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              רוצים להתחיל?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              פגישת ייעוץ ראשונית ללא עלות וללא התחייבות. בואו נכיר ונבנה יחד תוכנית מותאמת.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Authors;
