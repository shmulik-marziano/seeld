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

const CookiePolicy = () => {
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
            מדיניות עוגיות (Cookies)
          </h1>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 pb-16 sm:pb-24">
        <div className="space-y-10 text-base leading-[1.9] text-[#171717]/60 [&_strong]:text-[#171717] [&_strong]:font-medium">
          <LegalSection title="מה הן עוגיות?">
            <p>
              עוגיות (Cookies) הן קבצי טקסט קטנים שנשמרים במכשיר שלכם בעת ביקור באתר.
              הן מאפשרות לאתר לזכור את העדפותיכם ולשפר את חוויית השימוש.
            </p>
          </LegalSection>

          <LegalSection title="סוגי העוגיות שאנו משתמשים בהן">
            <div className="space-y-8 mt-2">
              <div>
                <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                  עוגיות הכרחיות
                </h3>
                <p>
                  עוגיות אלו נדרשות לתפקוד בסיסי של האתר, כגון שמירת העדפות נגישות,
                  מצב ערכת הנושא (בהיר/כהה), וניהול מפגשי משתמשים. לא ניתן לבטל עוגיות אלו.
                </p>
              </div>

              <div>
                <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
                  עוגיות פונקציונליות
                </h3>
                <p>
                  עוגיות אלו מאפשרות לאתר לזכור בחירות שביצעתם (כגון שפה או אזור)
                  ולספק תכונות משופרות ומותאמות אישית.
                </p>
              </div>

              <div>
                <h3 className="text-base text-[#171717] mb-2" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
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
              <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
                <span className="text-[13px] text-[#171717]/45">אימייל</span>
                <a
                  href="mailto:info@seeld-ins.co.il"
                  className="text-[#171717] border-b border-transparent hover:border-[#171717]/40 transition-colors"
                  dir="ltr"
                >
                  info@seeld-ins.co.il
                </a>
              </div>
              <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
                <span className="text-[13px] text-[#171717]/45">טלפון</span>
                <a
                  href="tel:0523097444"
                  className="text-[#171717] tabular-nums border-b border-transparent hover:border-[#171717]/40 transition-colors"
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
