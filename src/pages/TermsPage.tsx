import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DISPLAY, MONO, MUTED, NAVY } from '@/lib/brand';

// SEELD DNA v3: one quiet white column, navy headings, hairline rules (STYLESEED.md)

const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[#E7EDF1] pt-5">
    <h2 className="text-[19px] mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
      {title}
    </h2>
    {children}
  </section>
);

export default function TermsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/terms';

  const content = (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10 text-base leading-[1.9] text-[#3a4c5a] [&_strong]:text-[#1D2D3D] [&_strong]:font-medium">
      <LegalSection title="1. כללי">
        <p>
          ברוכים הבאים למערכת SEELD (להלן: "המערכת"), המופעלת על ידי חברת SEELD (להלן: "החברה").
          השימוש במערכת כפוף לתנאי שימוש אלו. בעצם הגישה למערכת ו/או השימוש בה, הנך מאשר/ת כי
          קראת והבנת תנאים אלו ומסכים/ה להם במלואם.
        </p>
      </LegalSection>

      <LegalSection title="2. הגדרות">
        <ul className="list-disc pr-6 space-y-1.5">
          <li><strong>"המערכת":</strong> פלטפורמת SEELD לניהול לקוחות, המלצות ביטוח פנסיוניות וסיכומי ביצועים.</li>
          <li><strong>"משתמש":</strong> סוכן ביטוח, יועץ פנסיוני או גורם מורשה אחר המשתמש במערכת.</li>
          <li><strong>"לקוח קצה":</strong> אדם שפרטיו מנוהלים במערכת על ידי המשתמש.</li>
          <li><strong>"תוכן":</strong> כל מידע, נתון, מסמך, המלצה או דוח המוזן או נוצר במערכת.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. תנאי שימוש">
        <p>
          השימוש במערכת מותר אך ורק לבעלי רישיון תקף מהרשות לשוק ההון, ביטוח וחיסכון או רגולטור
          מוסמך אחר. המשתמש מצהיר ומתחייב כי הוא בעל רישיון תקף ופועל בהתאם לכל דין רלוונטי,
          לרבות חוק הפיקוח על שירותים פיננסיים (ייעוץ, שיווק ומערכת סליקה פנסיוניים), תשס"ה-2005.
        </p>
      </LegalSection>

      <LegalSection title="4. הגבלת אחריות">
        <p>
          <strong>המערכת מהווה כלי עזר טכנולוגי בלבד ואינה מהווה ייעוץ ביטוחי, פנסיוני, פיננסי או
          משפטי מכל סוג שהוא.</strong>
        </p>
        <ul className="list-disc pr-6 space-y-2 mt-2">
          <li>
            החברה אינה אחראית לכל נזק ישיר, עקיף, מיוחד, תוצאתי או אגבי הנובע מהשימוש במערכת,
            לרבות אך לא רק: אובדן נתונים, הפסד כספי, אובדן רווחים, נזק למוניטין או כל נזק אחר.
          </li>
          <li>
            ההמלצות המופקות במערכת, לרבות המלצות הנוצרות באמצעות בינה מלאכותית (AI), הן בגדר
            הצעות בלבד ואינן מהוות תחליף לשיקול דעת מקצועי של המשתמש. <strong>האחריות הבלעדית
            לכל המלצה הניתנת ללקוח הקצה חלה על המשתמש.</strong>
          </li>
          <li>
            החברה אינה אחראית לדיוק, שלמות או עדכניות המידע במערכת. על המשתמש לוודא את
            נכונות הנתונים באופן עצמאי.
          </li>
          <li>
            החברה אינה צד ליחסים שבין המשתמש ללקוח הקצה ואינה נושאת באחריות כלשהי כלפי
            לקוחות הקצה.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. שיפוי">
        <p>
          המשתמש מתחייב לשפות את החברה, מנהליה, עובדיה ושלוחיה, בגין כל תביעה, דרישה, נזק,
          הפסד, הוצאה (לרבות שכר טרחת עורכי דין) או חבות הנובעים מ: (א) השימוש במערכת;
          (ב) הפרת תנאי שימוש אלו; (ג) הפרת זכויות צד שלישי; (ד) כל המלצה, ייעוץ או שירות
          שניתן ללקוח קצה תוך שימוש במערכת.
        </p>
      </LegalSection>

      <LegalSection title="6. קניין רוחני">
        <p>
          כל זכויות הקניין הרוחני במערכת, לרבות קוד מקור, עיצוב, אלגוריתמים, לוגו וסימני מסחר,
          שייכות לחברה. המשתמש מקבל רישיון שימוש מוגבל, לא-בלעדי, שאינו ניתן להעברה.
        </p>
        <p className="mt-2">
          תוכן שהמשתמש מזין למערכת נשאר בבעלות המשתמש, אולם המשתמש מעניק לחברה רישיון
          לאחסן, לעבד ולהציג תוכן זה לצורך הפעלת המערכת.
        </p>
      </LegalSection>

      <LegalSection title="7. פרטיות ואבטחת מידע">
        <p>
          החברה מחויבת להגנת פרטיות המידע בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו.
          המידע מאוחסן בשרתים מאובטחים עם הצפנה, בקרת גישה ובידוד נתונים ברמת סוכנות.
        </p>
        <p className="mt-2">
          המשתמש אחראי לקבלת הסכמת לקוחות הקצה לאיסוף, עיבוד ושמירת מידע אישי במערכת,
          בהתאם לכל דין.
        </p>
      </LegalSection>

      <LegalSection title="8. זמינות המערכת">
        <p>
          החברה תעשה מאמצים סבירים לשמור על זמינות המערכת, אך אינה מתחייבת לזמינות רציפה
          וללא הפרעות. החברה רשאית להפסיק או להגביל את השירות לצרכי תחזוקה, עדכונים או
          מכל סיבה אחרת, ללא הודעה מוקדמת.
        </p>
      </LegalSection>

      <LegalSection title="9. סיום שימוש">
        <p>
          החברה רשאית להשעות או לסיים את גישת המשתמש למערכת בכל עת, ללא הודעה מוקדמת,
          במקרה של הפרת תנאי שימוש אלו או מכל סיבה סבירה אחרת. עם סיום השימוש, החברה
          תאפשר למשתמש לייצא את נתוניו תוך 30 ימים.
        </p>
      </LegalSection>

      <LegalSection title="10. שינויים בתנאי השימוש">
        <p>
          החברה רשאית לעדכן תנאים אלו מעת לעת. שינויים מהותיים יישלחו למשתמשים בדוא"ל
          ו/או בהודעה במערכת. המשך השימוש במערכת לאחר העדכון מהווה הסכמה לתנאים המעודכנים.
        </p>
      </LegalSection>

      <LegalSection title="11. דין חל וסמכות שיפוט">
        <p>
          תנאי שימוש אלו כפופים לדין הישראלי. כל מחלוקת תתברר בבתי המשפט המוסמכים
          במחוז תל אביב-יפו בלבד.
        </p>
      </LegalSection>

      <LegalSection title="12. יצירת קשר">
        <p>
          לכל שאלה או פנייה בנוגע לתנאי שימוש אלו, ניתן לפנות אלינו בדוא"ל:{' '}
          <a
            href="mailto:info@seeld.co.il"
            className="text-[#1D2D3D] font-medium border-b border-[#1D2D3D]/25 hover:border-[#1D2D3D] transition-colors"
            dir="ltr"
          >
            info@seeld.co.il
          </a>
        </p>
      </LegalSection>

      <p className="border-t border-[#E7EDF1] pt-5 text-[12px] leading-relaxed" style={{ color: MUTED }}>
        &copy; {new Date().getFullYear()} SEELD. כל הזכויות שמורות. תנאי שימוש אלו מהווים את ההסכם
        המלא בין המשתמש לחברה בנוגע לשימוש במערכת.
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
              תנאי שימוש
            </h1>
            {/* Metadata under the title — mono, muted */}
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
                עודכן מרץ 2026
              </span>
              <button
                onClick={() => navigate('/')}
                className="text-[13px] font-medium hover:text-[#1D2D3D] transition-colors"
                style={{ color: MUTED }}
              >
                חזרה לדף הבית
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
