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
