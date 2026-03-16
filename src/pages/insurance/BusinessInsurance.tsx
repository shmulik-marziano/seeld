import Header from "@/components/Header";
import { Building2, Shield, Users, Briefcase, FileText, CheckCircle } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const BusinessInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-8 hidden lg:block">
            <DoodleDecoration type="handshake" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Building2 className="w-4 h-4" />
                ביטוח עסקים
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה מלאה על
                <span className="text-primary"> העסק שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח עסקי מקיף שמגן על המבנה, התכולה, העובדים והפעילות העסקית שלכם.
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
                <Building2 className="w-32 h-32 text-primary" />
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
                  <Building2 className="w-5 h-5 text-primary" />
                  מבנה ותכולה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  הגנה על המבנה, הציוד והמלאי של העסק
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> נזקי אש ופריצה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ציוד ומכונות</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> מלאי עסקי</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  אחריות מקצועית
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  כיסוי לתביעות בגין נזקים מפעילות העסק
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> תביעות לקוחות</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> הוצאות משפטיות</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פיצויים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  חבות מעסיקים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  ביטוח לתביעות עובדים בגין נזקי גוף
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> תאונות עבודה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> מחלות מקצוע</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פיצויי עובדים</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">היתרונות שלנו</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="פוליסה מותאמת" description="ביטוח שנבנה במיוחד לסוג העסק, הענף והצרכים הייחודיים שלכם" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="target" />
            <FeatureCard title="ליווי מקצועי" description="צוות מומחים שמלווה אתכם בכל שלב - מהתאמה ועד תביעה" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="handshake" />
            <FeatureCard title="חיסכון לעסק" description="השוואת מחירים מול כל חברות הביטוח לחיסכון מקסימלי" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="savings" />
            <FeatureCard title="הגנה רחבה" description="כיסוי מקיף למבנה, תכולה, עובדים ואחריות מקצועית" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="umbrella" />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                עסק הוא מערכת מורכבת שחשופה לסיכונים רבים — משריפה או הצפה ועד תביעות לקוחות, גניבת ציוד או נזק לצד שלישי. ביטוח עסקי מקיף הוא לא מותרות אלא הכרח. אירוע אחד בלתי צפוי ללא כיסוי ביטוחי יכול להוביל לסגירת העסק או לחובות כבדים שייקח שנים להתאושש מהם.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח עסקי נכון מגן על הנכסים הפיזיים, על הפעילות השוטפת, על העובדים ועל המוניטין שלכם. הוא מאפשר לכם להתמקד בצמיחה ופיתוח העסק מתוך ידיעה שאם משהו ישתבש — יש לכם רשת ביטחון כלכלית.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                כל עסק זקוק לביטוח מהיום הראשון לפעילותו. בין אם מדובר בעסק חדש שזה עתה נפתח, או בעסק ותיק שמרחיב את פעילותו — ביטוח עסקי הוא תנאי בסיסי לניהול אחראי. ענפים רבים אף דורשים ביטוח אחריות מקצועית כתנאי לקבלת רישיון עסק.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                חשוב במיוחד לעדכן את הביטוח בכל שינוי משמעותי: הרחבת העסק, גיוס עובדים חדשים, רכישת ציוד יקר, מעבר למיקום חדש, או כניסה לתחום פעילות נוסף. ביטוח שלא מעודכן עלול להשאיר אתכם בלי כיסוי ברגע האמת.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח עסקי בנוי ממספר שכבות: ביטוח מבנה ותכולה, ביטוח אחריות מקצועית, ביטוח חבות מעסיקים, ביטוח אובדן רווחים ועוד. חשוב לבנות פוליסה שמתאימה בדיוק לסוג העסק, לענף ולהיקף הפעילות שלכם. פוליסה גנרית לא תספק מענה אמיתי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מתמחים בהתאמת ביטוח עסקי מדויק. נבין את הצרכים הייחודיים של העסק שלכם, נשווה הצעות מכל חברות הביטוח, ונבנה חבילת כיסוי שמגנה על העסק בלי שתשלמו על דברים שאתם לא צריכים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח אחריות מקצועית לביטוח צד שלישי?</h3>
                  <p className="text-muted-foreground">ביטוח אחריות מקצועית מכסה נזקים שנגרמו כתוצאה מטעות מקצועית או רשלנות בשירות, בעוד ביטוח צד שלישי מכסה נזקי גוף ורכוש שנגרמו לאחרים בשטח העסק או כתוצאה מפעילותו.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח חבות מעסיקים הוא חובה?</h3>
                  <p className="text-muted-foreground">כן, על פי חוק כל מעסיק בישראל חייב בביטוח חבות מעסיקים. הביטוח מכסה תביעות עובדים בגין נזקי גוף שנגרמו במהלך העבודה או כתוצאה ממנה.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה זה ביטוח אובדן רווחים?</h3>
                  <p className="text-muted-foreground">ביטוח אובדן רווחים מפצה את העסק על הכנסות שאבדו בעקבות אירוע מבוטח, כמו שריפה שגרמה להשבתת העסק. הביטוח מכסה הוצאות קבועות ואובדן רווח למשך תקופת השיקום.</p>
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
              insuranceType="business"
              title="הצטרפות לביטוח עסקי"
              description="מלאו את פרטי העסק ונחזור אליכם עם הצעה מותאמת"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessInsurance;
