import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Target, PieChart, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const FinancialPlanning = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-12 left-8 hidden lg:block">
          <DoodleDecoration type="calculator" size="lg" className="opacity-20 -rotate-6" parallax parallaxSpeed={0.12} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">המרכז לתכנון כלכלי מתקדם</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ליווי מקצועי ומקיף לבניית תוכנית כלכלית אישית ארוכת טווח
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                ניתוח מקיף
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מיפוי מלא של המצב הכלכלי והגדרת יעדים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                תוכנית פעולה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                בניית אסטרטגיה מותאמת אישית להשגת היעדים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                ליווי שוטף
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מעקב ועדכון התוכנית בהתאם לשינויים בחיים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Card */}
        <section className="mb-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="תוכנית כלכלית מותאמת"
              description="ניתוח מקיף של המצב הכלכלי שלכם ובניית אסטרטגיה להשגת כל היעדים."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="target"
              buttonText="לייעוץ חינם"
              buttonHref="#analysis-form"
            />
          </ScrollReveal>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תכנון כלכלי הוא לא רק לעשירים. כל אדם ומשפחה צריכים תוכנית שמגדירה לאן הכסף הולך, מה היעדים הכלכליים, ואיך מגיעים אליהם. בלי תוכנית, רוב האנשים מגיעים לנקודות מפתח בחיים — רכישת דירה, חינוך ילדים, פרישה — בלי מספיק משאבים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תכנון כלכלי מקצועי מסתכל על התמונה הרחבה: הכנסות, הוצאות, חסכונות, ביטוחים, מיסוי, ירושה ועוד. הוא מזהה הזדמנויות שלא ניצלתם, סיכונים שלא חשבתם עליהם, ודרכים להגדיל את ההון שלכם לאורך זמן. מדובר במפת דרכים כלכלית שמלווה אתכם לכל החיים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תכנון כלכלי רלוונטי בכל שלב בחיים, אבל ישנם רגעים שבהם הוא קריטי במיוחד: כשמתחילים לעבוד ומרוויחים את המשכורת הראשונה, לפני רכישת דירה, כשנולד ילד, כשמתגרשים, כשיורשים כסף, או כשמתקרבים לפרישה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                אם אף פעם לא עשיתם תכנון כלכלי מסודר — עכשיו זה הזמן הטוב ביותר להתחיל. כל יום שעובר בלי תוכנית הוא יום שאתם לא ממקסמים את הפוטנציאל הכלכלי שלכם. גם שינויים קטנים יכולים לעשות הבדל גדול לאורך זמן.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תכנון כלכלי מקצועי כולל מספר רבדים: ניתוח תזרים מזומנים, בניית קרן חירום, תכנון ביטוחי (חיים, בריאות, סיעודי), תכנון פנסיוני, אסטרטגיית השקעות, תכנון מס, ותכנון ירושה. כל רובד חשוב ומשלים את האחרים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מציעים שירות תכנון כלכלי מקיף ואישי. נמפה את המצב הכלכלי הנוכחי שלכם, נגדיר יעדים ברורים, ונבנה תוכנית פעולה מפורטת עם ליווי שוטף. כל זה בגישה אנושית, מקצועית וללא מילים מסובכות.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה כולל תהליך תכנון כלכלי?</h3>
                  <p className="text-muted-foreground">התהליך כולל פגישת היכרות, איסוף נתונים כלכליים מלאים, ניתוח מעמיק, הצגת ממצאים והמלצות, בניית תוכנית פעולה, ויישום עם ליווי שוטף. הכל מותאם אישית למצב ולצרכים שלכם.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה זמן לוקח התהליך?</h3>
                  <p className="text-muted-foreground">תהליך התכנון הראשוני לוקח בדרך כלל 2-4 שבועות, כולל איסוף מידע, ניתוח ובניית התוכנית. הליווי השוטף ממשיך לאורך זמן עם פגישות תקופתיות לעדכון ומעקב.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם תכנון כלכלי רלוונטי גם למי שלא מרוויח הרבה?</h3>
                  <p className="text-muted-foreground">בהחלט. דווקא מי שההכנסה שלו מוגבלת צריך תכנון כלכלי חכם כדי למקסם כל שקל. ניהול נכון של תקציב, ניצול הטבות מס, ובחירת מוצרים פיננסיים נכונים יכולים לשנות משמעותית את המצב הכלכלי.</p>
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
              {["הפניקס", "מגדל", "הראל", "כלל", "מנורה מבטחים", "איילון", "הכשרה", "ביטוח ישיר", "שלמה ביטוח", "AIG", "ליברה"].map((company) => (
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
              title="ייעוץ לתכנון כלכלי"
              description="מלאו את הפרטים ונבנה עבורכם תוכנית כלכלית מותאמת אישית"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FinancialPlanning;
