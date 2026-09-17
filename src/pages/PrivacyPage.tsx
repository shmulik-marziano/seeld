import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BODY, GREEN, IVORY, LINE, MUTED } from '@/lib/brand';

// Legal page: one quiet reading column, typography only (STYLESEED.md).

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t pt-6" style={{ borderColor: LINE }}>
    <h2 className="mb-3 leading-tight" style={{ fontSize: "clamp(22px, 2.4vw, 26px)", color: GREEN }}>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const PillList = ({ items }: { items: React.ReactNode[] }) => (
  <ul>
    {items.map((item, i) => (
      <li key={i} className="dna-pill-item text-[17px]">
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function PrivacyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/privacy';

  const content = (
    <div
      className="max-w-3xl mx-auto px-5 sm:px-8 py-8 space-y-10 text-[17px] leading-[1.8] [&_strong]:font-bold [&_strong]:text-[#003D30]"
      style={{ color: BODY }}
    >
      <LegalSection title="1. כללי">
        <p>
          מערכת SEELD (להלן: "המערכת") מופעלת על ידי חברת SEELD בע״מ (להלן: "החברה").
          מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על מידע אישי
          של משתמשי המערכת, לרבות סוכני ביטוח, יועצים פיננסיים ולקוחות קצה.
        </p>
        <p>
          שימוש במערכת מהווה הסכמה למדיניות פרטיות זו. אנו ממליצים לקרוא מסמך זה בעיון.
        </p>
      </LegalSection>

      <LegalSection title="2. המידע שאנו אוספים">
        <p>אנו עשויים לאסוף את סוגי המידע הבאים:</p>
        <PillList
          items={[
            <><strong>2.1 מידע זיהוי אישי:</strong> שם מלא, מספר תעודת זהות, תאריך לידה, כתובת, מספר טלפון, כתובת דואר אלקטרוני.</>,
            <><strong>2.2 מידע פיננסי:</strong> פרטי מוצרי ביטוח ופנסיה, צבירות, דמי ניהול, הפקדות, מספרי פוליסה.</>,
            <><strong>2.3 מידע רפואי:</strong> מצב בריאותי, תרופות, ניתוחים, אשפוזים, מחלות רקע, ככל שנמסר על ידי הלקוח או סוכנו לצורך בחינת כיסוי ביטוחי.</>,
            <><strong>2.4 מידע תעסוקתי:</strong> מעמד תעסוקתי, מקצוע, הכנסה חודשית ושנתית.</>,
            <><strong>2.5 מידע טכני:</strong> כתובת IP, סוג דפדפן, זמני גישה ופעילות במערכת.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. מטרות השימוש במידע">
        <p>המידע נאסף ומעובד למטרות הבאות:</p>
        <PillList
          items={[
            "ניהול תיקי לקוחות על ידי סוכני ביטוח ויועצים פיננסיים מורשים.",
            "הפקת המלצות ביטוחיות ופנסיוניות מותאמות אישית.",
            "יצירת סיכומי ביצועים ומסמכי המלצה דיגיטליים.",
            "שליחת קישורים לפורטל לקוח מאובטח לצפייה ואישור המלצות.",
            "ניהול מעקב ופולו-אפ על החלטות לקוחות.",
            "שיפור המערכת וחוויית המשתמש.",
            "עמידה בדרישות רגולטוריות.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. שיתוף מידע">
        <p>
          אנו לא מוכרים, משכירים או מסחרים במידע האישי שלך. המידע עשוי להיות משותף אך ורק:
        </p>
        <PillList
          items={[
            <><strong>עם הסוכן/יועץ שלך:</strong> הסוכן או היועץ הפיננסי שהזין את המידע ומנהל את התיק שלך.</>,
            <><strong>עם סוכנים נוספים באותה סוכנות:</strong> במידה ומדובר בסוכנות עם מספר סוכנים, המידע עשוי להיות נגיש לסוכנים נוספים בסוכנות לצורך המשכיות שירות.</>,
            <><strong>עם ספקי שירות:</strong> ספקי תשתית טכנולוגית (אחסון, אבטחה) שפועלים בשמנו ובכפוף להתחייבויות סודיות.</>,
            <><strong>על פי דין:</strong> כאשר נדרש על פי צו בית משפט או דרישה רגולטורית.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. אבטחת מידע">
        <p>אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך, לרבות:</p>
        <PillList
          items={[
            "הצפנת נתונים בתעבורה (TLS/SSL) ובמנוחה.",
            "בקרת גישה מבוססת תפקידים (RBAC). כל סוכנות רואה רק את הנתונים שלה.",
            "מדיניות Row-Level Security (RLS) ברמת בסיס הנתונים.",
            "אימות דו-שלבי וניהול הרשאות קפדני.",
            "גיבויים שוטפים ומנגנוני שחזור.",
            "קישורי פורטל לקוח עם תפוגה מוגדרת ואימות זהות באמצעות תעודת זהות.",
          ]}
        />
        <p>
          יחד עם זאת, אף מערכת אינה חסינה לחלוטין ואנו לא יכולים להבטיח אבטחה מוחלטת של המידע.
        </p>
      </LegalSection>

      <LegalSection title="6. שמירת מידע">
        <p>
          המידע נשמר כל עוד חשבון הסוכנות פעיל וכל עוד הדבר נדרש לצורך מתן השירות
          או לעמידה בדרישות רגולטוריות. בהתאם לרגולציה בתחום הביטוח והפנסיה,
          חלק מהמידע עשוי להישמר לתקופות ארוכות כנדרש בחוק.
        </p>
      </LegalSection>

      <LegalSection title="7. זכויות הלקוח">
        <p>בהתאם לחוק הגנת הפרטיות, התשמ״א-1981, עומדות לך הזכויות הבאות:</p>
        <PillList
          items={[
            <><strong>זכות עיון:</strong> הזכות לעיין במידע שנאסף עליך.</>,
            <><strong>זכות תיקון:</strong> הזכות לבקש תיקון מידע שגוי.</>,
            <><strong>זכות מחיקה:</strong> הזכות לבקש מחיקת מידע, בכפוף למגבלות חוקיות ורגולטוריות.</>,
            <><strong>זכות התנגדות:</strong> הזכות להתנגד לעיבוד מידע לצרכים מסוימים.</>,
          ]}
        />
        <p>
          לבקשות בנושא פרטיות, ניתן לפנות לסוכן הביטוח שלך או ישירות אלינו בכתובת המופיעה בסעיף 10.
        </p>
      </LegalSection>

      <LegalSection title="8. עוגיות (Cookies)">
        <p>
          המערכת משתמשת בעוגיות הכרחיות בלבד לצורך שמירת מצב ההתחברות ואבטחת הגישה.
          אנו לא משתמשים בעוגיות שיווקיות או למעקב צד שלישי.
        </p>
      </LegalSection>

      <LegalSection title="9. שינויים במדיניות">
        <p>
          אנו שומרים לעצמנו את הזכות לעדכן מדיניות פרטיות זו מעת לעת.
          שינויים מהותיים יפורסמו במערכת. המשך השימוש לאחר פרסום שינויים
          מהווה הסכמה למדיניות המעודכנת.
        </p>
      </LegalSection>

      <LegalSection title="10. יצירת קשר">
        <p>
          לשאלות בנוגע למדיניות פרטיות זו או לבקשות הנוגעות למידע האישי שלך,
          ניתן לפנות אלינו:
        </p>
        <div className="border-t" style={{ borderColor: LINE }}>
          <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
            <span className="text-[14px]" style={{ color: MUTED }}>חברה</span>
            <span className="text-[16px] font-bold" style={{ color: GREEN }}>SEELD בע״מ</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
            <span className="text-[14px]" style={{ color: MUTED }}>דואר אלקטרוני</span>
            <a
              href="mailto:info@seeld.co.il"
              className="text-[16px] font-bold border-b border-transparent hover:border-[#003D30]/40 transition-colors"
              style={{ color: GREEN }}
              dir="ltr"
            >
              info@seeld.co.il
            </a>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
            <span className="text-[14px]" style={{ color: MUTED }}>אתר</span>
            <span className="text-[16px] font-bold" style={{ color: GREEN }} dir="ltr">seeld.co.il</span>
          </div>
        </div>
      </LegalSection>

      <p className="border-t pt-5 text-[14px] leading-relaxed" style={{ color: MUTED, borderColor: LINE }}>
        &copy; <span dir="ltr" className="tabular-nums">{new Date().getFullYear()}</span> שילד ביטוח ופיננסים. כל הזכויות שמורות.
      </p>
    </div>
  );

  if (!isPublic) {
    return <div dir="rtl">{content}</div>;
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main className="pb-10 sm:pb-16">
        <section>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-6">
            <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
              מדיניות פרטיות
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[14px]" style={{ color: MUTED }}>
                עודכן במרץ <span dir="ltr" className="tabular-nums whitespace-nowrap">2026</span>
              </span>
              <button type="button" onClick={() => navigate(-1)} className="link-rule text-[15px]">
                חזרה
              </button>
            </div>
          </div>
        </section>

        {content}
      </main>

      <Footer />
    </div>
  );
}
