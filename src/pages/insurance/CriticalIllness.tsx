import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { Shield, HeartPulse, Baby, Users, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import criticalImage from "@/assets/insurance-critical.jpg";

const CriticalIllness = () => {
  const coverageTypes = [
    {
      title: "ביטוח מחלות קשות",
      description: "כיסוי כספי למקרה של אבחון מחלה קשה כגון סרטן, התקף לב, שבץ מוחי ועוד",
      icon: HeartPulse,
    },
    {
      title: "מענקית זהב לילד",
      description: "ביטוח מחלות קשות המיועד לילדים עם פיצוי כספי מיידי",
      icon: Baby,
    },
    {
      title: "מענקית לסרטן – עד גיל 64",
      description: "כיסוי ממוקד למחלת הסרטן עם פיצוי כספי גבוה למבוגרים עד גיל 64",
      icon: Shield,
    },
    {
      title: "מענקית לסרטן – מגיל 65",
      description: "כיסוי מותאם לגיל הזהב עם תנאים מיוחדים למבוטחים מגיל 65",
      icon: Users,
    },
    {
      title: "מענקית לסרטן – עד גיל 18",
      description: "הגנה מיוחדת לילדים ונוער עם כיסוי מקיף למחלת הסרטן",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute bottom-12 left-4 hidden lg:block">
            <DoodleDecoration type="family" size="md" className="opacity-20 -rotate-6" parallax parallaxSpeed={0.12} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <HeartPulse className="w-4 h-4" />
                מחלות קשות
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                ביטחון כלכלי
                <span className="text-primary"> ברגעים הקשים</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח מחלות קשות מעניק לכם פיצוי כספי מיידי בעת אבחון מחלה קשה, כך שתוכלו להתמקד בהחלמה ולא בדאגות כלכליות.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#contact-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  להצטרפות ל-SeelD
                </a>
                <a href="#coverage" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  סוגי כיסויים
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <img 
                src={criticalImage} 
                alt="ביטוח מחלות קשות" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why This Insurance */}
        <section className="py-16 animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח מחלות קשות?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כי המחלה עצמה מספיק קשה - אל תתנו לדאגות הכספיות להכביד
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  פיצוי מיידי
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  קבלו סכום כסף חד-פעמי מיד עם אבחון המחלה, ללא צורך בהמתנה
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  שימוש חופשי
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הכסף שלכם - השתמשו בו לכל מטרה: טיפולים, החלמה, או תמיכה במשפחה
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  כיסוי רחב
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  כיסוי למגוון רחב של מחלות קשות כולל סרטן, התקף לב, שבץ ועוד
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Coverage Types */}
        <section id="coverage" className="py-16 scroll-mt-24">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">סוגי הכיסויים</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              פתרונות מותאמים לכל גיל ולכל צורך
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverageTypes.map((coverage, idx) => (
              <Card key={idx} className="text-right hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 justify-end">
                    {coverage.title}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <coverage.icon className="w-5 h-5 text-primary" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{coverage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="ביטחון כלכלי ברגע האמת"
              description="קבלו מענק כספי חד-פעמי שיאפשר לכם להתמקד בהחלמה ולא בדאגות כלכליות."
              bgColor="bg-primary/5"
              doodle="shield"
            />
          </ScrollReveal>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceContactForm 
              insuranceType="ביטוח מחלות קשות"
              title="מעוניינים בביטוח מחלות קשות?"
              subtitle="השאירו פרטים ונחזור אליכם עם הצעה מותאמת אישית"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CriticalIllness;
