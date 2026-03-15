import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Lock } from 'lucide-react';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = location.pathname === '/privacy';

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
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-6 md:p-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <div className="text-center space-y-2">
            <div className="flex justify-center"><Lock className="h-8 w-8 text-primary" /></div>
            <h1 className="text-2xl font-bold text-foreground">מדיניות פרטיות</h1>
            <p className="text-xs text-muted-foreground">עדכון אחרון: מרץ 2026</p>
          </div>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. כללי</h2>
            <p>
              מערכת SeeID (להלן: "המערכת") מופעלת על ידי חברת SeeID בע"מ (להלן: "החברה").
              מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על מידע אישי
              של משתמשי המערכת, לרבות סוכני ביטוח, יועצים פיננסיים ולקוחות קצה.
            </p>
            <p>
              שימוש במערכת מהווה הסכמה למדיניות פרטיות זו. אנו ממליצים לקרוא מסמך זה בעיון.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. המידע שאנו אוספים</h2>
            <p>אנו עשויים לאסוף את סוגי המידע הבאים:</p>
            <div className="space-y-2 pr-4">
              <p><strong>2.1 מידע זיהוי אישי:</strong> שם מלא, מספר תעודת זהות, תאריך לידה, כתובת, מספר טלפון, כתובת דואר אלקטרוני.</p>
              <p><strong>2.2 מידע פיננסי:</strong> פרטי מוצרי ביטוח ופנסיה, צבירות, דמי ניהול, הפקדות, מספרי פוליסה.</p>
              <p><strong>2.3 מידע רפואי:</strong> מצב בריאותי, תרופות, ניתוחים, אשפוזים, מחלות רקע — ככל שנמסר על ידי הלקוח או סוכנו לצורך בחינת כיסוי ביטוחי.</p>
              <p><strong>2.4 מידע תעסוקתי:</strong> מעמד תעסוקתי, מקצוע, הכנסה חודשית ושנתית.</p>
              <p><strong>2.5 מידע טכני:</strong> כתובת IP, סוג דפדפן, זמני גישה ופעילות במערכת.</p>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. מטרות השימוש במידע</h2>
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
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. שיתוף מידע</h2>
            <p>
              אנו לא מוכרים, משכירים או מסחרים במידע האישי שלך. המידע עשוי להיות משותף אך ורק:
            </p>
            <ul className="list-disc pr-6 space-y-1.5">
              <li><strong>עם הסוכן/יועץ שלך:</strong> הסוכן או היועץ הפיננסי שהזין את המידע ומנהל את התיק שלך.</li>
              <li><strong>עם סוכנים נוספים באותה סוכנות:</strong> במידה ומדובר בסוכנות עם מספר סוכנים, המידע עשוי להיות נגיש לסוכנים נוספים בסוכנות לצורך המשכיות שירות.</li>
              <li><strong>עם ספקי שירות:</strong> ספקי תשתית טכנולוגית (אחסון, אבטחה) שפועלים בשמנו ובכפוף להתחייבויות סודיות.</li>
              <li><strong>על פי דין:</strong> כאשר נדרש על פי צו בית משפט או דרישה רגולטורית.</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. אבטחת מידע</h2>
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
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. שמירת מידע</h2>
            <p>
              המידע נשמר כל עוד חשבון הסוכנות פעיל וכל עוד הדבר נדרש לצורך מתן השירות
              או לעמידה בדרישות רגולטוריות. בהתאם לרגולציה בתחום הביטוח והפנסיה,
              חלק מהמידע עשוי להישמר לתקופות ארוכות כנדרש בחוק.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">7. זכויות הלקוח</h2>
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
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">8. עוגיות (Cookies)</h2>
            <p>
              המערכת משתמשת בעוגיות הכרחיות בלבד לצורך שמירת מצב ההתחברות ואבטחת הגישה.
              אנו לא משתמשים בעוגיות שיווקיות או למעקב צד שלישי.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">9. שינויים במדיניות</h2>
            <p>
              אנו שומרים לעצמנו את הזכות לעדכן מדיניות פרטיות זו מעת לעת.
              שינויים מהותיים יפורסמו במערכת. המשך השימוש לאחר פרסום שינויים
              מהווה הסכמה למדיניות המעודכנת.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">10. יצירת קשר</h2>
            <p>
              לשאלות בנוגע למדיניות פרטיות זו או לבקשות הנוגעות למידע האישי שלך,
              ניתן לפנות אלינו:
            </p>
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <p><strong>SeeID בע"מ</strong></p>
              <p>דואר אלקטרוני: info@seeld-ins.co.il</p>
              <p>אתר: seeld-ins.co.il</p>
            </div>
          </section>

          <Separator />

          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>© {new Date().getFullYear()} SeeID — כל הזכויות שמורות.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
