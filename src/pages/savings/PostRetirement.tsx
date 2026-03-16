import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Umbrella, Banknote, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PostRetirement = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Umbrella className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">אחרי פרישה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ניהול חכם של הפנסיה והחסכונות לאחר הפרישה מעבודה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                ניהול קצבה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אופטימיזציה של הקצבה החודשית ותכנון תקציב
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary" />
                זכויות פנסיונרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מיצוי זכויות והטבות המגיעות לפנסיונרים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Umbrella className="w-5 h-5 text-primary" />
                הגנה על הון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                שמירה על ערך החסכונות והשקעה בטוחה
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
                הפרישה היא לא הסוף — זו תחילת פרק חדש שיכול להימשך 20-30 שנה ויותר. ניהול נכון של הכספים לאחר הפרישה הוא קריטי: צריך לוודא שהקצבה החודשית מספיקה, שהחסכונות שומרים על ערכם, ושכל הזכויות וההטבות מנוצלות במלואן.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                רבים מגלים רק לאחר הפרישה שהם לא ממצים את הזכויות שלהם — החזרי מס, הנחות, קצבאות נוספות מביטוח לאומי, ותיאום מס על הקצבה. ייעוץ מקצועי יכול להוסיף אלפי שקלים בשנה להכנסה הפנויה שלכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ליווי פנסיוני לאחר פרישה רלוונטי מיד עם תחילת קבלת הקצבה. אם כבר פרשתם ולא ביצעתם בדיקה מקיפה — עכשיו זה הזמן. כל חודש שעובר בלי אופטימיזציה הוא כסף שנשאר על השולחן.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ גם לבצע בדיקה תקופתית, לפחות אחת לשנה. תנאי המס משתנים, זכויות מתעדכנות, ויש הזדמנויות חדשות שכדאי לנצל. אנחנו ב-SeelD נוודא שאתם תמיד מקבלים את המקסימום.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                לאחר הפרישה, יש מספר נושאים קריטיים: תיאום מס על הקצבה (להבטיח שלא משלמים יותר מדי), מיצוי קצבאות ביטוח לאומי (קצבת זקנה, גמלת סיעוד), ניהול חסכונות והשקעות (התאמת רמת הסיכון לגיל), וביטוח רפואי וסיעודי מתאים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מציעים ליווי מקיף לפנסיונרים: נבדוק את הקצבה שלכם, נוודא שאתם ממצים כל זכות, נתאים את הביטוחים, ונבנה תוכנית כלכלית שמבטיחה איכות חיים גבוהה לאורך שנים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר לעבוד אחרי הפרישה?</h3>
                  <p className="text-muted-foreground">כן, אין מניעה לעבוד לאחר הפרישה ולקבל קצבת פנסיה במקביל. עם זאת, חשוב לבצע תיאום מס כדי להבטיח שלא משלמים מס עודף. ההכנסה מעבודה עשויה להשפיע גם על קצבת הזקנה מביטוח לאומי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה קורה עם הפנסיה של בן/בת הזוג אם נפטרתי?</h3>
                  <p className="text-muted-foreground">בן/בת הזוג זכאי/ת לקצבת שאירים מקרן הפנסיה, בדרך כלל בגובה 60% מהקצבה המקורית. חשוב לוודא שהמוטבים מעודכנים ולבדוק אם יש זכויות נוספות מביטוחי חיים ומביטוח לאומי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">איך אני יודע שאני מקבל את הקצבה הנכונה?</h3>
                  <p className="text-muted-foreground">בדיקה מקצועית של הקצבה כוללת אימות הנתונים, חישוב מחדש, ובדיקה שכל תקופות הוותק ופרמטרי החישוב נכונים. טעויות בחישוב הקצבה שכיחות למדי ויכולות לעלות הרבה כסף לאורך זמן.</p>
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
              {["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"].map((company) => (
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
              title="ייעוץ לאחר פרישה"
              description="מלאו את הפרטים ונבדוק שאתם ממצים את כל הזכויות שלכם"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PostRetirement;
