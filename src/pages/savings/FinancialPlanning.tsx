import Header from "@/components/Header";
import { Target, PieChart, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const FinancialPlanning = () => {
  return (
    <div className="min-h-screen" dir="rtl">
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
              buttonHref="/contact"
            />
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
};

export default FinancialPlanning;
