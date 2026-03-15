import Header from "@/components/Header";
import { Baby, Gift, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const ChildSavings = () => {
  return (
    <div className="min-h-screen" dir="rtl">
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
              buttonHref="/contact"
            />
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
};

export default ChildSavings;
