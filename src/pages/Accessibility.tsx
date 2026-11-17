import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";
import { LegalFrame } from "@/components/sd/pubParts";

// Legal page: one quiet reading column, typography only (STYLESEED.md).

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t pt-6" style={{ borderColor: LINE }}>
    <h2 className="mb-3 leading-tight" style={{ fontSize: "clamp(22px, 2.4vw, 26px)", color: GREEN }}>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const Accessibility = () => {
  return (
    <LegalFrame title="הצהרת נגישות" tint="sage" art="11-claims-service">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
          <div className="space-y-10 text-[17px] leading-[1.8] [&_strong]:font-bold [&_strong]:text-[#203957]" style={{ color: BODY }}>
            <LegalSection title="מחויבות לנגישות">
              <p>
                שילד ביטוח ופיננסים מחויבת להנגשת האתר והשירותים הדיגיטליים שלה לכלל האוכלוסייה,
                לרבות אנשים עם מוגבלויות, וזאת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות,
                תשנ״ח-1998, ולתקנות הנגישות שהותקנו מכוחו.
              </p>
            </LegalSection>

            <LegalSection title="תקן הנגישות">
              <p>
                אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
                התשע״ג-2013, ברמת AA לפי תקן WCAG 2.1 של ארגון W3C.
              </p>
            </LegalSection>

            <LegalSection title="התאמות הנגישות באתר">
              <ul>
                {[
                  "ניווט באמצעות מקלדת בכל חלקי האתר",
                  "תמיכה בקורא מסך",
                  "אפשרות להגדלת טקסט",
                  "אפשרות לשינוי ניגודיות צבעים",
                  "תיאור טקסטואלי לתמונות",
                  "מבנה כותרות היררכי ותקין",
                  "התאמה לצפייה במכשירים ניידים",
                ].map((text) => (
                  <li key={text} className="dna-pill-item text-[17px]">
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </LegalSection>

            <LegalSection title="דרכי פנייה בנושא נגישות">
              <p className="mb-4">
                אם נתקלתם בבעיית נגישות באתר, נשמח לקבל את פנייתכם כדי שנוכל לטפל בנושא:
              </p>
              <div className="border-t" style={{ borderColor: LINE }}>
                <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                  <span className="text-[14px]" style={{ color: MUTED }}>רכז נגישות</span>
                  <span className="text-[16px] font-bold" style={{ color: GREEN }}>צוות SEELD</span>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                  <span className="text-[14px]" style={{ color: MUTED }}>טלפון</span>
                  <a
                    href="tel:0523097444"
                    className="inline-flex min-h-[44px] items-center text-[16px] font-bold tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#203957]/40 transition-colors"
                    style={{ color: GREEN }}
                    dir="ltr"
                  >
                    052-309-7444
                  </a>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                  <span className="text-[14px]" style={{ color: MUTED }}>אימייל</span>
                  <a
                    href="mailto:info@seeld.co.il"
                    className="inline-flex min-h-[44px] items-center text-[16px] font-bold border-b border-transparent hover:border-[#203957]/40 transition-colors"
                    style={{ color: GREEN }}
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
                הצהרה זו עודכנה לאחרונה במרץ <span dir="ltr" className="tabular-nums whitespace-nowrap">2026</span>.
                אנו ממשיכים לפעול לשיפור הנגישות באתר ועוקבים אחר ההתפתחויות בתחום.
              </p>
            </LegalSection>
          </div>
        </div>
    </LegalFrame>
  );
};

export default Accessibility;
