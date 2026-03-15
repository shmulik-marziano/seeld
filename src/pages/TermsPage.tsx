import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Shield } from 'lucide-react';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

export default function TermsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/terms';

  return (
    <div className={`${isPublic ? 'min-h-screen bg-background' : ''} max-w-4xl mx-auto px-4 py-8 space-y-6`} dir="rtl">
      {isPublic && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SeeIDLogo size={40} />
            <div>
              <h1 className="text-lg font-bold text-foreground">SeeID</h1>
              <p className="text-xs text-muted-foreground">תכנון פיננסי וביטוח</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">תנאי שימוש</h1>
      </div>
      <p className="text-sm text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>

      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-6 text-foreground/90 leading-relaxed">
          
          <section>
            <h2 className="text-lg font-bold text-foreground">1. כללי</h2>
            <p>
              ברוכים הבאים למערכת SeeID (להלן: "המערכת"), המופעלת על ידי חברת SeelD (להלן: "החברה"). 
              השימוש במערכת כפוף לתנאי שימוש אלו. בעצם הגישה למערכת ו/או השימוש בה, הנך מאשר/ת כי 
              קראת והבנת תנאים אלו ומסכים/ה להם במלואם.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. הגדרות</h2>
            <ul className="list-disc pr-6 space-y-1">
              <li><strong>"המערכת"</strong> — פלטפורמת SeeID לניהול לקוחות, המלצות ביטוח פנסיוניות וסיכומי ביצועים.</li>
              <li><strong>"משתמש"</strong> — סוכן ביטוח, יועץ פנסיוני או גורם מורשה אחר המשתמש במערכת.</li>
              <li><strong>"לקוח קצה"</strong> — אדם שפרטיו מנוהלים במערכת על ידי המשתמש.</li>
              <li><strong>"תוכן"</strong> — כל מידע, נתון, מסמך, המלצה או דוח המוזן או נוצר במערכת.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. תנאי שימוש</h2>
            <p>
              השימוש במערכת מותר אך ורק לבעלי רישיון תקף מהרשות לשוק ההון, ביטוח וחיסכון או רגולטור 
              מוסמך אחר. המשתמש מצהיר ומתחייב כי הוא בעל רישיון תקף ופועל בהתאם לכל דין רלוונטי, 
              לרבות חוק הפיקוח על שירותים פיננסיים (ייעוץ, שיווק ומערכת סליקה פנסיוניים), תשס"ה-2005.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. הגבלת אחריות</h2>
            <p>
              <strong>המערכת מהווה כלי עזר טכנולוגי בלבד ואינה מהווה ייעוץ ביטוחי, פנסיוני, פיננסי או 
              משפטי מכל סוג שהוא.</strong>
            </p>
            <ul className="list-disc pr-6 space-y-2">
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
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. שיפוי</h2>
            <p>
              המשתמש מתחייב לשפות את החברה, מנהליה, עובדיה ושלוחיה, בגין כל תביעה, דרישה, נזק, 
              הפסד, הוצאה (לרבות שכר טרחת עורכי דין) או חבות הנובעים מ: (א) השימוש במערכת; 
              (ב) הפרת תנאי שימוש אלו; (ג) הפרת זכויות צד שלישי; (ד) כל המלצה, ייעוץ או שירות 
              שניתן ללקוח קצה תוך שימוש במערכת.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. קניין רוחני</h2>
            <p>
              כל זכויות הקניין הרוחני במערכת, לרבות קוד מקור, עיצוב, אלגוריתמים, לוגו וסימני מסחר, 
              שייכות לחברה. המשתמש מקבל רישיון שימוש מוגבל, לא-בלעדי, שאינו ניתן להעברה.
            </p>
            <p>
              תוכן שהמשתמש מזין למערכת נשאר בבעלות המשתמש, אולם המשתמש מעניק לחברה רישיון 
              לאחסן, לעבד ולהציג תוכן זה לצורך הפעלת המערכת.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. פרטיות ואבטחת מידע</h2>
            <p>
              החברה מחויבת להגנת פרטיות המידע בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו. 
              המידע מאוחסן בשרתים מאובטחים עם הצפנה, בקרת גישה ובידוד נתונים ברמת סוכנות.
            </p>
            <p>
              המשתמש אחראי לקבלת הסכמת לקוחות הקצה לאיסוף, עיבוד ושמירת מידע אישי במערכת, 
              בהתאם לכל דין.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">8. זמינות המערכת</h2>
            <p>
              החברה תעשה מאמצים סבירים לשמור על זמינות המערכת, אך אינה מתחייבת לזמינות רציפה 
              וללא הפרעות. החברה רשאית להפסיק או להגביל את השירות לצרכי תחזוקה, עדכונים או 
              מכל סיבה אחרת, ללא הודעה מוקדמת.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">9. סיום שימוש</h2>
            <p>
              החברה רשאית להשעות או לסיים את גישת המשתמש למערכת בכל עת, ללא הודעה מוקדמת, 
              במקרה של הפרת תנאי שימוש אלו או מכל סיבה סבירה אחרת. עם סיום השימוש, החברה 
              תאפשר למשתמש לייצא את נתוניו תוך 30 ימים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">10. שינויים בתנאי השימוש</h2>
            <p>
              החברה רשאית לעדכן תנאים אלו מעת לעת. שינויים מהותיים יישלחו למשתמשים בדוא"ל 
              ו/או בהודעה במערכת. המשך השימוש במערכת לאחר העדכון מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">11. דין חל וסמכות שיפוט</h2>
            <p>
              תנאי שימוש אלו כפופים לדין הישראלי. כל מחלוקת תתברר בבתי המשפט המוסמכים 
              במחוז תל אביב-יפו בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">12. יצירת קשר</h2>
            <p>
              לכל שאלה או פנייה בנוגע לתנאי שימוש אלו, ניתן לפנות אלינו בדוא"ל: 
              <a href="mailto:info@seeld-ins.co.il" className="text-primary font-medium mr-1">info@seeld-ins.co.il</a>
            </p>
          </section>

          <Separator className="my-6" />

          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} SeelD — כל הזכויות שמורות. תנאי שימוש אלו מהווים את ההסכם 
            המלא בין המשתמש לחברה בנוגע לשימוש במערכת.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
