import Header from "@/components/Header";
import { Home, Shield, Flame, Droplets, Lock, CheckCircle } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const HomeInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-4 hidden lg:block">
            <DoodleDecoration type="family" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Home className="w-4 h-4" />
                ביטוח דירה
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה מקיפה על
                <span className="text-primary"> הבית שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח דירה מגן עליכם ועל הרכוש היקר שלכם מפני נזקים בלתי צפויים - שריפה, פריצה, נזקי מים ועוד.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#enrollment-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  להצטרפות ל-SeelD
                </a>
                <a href="#coverage" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  סוגי כיסויים
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <Home className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Coverage Types */}
        <section id="coverage" className="py-16 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">סוגי הכיסויים</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  ביטוח מבנה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  כיסוי לנזקים למבנה הדירה כולל קירות, רצפה ותקרה
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> נזקי שריפה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> נזקי רעידת אדמה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> נזקי סערה</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  ביטוח תכולה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  הגנה על רהיטים, מכשירי חשמל ורכוש אישי
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ריהוט וציוד</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> מכשירי חשמל</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> תכשיטים ויקרי ערך</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  כיסויים מורחבים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  הרחבות נוספות להגנה מקסימלית
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> שריפה ופיצוץ</li>
                  <li className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> נזקי מים</li>
                  <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> פריצה וגניבה</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה לבטח דרכנו?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="כיסוי מקיף" description="הגנה מלאה על המבנה, התכולה והאחריות כלפי צד שלישי" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="shield" />
            <FeatureCard title="מותאם אישית" description="פוליסה מותאמת לסוג הדירה, השכונה והצרכים שלכם" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="key" />
            <FeatureCard title="מחירים תחרותיים" description="השוואה בין חברות ביטוח לקבלת המחיר הטוב ביותר" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="savings" />
            <FeatureCard title="ליווי בתביעות" description="צוות מקצועי שילווה אתכם מרגע הנזק ועד לפיצוי" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="handshake" />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה ביטוח דירה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הדירה היא הנכס היקר ביותר שברשותכם. נזק מאש, הצפה, רעידת אדמה או פריצה יכול לגרום להפסדים כלכליים עצומים ללא ביטוח מתאים. ביטוח דירה מגן על המבנה ועל התכולה שלכם, ומעניק לכם שקט נפשי לדעת שבמקרה חירום, לא תישארו לבד מול הנזק.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                חשוב לדעת שביטוח מבנה הוא חובה על פי חוק לדירות בבתים משותפים (באחריות ועד הבית), אך ביטוח תכולה הוא באחריותכם האישית. שילוב של ביטוח מבנה ותכולה מעניק הגנה מקסימלית.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש ביטוח דירה?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח דירה רלוונטי ברגע שיש לכם דירה - בין אם בבעלות ובין אם בשכירות. שוכרים צריכים לפחות ביטוח תכולה להגנה על הריהוט והציוד האישי שלהם. בעלי דירות צריכים גם ביטוח מבנה וגם ביטוח תכולה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ לרכוש ביטוח דירה מיד עם כניסה לדירה חדשה, ולחדש אותו מדי שנה תוך בחינת ההצעות בשוק. שינויים כמו שיפוץ, רכישת ציוד יקר או הוספת חדר מחייבים עדכון של סכומי הביטוח.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                וודאו שסכום ביטוח המבנה תואם את עלות הבנייה מחדש (לא שווי השוק), ושסכום ביטוח התכולה מכסה את שווי כל הרכוש בדירה. שימו לב להחרגות כמו נזקי רטיבות כרוניים, בלאי טבעי, ונזקים שנגרמו ברשלנות. בדקו גם את גובה ההשתתפות העצמית ואת הכיסוי לצד שלישי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD נעזור לכם לבנות פוליסה מותאמת אישית שמכסה בדיוק את מה שאתם צריכים, במחיר הטוב ביותר בשוק.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם שוכר דירה צריך ביטוח?</h3>
                  <p className="text-muted-foreground">בהחלט. גם אם ביטוח המבנה הוא באחריות הבעלים, ביטוח תכולה מגן על הרכוש האישי שלכם - ריהוט, מכשירי חשמל, ביגוד ועוד. זהו ביטוח זול יחסית שמעניק הגנה חשובה.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח מבנה לביטוח תכולה?</h3>
                  <p className="text-muted-foreground">ביטוח מבנה מכסה את המבנה הפיזי של הדירה (קירות, רצפה, תקרה, צנרת). ביטוח תכולה מכסה את כל מה שבתוך הדירה - ריהוט, ביגוד, מכשירי חשמל ורכוש אישי. מומלץ לרכוש את שניהם.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה עולה ביטוח דירה?</h3>
                  <p className="text-muted-foreground">ביטוח תכולה בלבד יכול לעלות כ-300-800 שקלים בשנה. ביטוח מבנה + תכולה מקיף נע בין 800 ל-2,500 שקלים בשנה, בהתאם לגודל הדירה, המיקום וסכומי הביטוח.</p>
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

        {/* Enrollment Form */}
        <section id="enrollment-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceEnrollmentForm 
              insuranceType="home"
              title="הצטרפות לביטוח דירה"
              description="מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomeInsurance;
