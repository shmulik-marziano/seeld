import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Baby, Gift, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const ChildSavings = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-4 hidden lg:block">
          <DoodleDecoration type="family" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Baby className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">קופת גמל חיסכון לכל ילד</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            תוכנית חיסכון ממשלתית המבטיחה קרן פתיחה לכל ילד בישראל בהגיעו לגיל 18
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                הפקדה ממשלתית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                המדינה מפקידה מדי חודש סכום קבוע עבור כל ילד
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                בחירת מסלול
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אפשרות לבחור את הגוף המנהל ומסלול ההשקעה
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                התחלה מושלמת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                הבטחת עתיד כלכלי יציב לילדיכם מגיל צעיר
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Card */}
        <section className="mb-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="עתיד בטוח לילדים"
              description="בחרו את הגוף המנהל ומסלול ההשקעה המתאים — והבטיחו קרן פתיחה מעולה לגיל 18."
              bgColor="bg-accent/10"
              doodle="family"
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
                תוכנית חיסכון לכל ילד היא מתנה של המדינה לכל ילד שנולד בישראל. המדינה מפקידה מדי חודש סכום קבוע לטובת כל ילד, והכסף צובר תשואה עד שהילד מגיע לגיל 18. הסכום שמצטבר יכול להגיע לעשרות אלפי שקלים — קרן פתיחה משמעותית לתחילת החיים הבוגרים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                מה שהרבה הורים לא יודעים הוא שהבחירה בגוף המנהל ובמסלול ההשקעה יכולה לעשות הבדל של אלפי שקלים. ברירת המחדל לא תמיד היא האופציה הטובה ביותר. בחירה מושכלת של מסלול עם תשואה גבוהה יותר יכולה להניב לילד שלכם סכום גדול משמעותית בגיל 18.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ההחלטה על הגוף המנהל ומסלול ההשקעה צריכה להתקבל מוקדם ככל האפשר — רצוי מיד עם לידת הילד. ככל שהבחירה מוקדמת יותר, כך הכסף נהנה מיותר שנים של צבירה ותשואה. אם טרם בחרתם — המדינה מפקידה את הכסף במסלול ברירת מחדל, שלא בהכרח מיטבי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                גם אם הילדים שלכם כבר גדולים, כדאי לבדוק באיזה גוף ומסלול הכסף נמצא. מעבר בין גופים מנהלים הוא תהליך פשוט וחינמי, ויכול לשפר משמעותית את התשואה על החיסכון.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ההורים צריכים לבחור בין שני אפשרויות: קופת גמל להשקעה (מנוהלת על ידי חברות ביטוח וגופי השקעה) או חשבון חיסכון בבנק. בדרך כלל, קופת גמל מניבה תשואה גבוהה יותר לאורך זמן, אם כי עם תנודתיות גבוהה יותר בטווח הקצר.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו עוזרים להורים לקבל החלטה מושכלת. נשווה עבורכם את כל הגופים המנהלים, נבדוק ביצועים היסטוריים ודמי ניהול, ונמליץ על המסלול שיביא את התשואה הטובה ביותר עבור ילדיכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מתי הילד יכול למשוך את הכסף?</h3>
                  <p className="text-muted-foreground">הילד יכול למשוך את הכסף מגיל 18. ניתן להשאיר את הכסף בחיסכון גם אחרי גיל 18 כדי להמשיך ולהנות מתשואה. המשיכה פטורה ממס.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר להוסיף הפקדות מעבר להפקדת המדינה?</h3>
                  <p className="text-muted-foreground">כן, ההורים יכולים להוסיף 50 שקלים בחודש מכיסם. ההפקדה הנוספת תגדיל משמעותית את הסכום שיצטבר עד גיל 18 הודות לאפקט הריבית דריבית.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה קורה אם לא בוחרים גוף מנהל?</h3>
                  <p className="text-muted-foreground">אם ההורים לא בוחרים תוך זמן מוגדר, המדינה מפקידה את הכסף בגוף שנבחר במכרז ממשלתי, במסלול ברירת מחדל. מומלץ לבחור באופן אקטיבי כדי להתאים את מסלול ההשקעה לצרכים שלכם.</p>
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
              focusArea="savings"
              title="ייעוץ לחיסכון לכל ילד"
              description="מלאו את הפרטים ונעזור לכם לבחור את הגוף והמסלול הטובים ביותר"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ChildSavings;
