import Header from "@/components/Header";
import { Wallet, TrendingUp, Shield, Calculator, CheckCircle, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const GemelFunds = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-8 hidden lg:block">
            <DoodleDecoration type="savings" size="lg" className="opacity-25 rotate-12" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Wallet className="w-4 h-4" />
                קופות גמל
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                גמישות מקסימלית
                <span className="text-primary"> בחיסכון שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#analysis-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  ניתוח קופות גמל חינם
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <Wallet className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Benefits */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">יתרונות קופת גמל</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  ניהול מקצועי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  ניהול השקעות על ידי גופים מובילים בשוק ההון
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> מנהלי השקעות מנוסים</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פיזור סיכונים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  גמישות מלאה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  בחירה בין משיכה הונית לקצבה
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> סכום חד פעמי</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> קצבה חודשית</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  הטבות מס
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  חיסכון משמעותי במס
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> זיכוי מס על הפקדות</li>
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> פטור ממס רווחי הון</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="גמישות בחיסכון שלכם"
              description="קופת גמל מאפשרת בחירה בין משיכה הונית לקצבה חודשית — ההחלטה בידיכם."
              bgColor="bg-primary/5"
              doodle="pension"
              buttonText="ניתוח חינם"
              buttonHref="#analysis-form"
            />
          </ScrollReveal>
        </section>

        {/* Analysis Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm 
              focusArea="savings"
              title="ניתוח קופות גמל"
              description="הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GemelFunds;
