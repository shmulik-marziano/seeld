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

export default function TermsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/terms';

  const content = (
    <div
      className="max-w-3xl mx-auto px-5 sm:px-8 py-8 space-y-10 text-[17px] leading-[1.8] [&_strong]:font-bold [&_strong]:text-[#003D30]"
      style={{ color: BODY }}
    >
      <LegalSection title="1. כללי">
        <p>
          ברוכים הבאים למערכת SEELD (להלן: "המערכת"), המופעלת על ידי חברת SEELD (להלן: "החברה").
          השימוש במערכת כפוף לתנאי שימוש אלו. בעצם הגישה למערכת ו/או השימוש בה, הנך מאשר/ת כי
          קראת והבנת תנאים אלו ומסכים/ה להם במלואם.
        </p>
      </LegalSection>

      <LegalSection title="2. הגדרות">
        <PillList
          items={[
            <><strong>"המערכת":</strong> פלטפורמת SEELD לניהול לקוחות, המלצות ביטוח פנסיוניות וסיכומי ביצועים.</>,
            <><strong>"משתמש":</strong> סוכן ביטוח, יועץ פנסיוני או גורם מורשה אחר המשתמש במערכת.</>,
            <><strong>"לקוח קצה":</strong> אדם שפרטיו מנוהלים במערכת על ידי המשתמש.</>,
            <><strong>"תוכן":</strong> כל מידע, נתון, מסמך, המלצה או דוח המוזן או נוצר במערכת.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. תנאי שימוש">
        <p>
          השימוש במערכת מותר אך ורק לבעלי רישיון תקף מהרשות לשוק ההון, ביטוח וחיסכון או רגולטור
          מוסמך אחר. המשתמש מצהיר ומתחייב כי הוא בעל רישיון תקף ופועל בהתאם לכל דין רלוונטי,
          לרבות חוק הפיקוח על שירותים פיננסיים (ייעוץ, שיווק ומערכת סליקה פנסיוניים), תשס״ה-2005.
        </p>
      </LegalSection>

      <LegalSection title="4. הגבלת אחריות">
        <p>
          <strong>המערכת מהווה כלי עזר טכנולוגי בלבד ואינה מהווה ייעוץ ביטוחי, פנסיוני, פיננסי או
          משפטי מכל סוג שהוא.</strong>
        </p>
        <PillList
          items={[
            "החברה אינה אחראית לכל נזק ישיר, עקיף, מיוחד, תוצאתי או אגבי הנובע מהשימוש במערכת, לרבות אך לא רק: אובדן נתונים, הפסד כספי, אובדן רווחים, נזק למוניטין או כל נזק אחר.",
            <>ההמלצות המופקות במערכת, לרבות המלצות הנוצרות באמצעות בינה מלאכותית, הן בגדר הצעות בלבד ואינן מהוות תחליף לשיקול דעת מקצועי של המשתמש. <strong>האחריות הבלעדית לכל המלצה הניתנת ללקוח הקצה חלה על המשתמש.</strong></>,
            "החברה אינה אחראית לדיוק, שלמות או עדכניות המידע במערכת. על המשתמש לוודא את נכונות הנתונים באופן עצמאי.",
            "החברה אינה צד ליחסים שבין המשתמש ללקוח הקצה ואינה נושאת באחריות כלשהי כלפי לקוחות הקצה.",
          ]}
        />
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
        <p>
          תוכן שהמשתמש מזין למערכת נשאר בבעלות המשתמש, אולם המשתמש מעניק לחברה רישיון
          לאחסן, לעבד ולהציג תוכן זה לצורך הפעלת המערכת.
        </p>
      </LegalSection>

      <LegalSection title="7. פרטיות ואבטחת מידע">
        <p>
          החברה מחויבת להגנת פרטיות המידע בהתאם לחוק הגנת הפרטיות, התשמ״א-1981 ותקנותיו.
          המידע מאוחסן בשרתים מאובטחים עם הצפנה, בקרת גישה ובידוד נתונים ברמת סוכנות.
        </p>
        <p>
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
          תאפשר למשתמש לייצא את נתוניו תוך <span dir="ltr" className="tabular-nums whitespace-nowrap">30</span> ימים.
        </p>
      </LegalSection>

      <LegalSection title="10. שינויים בתנאי השימוש">
        <p>
          החברה רשאית לעדכן תנאים אלו מעת לעת. שינויים מהותיים יישלחו למשתמשים בדוא״ל
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
          לכל שאלה או פנייה בנוגע לתנאי שימוש אלו, ניתן לפנות אלינו בדוא״ל:{' '}
          <a
            href="mailto:info@seeld.co.il"
            className="font-bold border-b border-[#003D30]/30 hover:border-[#003D30] transition-colors"
            style={{ color: GREEN }}
            dir="ltr"
          >
            info@seeld.co.il
          </a>
        </p>
      </LegalSection>

      <p className="border-t pt-5 text-[14px] leading-relaxed" style={{ color: MUTED, borderColor: LINE }}>
        &copy; <span dir="ltr" className="tabular-nums">{new Date().getFullYear()}</span> שילד ביטוח ופיננסים. כל הזכויות שמורות. תנאי שימוש אלו מהווים את ההסכם
        המלא בין המשתמש לחברה בנוגע לשימוש במערכת.
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
              תנאי שימוש
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[14px]" style={{ color: MUTED }}>
                עודכן במרץ <span dir="ltr" className="tabular-nums whitespace-nowrap">2026</span>
              </span>
              <button type="button" onClick={() => navigate('/')} className="link-rule text-[15px]">
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
