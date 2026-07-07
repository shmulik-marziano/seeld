import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DISPLAY, MONO, MUTED, NAVY } from "@/lib/brand";

// SEELD DNA v3: one quiet white column, navy headings, hairline rules (STYLESEED.md)

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[#E7EDF1] pt-5">
    <h2 className="text-[19px] mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
      {title}
    </h2>
    {children}
  </section>
);

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* One quiet white column — the whole document */}
      {/* Hero */}
      <section>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-4">
          <h1 className="dna-display leading-tight" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
            מדיניות עוגיות (Cookies)
          </h1>
          {/* Metadata under the title — mono, muted */}
          <p className="mt-3 text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
            עודכן מרץ 2026
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-16 sm:pb-24">
        <div className="space-y-10 text-base leading-[1.9] text-[#3a4c5a] [&_strong]:text-[#1D2D3D] [&_strong]:font-medium">
          <LegalSection title="מה הן עוגיות?">
            <p>
              עוגיות (Cookies) הן קבצי טקסט קטנים שנשמרים במכשיר שלכם בעת ביקור באתר.
              הן מאפשרות לאתר לזכור את העדפותיכם ולשפר את חוויית השימוש.
            </p>
          </LegalSection>

          <LegalSection title="סוגי העוגיות שאנו משתמשים בהן">
            <div className="space-y-8 mt-2">
              <div>
                <h3 className="text-base mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                  עוגיות הכרחיות
                </h3>
                <p>
                  עוגיות אלו נדרשות לתפקוד בסיסי של האתר, כגון שמירת העדפות נגישות,
                  מצב ערכת הנושא (בהיר/כהה), וניהול מפגשי משתמשים. לא ניתן לבטל עוגיות אלו.
                </p>
              </div>

              <div>
                <h3 className="text-base mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                  עוגיות פונקציונליות
                </h3>
                <p>
                  עוגיות אלו מאפשרות לאתר לזכור בחירות שביצעתם (כגון שפה או אזור)
                  ולספק תכונות משופרות ומותאמות אישית.
                </p>
              </div>

              <div>
                <h3 className="text-base mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                  עוגיות אנליטיות
                </h3>
                <p>
                  עוגיות אלו מסייעות לנו להבין כיצד מבקרים משתמשים באתר, אילו דפים
                  הם מבקרים ואילו שגיאות הם נתקלים בהן. מידע זה מסייע לנו לשפר את האתר.
                </p>
              </div>
            </div>
          </LegalSection>

          <LegalSection title="ניהול עוגיות">
            <p>
              באפשרותכם לשלוט בעוגיות ולמחוק אותן דרך הגדרות הדפדפן שלכם.
              שימו לב שביטול עוגיות עלול לפגוע בחוויית השימוש באתר ובחלק מהתכונות שלו.
            </p>
          </LegalSection>

          <LegalSection title="עוגיות צד שלישי">
            <p>
              ייתכן שחלק מהעוגיות באתר מוגדרות על ידי שירותי צד שלישי המופיעים בדפים שלנו,
              כגון שירותי אנליטיקה. לא ניתן לנו לשלוט בעוגיות אלו ומומלץ לעיין
              במדיניות הפרטיות של אותם שירותים.
            </p>
          </LegalSection>

          <LegalSection title="יצירת קשר">
            <p className="mb-4">לשאלות בנוגע למדיניות העוגיות, ניתן לפנות אלינו:</p>
            <div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
                <span className="text-[13px]" style={{ color: MUTED }}>אימייל</span>
                <a
                  href="mailto:info@seeld.co.il"
                  className="text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                  dir="ltr"
                >
                  info@seeld.co.il
                </a>
              </div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
                <span className="text-[13px]" style={{ color: MUTED }}>טלפון</span>
                <a
                  href="tel:0523097444"
                  className="text-[#1D2D3D] tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                  dir="ltr"
                >
                  052-309-7444
                </a>
              </div>
            </div>
          </LegalSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
