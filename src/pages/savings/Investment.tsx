import Header from "@/components/Header";
import { LineChart, Target, Coins, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const Investment = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-12 left-4 hidden lg:block">
            <DoodleDecoration type="growth" size="lg" className="opacity-25 -rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <LineChart className="w-4 h-4" />
                חיסכון והשקעה
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                בנו את
                <span className="text-primary"> העתיד הפיננסי</span> שלכם
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                פתרונות השקעה מותאמים אישית לבניית תיק השקעות אופטימלי המתאים לפרופיל הסיכון והיעדים שלכם.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#analysis-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  ייעוץ השקעות חינם
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <LineChart className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Services */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">פתרונות ההשקעה שלנו</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  התאמה אישית
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  תיק השקעות מותאם לצרכים שלכם
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פרופיל סיכון אישי</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> יעדים ברורים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  ניהול מקצועי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  צוות מנהלי השקעות מנוסים
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ניטור שוטף</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> איזון תיק אוטומטי</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  מגוון אפיקים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  גישה למגוון רחב של השקעות
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Coins className="w-4 h-4 text-primary" /> מניות ואג"ח</li>
                  <li className="flex items-center gap-2"><Coins className="w-4 h-4 text-primary" /> נדל"ן וסחורות</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="בניית תיק השקעות מנצח"
              description="ניהול מקצועי של ההשקעות שלכם עם פיזור סיכונים חכם ותשואות מיטביות."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="charts"
              buttonText="ייעוץ חינם"
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
                השקעה חכמה היא המפתח לבניית עושר ואיתנות פיננסית לטווח ארוך. הכסף שיושב בעו״ש מאבד מערכו בגלל האינפלציה, בעוד כסף שמושקע נכון יכול לצמוח ולהכפיל את עצמו לאורך השנים. ההבדל בין חוסך להון משמעותי הוא לרוב לא כמה מרוויחים, אלא כמה חכם משקיעים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ניהול השקעות מקצועי מבטיח שהכסף שלכם עובד בצורה אופטימלית — עם פיזור סיכונים חכם, התאמה לפרופיל הסיכון שלכם, ומעקב שוטף אחרי ביצועי התיק. לא צריך להיות מומחה בשוק ההון כדי ליהנות מתשואות טובות.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הזמן הטוב ביותר להתחיל להשקיע הוא אתמול. הזמן השני הטוב ביותר הוא היום. ככל שמתחילים מוקדם יותר, כך אפקט הריבית דריבית עובד חזק יותר לטובתכם. גם סכומים קטנים שמושקעים באופן עקבי לאורך שנים הופכים להון משמעותי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ייעוץ השקעות רלוונטי בכל שלב: בתחילת הדרך כשרוצים לבנות תיק ראשון, כשיש סכום חד-פעמי להשקעה, כשמגיעים לנקודת מפנה כלכלית, או כשרוצים לבדוק שהתיק הקיים באמת עובד בצורה אופטימלית.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ניהול השקעות מוצלח מתחיל בהבנת פרופיל הסיכון שלכם: מהו אופק ההשקעה? כמה תנודתיות אתם מוכנים לספוג? מהם היעדים הכלכליים שלכם? על בסיס התשובות נבנה תיק מגוון שכולל מניות, אג״ח, נדל״ן ואפיקים נוספים בהתאמה אישית.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מציעים ייעוץ השקעות מקצועי שמתבסס על ניתוח מעמיק של המצב הכלכלי והיעדים שלכם. נבנה תיק מותאם אישית, נלווה אתכם לאורך הדרך, ונוודא שההשקעות שלכם תמיד מנוהלות בצורה אופטימלית.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה כסף צריך כדי להתחיל להשקיע?</h3>
                  <p className="text-muted-foreground">אין סכום מינימלי. אפשר להתחיל עם מאות שקלים בחודש בהוראת קבע. הדבר החשוב הוא להתחיל — גם סכומים קטנים שמושקעים באופן עקבי צוברים סכומים משמעותיים לאורך זמן.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה הסיכון בהשקעות?</h3>
                  <p className="text-muted-foreground">כל השקעה כרוכה בסיכון. ככל שפוטנציאל התשואה גבוה יותר, כך הסיכון גדול יותר. ניהול סיכונים נכון כולל פיזור השקעות, התאמה לאופק ההשקעה, ומעקב שוטף. לא שמים את כל הביצים בסל אחד.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ייעוץ השקעות לניהול תיקים?</h3>
                  <p className="text-muted-foreground">בייעוץ השקעות, המומחה מייעץ ואתם מקבלים החלטות. בניהול תיקים, מנהל ההשקעות מקבל החלטות עבורכם על פי מדיניות שהוגדרה מראש. שתי האפשרויות לגיטימיות — הבחירה תלויה בכמה אתם רוצים להיות מעורבים.</p>
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

        {/* Analysis Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm
              focusArea="investment"
              title="ייעוץ השקעות אישי"
              description="ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Investment;
