import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MONO } from '@/lib/brand';

const HEEBO = "'Heebo', sans-serif";

// SEELD Bento: one quiet warm paper tile — documents stay serious (STYLESEED.md)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[#171717]/15 pt-5 space-y-3">
    <h2 className="text-lg text-[#171717]" style={{ fontFamily: HEEBO, fontWeight: 600 }}>
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
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-10 text-base leading-[1.9] text-[#4d4d4d] [&_strong]:text-[#171717] [&_strong]:font-medium">
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
          <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
            <span className="text-[13px] text-[#5c5c5c]">חברה</span>
            <span className="text-[#171717]">SEELD בע"מ</span>
          </div>
          <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
            <span className="text-[13px] text-[#5c5c5c]">דואר אלקטרוני</span>
            <a
              href="mailto:info@seeld.co.il"
              className="text-[#171717] border-b border-transparent hover:border-[#171717]/40 transition-colors"
              dir="ltr"
            >
              info@seeld.co.il
            </a>
          </div>
          <div className="flex items-baseline justify-between py-3 border-b border-[#171717]/10">
            <span className="text-[13px] text-[#5c5c5c]">אתר</span>
            <span className="text-[#171717]" dir="ltr">seeld.co.il</span>
          </div>
        </div>
      </LegalSection>

      <p className="border-t border-[#171717]/15 pt-5 text-[12px] leading-relaxed text-[#5c5c5c]">
        &copy; {new Date().getFullYear()} SEELD — כל הזכויות שמורות.
      </p>
    </div>
  );

  if (!isPublic) {
    return <div dir="rtl">{content}</div>;
  }

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* One quiet paper tile — the whole document */}
      <main className="px-2 pt-2">
        <div className="bento-panel"><div className="relative z-10 pb-6">
      {/* Hero */}
      <section>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-4">
          <div className="border-t border-[#171717]/20 pt-4 flex items-baseline justify-between gap-4">
            <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
              LEGAL · עודכן מרץ 2026
            </span>
            <button
              onClick={() => navigate(-1)}
              className="text-[13px] font-medium text-[#5c5c5c] hover:text-[#171717] transition-colors"
            >
              חזרה
            </button>
          </div>
          <h1
            className="mt-10 text-[#171717] leading-tight"
            style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", letterSpacing: "-0.025em" }}
          >
            מדיניות פרטיות
          </h1>
        </div>
      </section>

      {content}
        </div></div>
      </main>

      <Footer />
    </div>
  );
}
