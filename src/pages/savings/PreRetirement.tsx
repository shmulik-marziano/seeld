import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Clock, Calculator, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PreRetirement = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">לפני פרישה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הכנה מקיפה לפרישה - כל מה שצריך לדעת לפני המעבר לפנסיה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                תחשיב פנסיה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                חישוב מדויק של הקצבה הצפויה והיערכות כלכלית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                איחוד חסכונות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ריכוז כל החסכונות הפנסיוניים למקסום הזכויות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                תכנון מס
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אופטימיזציה של תשלומי המס בפרישה
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                השנים שלפני הפרישה הן התקופה הקריטית ביותר לתכנון פנסיוני. החלטות שמתקבלות בשלב הזה — כמו מתי לפרוש, איך למשוך את הכספים, ואיפה לרכז את החסכונות — ישפיעו על רמת החיים שלכם לעשרות השנים הבאות. טעויות בשלב זה עלולות לעלות מאות אלפי שקלים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                רבים מגיעים לגיל הפרישה עם חסכונות מפוזרים במספר גופים, פוליסות ישנות עם דמי ניהול גבוהים, וללא תוכנית מס מסודרת. הכנה נכונה לפרישה כוללת ריכוז כל המידע, אופטימיזציה של החסכונות, ובניית תוכנית משיכה שממקסמת את ההכנסה הפנויה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                מומלץ להתחיל בתהליך הכנה לפרישה לפחות 3-5 שנים לפני גיל הפרישה המתוכנן. זה נותן מספיק זמן לבצע התאמות, לאחד חסכונות, לבנות תוכנית מס, ולהיערך נפשית וכלכלית למעבר. ככל שמתחילים מוקדם יותר, כך האפשרויות רחבות יותר.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                גם אם אתם כבר קרובים לפרישה ולא התחלתם להתכונן — עדיין לא מאוחר. ייעוץ מקצועי בשלב הזה יכול לחסוך לכם סכומים משמעותיים ולהבטיח שהכסף שצברתם ישמש אתכם בצורה הטובה ביותר.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תהליך ההכנה לפרישה כולל מספר שלבים: איסוף כל המידע על החסכונות הפנסיוניים (קרנות פנסיה, ביטוחי מנהלים, קרנות השתלמות), חישוב הקצבה הצפויה, בדיקת זכויות מביטוח לאומי, תכנון מס אופטימלי, ובחירת אסטרטגיית משיכה (קצבה, הון, או שילוב).
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מציעים ליווי מקיף לפני פרישה. נרכז את כל המידע, נבנה תוכנית מותאמת אישית, ונלווה אתכם בכל שלב — כדי שהמעבר לפנסיה יהיה חלק, בטוח ומשתלם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מתי אפשר לפרוש?</h3>
                  <p className="text-muted-foreground">גיל הפרישה בישראל הוא 67 לגברים ו-65 לנשים (עולה בהדרגה). ניתן לפרוש מוקדם יותר, אך זה ישפיע על גובה הקצבה. פרישה מאוחרת יותר תגדיל את הקצבה החודשית.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם כדאי למשוך הון חד-פעמי או קצבה?</h3>
                  <p className="text-muted-foreground">התשובה תלויה במצבכם הכלכלי. קצבה חודשית מבטיחה הכנסה קבועה לכל החיים. משיכת הון חד-פעמי נותנת גמישות אך דורשת ניהול עצמי. ברוב המקרים, שילוב של שניהם הוא הפתרון האופטימלי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">יש לי כספים ב-5 גופים שונים, מה עושים?</h3>
                  <p className="text-muted-foreground">איחוד חסכונות פנסיוניים יכול לחסוך דמי ניהול ולפשט את הניהול. אך לא תמיד כדאי לאחד — לפעמים יש יתרון בשמירה על פוליסות ותיקות עם תנאים מיוחדים. אנחנו נבדוק כל מקרה לגופו.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Companies Section */}
        <section className="py-16 bg-muted/20 rounded-3xl my-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-[#0a3d3d]">חברות שאנחנו משווקים</h2>
              <p className="text-lg text-muted-foreground">אנחנו עובדים עם חברות הביטוח המובילות בישראל כדי להביא לכם את ההצעה הטובה ביותר</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {["מנורה מבטחים", "הראל", "מגדל", "כלל", "הפניקס", "איילון", "מיטב", "ילין לפידות", "אנליסט", "אלטשולר שחם", "הכשרה"].map((company) => (
                <span key={company} className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-[#5ec6c6]/30 shadow-sm hover:shadow-md hover:border-[#5ec6c6] transition-all">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm
              focusArea="pension"
              title="ייעוץ לפני פרישה"
              description="מלאו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PreRetirement;
