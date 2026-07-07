import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DISPLAY, MONO, MUTED, NAVY } from '@/lib/brand';

// SEELD DNA v3: one quiet white column, navy headings, hairline rules (STYLESEED.md)

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[#E7EDF1] pt-5 space-y-3">
    <h2 className="text-[19px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
      {title}
    </h2>
    {children}
  </section>
);

export default function PrivacyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/privacy';

  const content = (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10 text-base leading-[1.9] text-[#3a4c5a] [&_strong]:text-[#1D2D3D] [&_strong]:font-medium">
      <LegalSection title="1. כללי">
        <p>
          מערכת SEELD (להלן: "המערכת") מופעלת על ידי חברת SEELD בע"מ (להלן: "החברה").
          מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על מידע אישי
          של משתמשי המערכת, לרבות סוכני ביטוח, יועצים פיננסיים ולקוחות קצה.
        </p>
        <p>
          שימוש במערכת מהווה הסכמה למדיניות פרטיות זו. אנו ממליצים לקרוא מסמך זה בעיון.
        </p>
      </LegalSection>

      <LegalSection title="2. המידע שאנו אוספים">
        <p>אנו עשויים לאסוף את סוגי המידע הבאים:</p>
        <div className="space-y-2 pr-4">
          <p><strong>2.1 מידע זיהוי אישי:</strong> שם מלא, מספר תעודת זהות, תאריך לידה, כתובת, מספר טלפון, כתובת דואר אלקטרוני.</p>
          <p><strong>2.2 מידע פיננסי:</strong> פרטי מוצרי ביטוח ופנסיה, צבירות, דמי ניהול, הפקדות, מספרי פוליסה.</p>
          <p><strong>2.3 מידע רפואי:</strong> מצב בריאותי, תרופות, ניתוחים, אשפוזים, מחלות רקע — ככל שנמסר על ידי הלקוח או סוכנו לצורך בחינת כיסוי ביטוחי.</p>
          <p><strong>2.4 מידע תעסוקתי:</strong> מעמד תעסוקתי, מקצוע, הכנסה חודשית ושנתית.</p>
          <p><strong>2.5 מידע טכני:</strong> כתובת IP, סוג דפדפן, זמני גישה ופעילות במערכת.</p>
        </div>
      </LegalSection>

      <LegalSection title="3. מטרות השימוש במידע">
        <p>המידע נאסף ומעובד למטרות הבאות:</p>
        <ul className="list-disc pr-6 space-y-1.5">
          <li>ניהול תיקי לקוחות על ידי סוכני ביטוח ויועצים פיננסיים מורשים.</li>
          <li>הפקת המלצות ביטוחיות ופנסיוניות מותאמות אישית.</li>
          <li>יצירת סיכומי ביצועים ומסמכי המלצה דיגיטליים.</li>
          <li>שליחת קישורים לפורטל לקוח מאובטח לצפייה ואישור המלצות.</li>
          <li>ניהול מעקב ופולו-אפ על החלטות לקוחות.</li>
          <li>שיפור המערכת וחוויית המשתמש.</li>
          <li>עמידה בדרישות רגולטוריות.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. שיתוף מידע">
        <p>
          אנו לא מוכרים, משכירים או מסחרים במידע האישי שלך. המידע עשוי להיות משותף אך ורק:
        </p>
        <ul className="list-disc pr-6 space-y-1.5">
          <li><strong>עם הסוכן/יועץ שלך:</strong> הסוכן או היועץ הפיננסי שהזין את המידע ומנהל את התיק שלך.</li>
          <li><strong>עם סוכנים נוספים באותה סוכנות:</strong> במידה ומדובר בסוכנות עם מספר סוכנים, המידע עשוי להיות נגיש לסוכנים נוספים בסוכנות לצורך המשכיות שירות.</li>
          <li><strong>עם ספקי שירות:</strong> ספקי תשתית טכנולוגית (אחסון, אבטחה) שפועלים בשמנו ובכפוף להתחייבויות סודיות.</li>
          <li><strong>על פי דין:</strong> כאשר נדרש על פי צו בית משפט או דרישה רגולטורית.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. אבטחת מידע">
        <p>אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך, לרבות:</p>
        <ul className="list-disc pr-6 space-y-1.5">
          <li>הצפנת נתונים בתעבורה (TLS/SSL) ובמנוחה.</li>
          <li>בקרת גישה מבוססת תפקידים (RBAC) — כל סוכנות רואה רק את הנתונים שלה.</li>
          <li>מדיניות Row-Level Security (RLS) ברמת בסיס הנתונים.</li>
          <li>אימות דו-שלבי וניהול הרשאות קפדני.</li>
          <li>גיבויים שוטפים ומנגנוני שחזור.</li>
          <li>קישורי פורטל לקוח עם תפוגה מוגדרת ואימות זהות באמצעות תעודת זהות.</li>
        </ul>
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
        <p>בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדות לך הזכויות הבאות:</p>
        <ul className="list-disc pr-6 space-y-1.5">
          <li><strong>זכות עיון:</strong> הזכות לעיין במידע שנאסף עליך.</li>
          <li><strong>זכות תיקון:</strong> הזכות לבקש תיקון מידע שגוי.</li>
          <li><strong>זכות מחיקה:</strong> הזכות לבקש מחיקת מידע, בכפוף למגבלות חוקיות ורגולטוריות.</li>
          <li><strong>זכות התנגדות:</strong> הזכות להתנגד לעיבוד מידע לצרכים מסוימים.</li>
        </ul>
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
        <div>
          <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
            <span className="text-[13px]" style={{ color: MUTED }}>חברה</span>
            <span style={{ color: NAVY }}>SEELD בע"מ</span>
          </div>
          <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
            <span className="text-[13px]" style={{ color: MUTED }}>דואר אלקטרוני</span>
            <a
              href="mailto:info@seeld.co.il"
              className="text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
              dir="ltr"
            >
              info@seeld.co.il
            </a>
          </div>
          <div className="flex items-baseline justify-between py-3 border-b border-[#E7EDF1]">
            <span className="text-[13px]" style={{ color: MUTED }}>אתר</span>
            <span style={{ color: NAVY }} dir="ltr">seeld.co.il</span>
          </div>
        </div>
      </LegalSection>

      <p className="border-t border-[#E7EDF1] pt-5 text-[12px] leading-relaxed" style={{ color: MUTED }}>
        &copy; {new Date().getFullYear()} SEELD — כל הזכויות שמורות.
      </p>
    </div>
  );

  if (!isPublic) {
    return <div dir="rtl">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* One quiet white column — the whole document */}
      <main className="pb-6">
        {/* Hero */}
        <section>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-4">
            <h1 className="dna-display leading-tight" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
              מדיניות פרטיות
            </h1>
            {/* Metadata under the title — mono, muted */}
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
                עודכן מרץ 2026
              </span>
              <button
                onClick={() => navigate(-1)}
                className="text-[13px] font-medium hover:text-[#1D2D3D] transition-colors"
                style={{ color: MUTED }}
              >
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
