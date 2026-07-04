import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MONO, FAINT } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[#171717]/15 pt-5">
    <h2 className="text-lg text-[#171717] mb-3" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
      {title}
    </h2>
    {children}
  </section>
);

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-4">
          <div className="border-t border-[#171717]/20 pt-4">
            <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: FAINT }}>
              LEGAL · עודכן מרץ 2026
            </span>
          </div>
          <h1
            className="mt-10 text-[#171717] leading-tight"
            style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", letterSpacing: "-0.025em" }}
          >
            הצהרת נגישות
          </h1>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 pb-16 sm:pb-24">
        <div className="space-y-10 text-base leading-[1.9] text-[#171717]/60 [&_strong]:text-[#171717] [&_strong]:font-medium">
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
              <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
                <span className="text-[13px] text-[#6e6e6e]">רכז נגישות</span>
                <span className="text-[#171717]">שמוליק מרציאנו</span>
              </div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
                <span className="text-[13px] text-[#6e6e6e]">טלפון</span>
                <a
                  href="tel:0523097444"
                  className="text-[#171717] tabular-nums border-b border-transparent hover:border-[#171717]/40 transition-colors"
                  dir="ltr"
                >
                  052-309-7444
                </a>
              </div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
                <span className="text-[13px] text-[#6e6e6e]">אימייל</span>
                <a
                  href="mailto:info@seeld-ins.co.il"
                  className="text-[#171717] border-b border-transparent hover:border-[#171717]/40 transition-colors"
                  dir="ltr"
                >
                  info@seeld-ins.co.il
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
