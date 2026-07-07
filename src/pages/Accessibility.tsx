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

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* One quiet white column — the whole document */}
      {/* Hero */}
      <section>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-4">
          <h1 className="dna-display leading-tight" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
            הצהרת נגישות
          </h1>
          {/* Metadata under the title — mono, muted */}
          <p className="mt-3 text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
            עודכן מרץ 2026
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-16 sm:pb-24">
        <div className="space-y-10 text-base leading-[1.9] text-[#3a4c5a] [&_strong]:text-[#1D2D3D] [&_strong]:font-medium">
          <LegalSection title="מחויבות לנגישות">
            <p>
              SEELD פיננסים וביטוח מחויבת להנגשת האתר והשירותים הדיגיטליים שלה לכלל האוכלוסייה,
              לרבות אנשים עם מוגבלויות, וזאת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות,
              תשנ"ח-1998, ולתקנות הנגישות שהותקנו מכוחו.
            </p>
          </LegalSection>

          <LegalSection title="תקן הנגישות">
            <p>
              אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
              התשע"ג-2013, ברמת AA לפי תקן WCAG 2.1 של ארגון W3C.
            </p>
          </LegalSection>

          <LegalSection title="התאמות הנגישות באתר">
            <ul className="list-disc pr-6 space-y-2">
              <li>ניווט באמצעות מקלדת בכל חלקי האתר</li>
              <li>תמיכה בקורא מסך (Screen Reader)</li>
              <li>אפשרות להגדלת טקסט</li>
              <li>אפשרות לשינוי ניגודיות צבעים</li>
              <li>תיאור טקסטואלי (alt) לתמונות</li>
              <li>מבנה כותרות היררכי ותקין</li>
              <li>התאמה לצפייה במכשירים ניידים</li>
            </ul>
          </LegalSection>

          <LegalSection title="דרכי פנייה בנושא נגישות">
            <p className="mb-4">
              אם נתקלתם בבעיית נגישות באתר, נשמח לקבל את פנייתכם כדי שנוכל לטפל בנושא:
            </p>
            <div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
                <span className="text-[13px]" style={{ color: MUTED }}>רכז נגישות</span>
                <span style={{ color: NAVY }}>שמוליק מרציאנו</span>
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
            </div>
          </LegalSection>

          <LegalSection title="תוכנות והתקנים נתמכים">
            <p>
              האתר תוכנן לתמוך בדפדפנים הנפוצים (Chrome, Firefox, Safari, Edge) בגרסאותיהם
              העדכניות, ובמכשירים ניידים מבוססי Android ו-iOS.
            </p>
          </LegalSection>

          <LegalSection title="עדכון הצהרת הנגישות">
            <p>
              הצהרה זו עודכנה לאחרונה במרץ 2026. אנו ממשיכים לפעול לשיפור הנגישות באתר
              ועוקבים אחר ההתפתחויות בתחום.
            </p>
          </LegalSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Accessibility;
