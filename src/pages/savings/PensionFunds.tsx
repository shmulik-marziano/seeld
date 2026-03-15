import Header from "@/components/Header";
import { PiggyBank, TrendingUp, Shield, Users, CheckCircle, Calculator, FileText, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PensionFunds = () => {
  const pensionTypes = [
    {
      title: "פנסיה מקיפה חדשה",
      description: "קרן פנסיה המשלבת חיסכון, ביטוח נכות וביטוח שאירים",
      features: ["תשואות מנוהלות", "כיסוי אובדן כושר עבודה", "פנסיית שאירים"],
    },
    {
      title: "פנסיה כללית",
      description: "מסלול חיסכון בלבד ללא רכיבים ביטוחיים",
      features: ["תשואות גבוהות יותר", "גמישות מקסימלית", "דמי ניהול נמוכים"],
    },
    {
      title: "פנסיה משלימה",
      description: "הפקדות נוספות מעבר לחובה לשיפור הפנסיה",
      features: ["הטבות מס", "הגדלת הקצבה", "חיסכון לטווח ארוך"],
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-4 hidden lg:block">
            <DoodleDecoration type="savings" size="lg" className="opacity-25 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="absolute bottom-0 right-4 hidden lg:block">
            <DoodleDecoration type="growth" size="md" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.1} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <PiggyBank className="w-4 h-4" />
                קרנות פנסיה
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                תכננו את
                <span className="text-primary"> העתיד הפנסיוני</span> שלכם
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                קרן פנסיה היא מכשיר חיסכון ארוך טווח המבטיח לכם הכנסה חודשית קבועה לאחר הפרישה. עם הייעוץ המקצועי שלנו, תבחרו את הקרן המתאימה ביותר.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#analysis-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  ניתוח תיק פנסיוני חינם
                </a>
                <a href="#pension-types" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  סוגי פנסיה
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <PiggyBank className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Benefits */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">יתרונות קרן הפנסיה</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">תשואות מנוהלות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  הכספים מנוהלים על ידי מנהלי השקעות מקצועיים
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">כיסויים ביטוחיים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  פנסיית נכות ושאירים להגנה על המשפחה
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">הטבות מס</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  זיכוי מס והפחתת הכנסה חייבת במס
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">ליווי מקצועי</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  צוות יועצים מנוסה לבחירת המסלול המתאים
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pension Types */}
        <section id="pension-types" className="py-16 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">סוגי קרנות פנסיה</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              הכירו את האפשרויות השונות ובחרו את המסלול המתאים לכם
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pensionTypes.map((type, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="מומחיות מוכחת"
              description="יועצים בעלי ניסיון של עשרות שנים בתחום הפנסיה — ליווי מקצועי בכל שלב."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="lightbulb"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="מיקסום התשואות שלכם"
              description="נעזור לכם לבחור את מסלולי ההשקעה שיניבו את התשואות הגבוהות ביותר."
              bgColor="bg-primary/5"
              doodle="charts"
              buttonText="ניתוח חינם"
              buttonHref="#analysis-form"
            />
          </ScrollReveal>
        </section>

        {/* Analysis Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm 
              focusArea="pension"
              title="ניתוח תיק פנסיוני חינם"
              description="הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionFunds;
