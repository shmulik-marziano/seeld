import Header from "@/components/Header";
import { GraduationCap, TrendingUp, Calendar, CheckCircle, Banknote, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const TrainingFunds = () => {
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
                <GraduationCap className="w-4 h-4" />
                קרנות השתלמות
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                החיסכון
                <span className="text-primary"> הכי משתלם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                קרן השתלמות היא אפיק החיסכון המועדף בישראל - פטור מלא ממס רווחי הון ונזילות לאחר 6 שנים בלבד.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#analysis-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  ניתוח קרנות חינם
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <GraduationCap className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Benefits */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה קרן השתלמות?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  פטור ממס
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  פטור מלא ממס רווחי הון
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> 0% מס על רווחים</li>
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> ניכוי מס על הפקדות</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  נזילות מהירה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  משיכה פטורה לאחר 6 שנים
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ללא קנסות</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> שימוש חופשי בכספים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  מטרות מגוונות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  לא רק להשתלמויות
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> דירה לילדים</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> חופשה גדולה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> כל מטרה שתרצו</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="פטור מלא ממס רווחים"
              description="קרן השתלמות היא אפיק החיסכון היחיד שנהנה מפטור מלא ממס רווחי הון. כל הרווחים שלכם."
              bgColor="bg-primary/5"
              doodle="pension"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="נזילות מהירה"
              description="לאחר 6 שנים הכספים נזילים לחלוטין ללא קנסות — לכל מטרה שתרצו."
              bgColor="bg-accent/10"
              doodle="target"
              buttonText="בדקו את הקרנות שלכם"
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
                קרן השתלמות היא אפיק החיסכון היחיד בישראל שנהנה מפטור מלא ממס רווחי הון. המשמעות היא שכל הרווחים שהכסף שלכם מניב — 100% שלכם, ללא ניכוי מס. אין שום מוצר פיננסי אחר שמציע יתרון כזה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                לשכירים, קרן השתלמות היא הטבה משמעותית: המעסיק מפקיד 7.5% מהשכר, העובד מפקיד 2.5%, וההפקדות מוכרות כהוצאה לצרכי מס. לעצמאים, ההפקדה לקרן השתלמות מזכה בניכוי מס משמעותי. לאחר 6 שנים הכסף נזיל לחלוטין ואפשר להשתמש בו לכל מטרה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                לשכירים — מומלץ לוודא שהמעסיק מפקיד לקרן השתלמות כבר מהיום הראשון בעבודה. אם המעסיק לא מציע קרן השתלמות, שקלו לבקש זאת כחלק מתנאי ההעסקה. לעצמאים — כדאי לפתוח קרן השתלמות מיד עם תחילת הפעילות העצמאית.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                חשוב לבצע בדיקה תקופתית של ביצועי הקרן ודמי הניהול. הפרש של אחוז אחד בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך שנים. מעבר בין קרנות הוא תהליך פשוט וחינמי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת קרן השתלמות, יש לבחון שלושה פרמטרים מרכזיים: דמי ניהול (ככל שנמוכים יותר — טוב יותר), ביצועי הקרן לאורך זמן (לפחות 5-10 שנים), ומסלול ההשקעה (מניות, אג״ח, מסלול כללי וכו׳). לא תמיד הקרן הזולה ביותר היא הטובה ביותר — חשוב לראות את התמונה הכוללת.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מבצעים ניתוח מעמיק של קרנות ההשתלמות שלכם, משווים ביצועים ודמי ניהול מול כל הקרנות בשוק, ומוצאים את הקרן שתניב לכם את התשואה הטובה ביותר — ללא עלות.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מתי אפשר למשוך כסף מקרן השתלמות?</h3>
                  <p className="text-muted-foreground">לאחר 6 שנים ממועד ההפקדה הראשונה, הכספים נזילים לחלוטין ופטורים ממס רווחי הון. ניתן להשתמש בכסף לכל מטרה — אין חובה שהשימוש יהיה קשור להשתלמות.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה אפשר להפקיד בקרן השתלמות?</h3>
                  <p className="text-muted-foreground">לשכירים, תקרת ההפקדה המוטבת היא עד 15,712 שקלים בשנה (חלק עובד + מעסיק). לעצמאים, התקרה עומדת על כ-19,500 שקלים בשנה עם ניכוי מס.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר להעביר קרן השתלמות בין חברות?</h3>
                  <p className="text-muted-foreground">כן, המעבר חינמי ופשוט. אפשר לעבור לקרן עם דמי ניהול נמוכים יותר או ביצועים טובים יותר בכל עת. אנחנו ב-SeelD מטפלים בכל התהליך עבורכם.</p>
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
              focusArea="savings"
              title="ניתוח קרנות השתלמות"
              description="בדקו אם הקרנות שלכם מניבות את התשואה המיטבית"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrainingFunds;
