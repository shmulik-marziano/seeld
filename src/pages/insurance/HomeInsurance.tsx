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
              <div className="flex flex-wrap gap-4">
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
