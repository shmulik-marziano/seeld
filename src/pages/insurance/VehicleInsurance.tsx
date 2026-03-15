import Header from "@/components/Header";
import { Car, Shield, FileText, CheckCircle } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const VehicleInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-16 left-4 hidden lg:block">
            <DoodleDecoration type="shield" size="lg" className="opacity-20 -rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Car className="w-4 h-4" />
                ביטוח רכב
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה מקיפה על
                <span className="text-primary"> הרכב שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח רכב מותאם אישית לצרכים שלכם - מביטוח חובה ועד כיסוי מקיף הכולל גניבה, תאונות ונזקי טבע.
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
                <Car className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Coverage Types */}
        <section id="coverage" className="py-16 scroll-mt-24">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">סוגי הביטוח</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              בחרו את הכיסוי המתאים ביותר לרכב ולצרכים שלכם
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  ביטוח מקיף
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  כיסוי מלא לנזקי הרכב שלכם כולל גניבה, תאונות ונזקי טבע
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> גניבה מלאה וחלקית</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> נזקי תאונה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> נזקי אש ופיצוץ</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> נזקי טבע</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  ביטוח חובה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  ביטוח חובה לפי חוק המכסה נזקי גוף לנוסעים ברכב
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> כיסוי נזקי גוף</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> חובה על פי חוק</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> תוקף שנתי</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  ביטוח צד ג׳
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  כיסוי לנזקים שנגרמו לרכב של צד שלישי או לרכוש
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> נזק לרכב אחר</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> נזק לרכוש</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> הגנה משפטית</li>
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
            <FeatureCard title="שירות מהיר" description="הצעת מחיר תוך 24 שעות מכל חברות הביטוח המובילות" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="handshake" />
            <FeatureCard title="ליווי בתביעות" description="צוות מקצועי שילווה אתכם בכל תהליך התביעה מול חברת הביטוח" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="shield" />
            <FeatureCard title="חיסכון מוכח" description="חוסכים לכם עד 30% בפרמיה בזכות השוואה בין חברות הביטוח" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="savings" />
            <FeatureCard title="ייעוץ אישי" description="סוכן ביטוח מנוסה שמתאים לכם את הכיסוי המושלם" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="lightbulb" />
          </div>
        </section>

        {/* Enrollment Form */}
        <section id="enrollment-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceEnrollmentForm 
              insuranceType="vehicle"
              title="להצטרפות ל-SeelD – ביטוח רכב"
              description="מלאו את הפרטים ונחזור אליכם עם ההצעה המשתלמת ביותר"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VehicleInsurance;
