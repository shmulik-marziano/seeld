import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { Home, Shield, Heart, Percent, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mortgageImage from "@/assets/insurance-mortgage.jpg";

const MortgageInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-12 left-4 hidden lg:block">
            <DoodleDecoration type="savings" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Home className="w-4 h-4" />
                ביטוח משכנתא
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנו על
                <span className="text-primary"> הבית שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח חיים למשכנתא מבטיח שהמשפחה שלכם תישאר בבית גם אם קורה משהו. הדרך הטובה ביותר להגן על ההשקעה הגדולה ביותר שלכם.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#contact-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  להצטרפות ל-SeelD
                </a>
                <a href="#info" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  למידע נוסף
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <img 
                src={mortgageImage} 
                alt="ביטוח משכנתא" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why This Insurance */}
        <section className="py-16 animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח חיים למשכנתא?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כי הבית שלכם שווה הגנה - גם כשאתם לא שם
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  פירעון המשכנתא
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  במקרה של פטירה, הביטוח מכסה את יתרת המשכנתא והבית עובר למשפחה ללא חובות
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  דרישת הבנק
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הבנקים דורשים ביטוח חיים כתנאי למשכנתא - אבל לא חייבים לקחת דרכם
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  חיסכון בפרמיה
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ביטוח דרך סוכן עצמאי יכול לחסוך לכם אלפי שקלים לאורך תקופת המשכנתא
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Info Section */}
        <section id="info" className="py-16 scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">ביטוח חיים למשכנתא</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ביטוח חיים למשכנתא הוא ביטוח ריסק (זמני) שמטרתו להבטיח שבמקרה של פטירת הלווה, 
                יתרת המשכנתא תסולק והנכס יישאר בידי המשפחה ללא חובות.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">סכום הביטוח יורד בהתאם ליתרת המשכנתא</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">ניתן לבחור ביטוח עם סכום קבוע או יורד</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">אפשרות להוסיף כיסוי לאובדן כושר עבודה</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">ניתן להעביר ביטוח קיים מהבנק לחברת ביטוח</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="p-8 text-right animate-scale-in">
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-center">האם אתם משלמים יותר מדי?</h3>
                <p className="text-muted-foreground text-center">
                  רבים משלמים על ביטוח משכנתא דרך הבנק מחירים גבוהים משמעותית. 
                  בדיקה פשוטה יכולה לחסוך לכם אלפי שקלים.
                </p>
                <a
                  href="#contact-form"
                  className="block w-full text-center px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all"
                >
                  בדקו את המחיר שלכם
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="חסכו אלפים בביטוח משכנתא"
              description="העברת ביטוח משכנתא מהבנק לחברת ביטוח חיצונית יכולה לחסוך לכם סכומים משמעותיים."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="pension"
              buttonText="בדקו עכשיו"
              buttonHref="#contact-form"
            />
          </ScrollReveal>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceContactForm 
              insuranceType="ביטוח משכנתא"
              title="רוצים לחסוך בביטוח המשכנתא?"
              subtitle="השאירו פרטים ונבדוק אם אפשר להוזיל לכם את העלויות"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MortgageInsurance;
