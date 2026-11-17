import { CONTACTS, telHref } from "@/lib/contacts";
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

const cookieTypes = [
  {
    title: "עוגיות הכרחיות",
    body: "עוגיות אלו נדרשות לתפקוד בסיסי של האתר, כגון שמירת העדפות נגישות, מצב ערכת הנושא (בהיר/כהה), וניהול מפגשי משתמשים. לא ניתן לבטל עוגיות אלו.",
  },
  {
    title: "עוגיות פונקציונליות",
    body: "עוגיות אלו מאפשרות לאתר לזכור בחירות שביצעתם (כגון שפה או אזור) ולספק תכונות משופרות ומותאמות אישית.",
  },
  {
    title: "עוגיות אנליטיות",
    body: "עוגיות אלו מסייעות לנו להבין כיצד מבקרים משתמשים באתר, אילו דפים הם מבקרים ואילו שגיאות הם נתקלים בהן. מידע זה מסייע לנו לשפר את האתר.",
  },
];

const CookiePolicy = () => {
  return (
    <LegalFrame title="מדיניות עוגיות" tint="butter" art="01-hero">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
          <div className="space-y-10 text-[17px] leading-[1.8] [&_strong]:font-bold [&_strong]:text-[#203957]" style={{ color: BODY }}>
            <LegalSection title="מה הן עוגיות?">
              <p>
                עוגיות (Cookies) הן קבצי טקסט קטנים שנשמרים במכשיר שלכם בעת ביקור באתר.
                הן מאפשרות לאתר לזכור את העדפותיכם ולשפר את חוויית השימוש.
              </p>
            </LegalSection>

            <LegalSection title="סוגי העוגיות שאנו משתמשים בהן">
              <div className="space-y-6 pt-1">
                {cookieTypes.map((c) => (
                  <div key={c.title}>
                    <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                ))}
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
              <div className="border-t" style={{ borderColor: LINE }}>
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
                <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                  <span className="text-[14px]" style={{ color: MUTED }}>טלפון</span>
                  <a
                    href={telHref(CONTACTS.general)}
                    className="inline-flex min-h-[44px] items-center text-[16px] font-bold tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#203957]/40 transition-colors"
                    style={{ color: GREEN }}
                    dir="ltr"
                  >
                    {CONTACTS.general.phone}
                  </a>
                </div>
              </div>
            </LegalSection>
          </div>
        </div>
    </LegalFrame>
  );
};

export default CookiePolicy;
