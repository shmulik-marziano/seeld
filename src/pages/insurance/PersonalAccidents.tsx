import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { Shield, AlertTriangle, Bike, Mountain, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import accidentsImage from "@/assets/insurance-accidents.jpg";

const PersonalAccidents = () => {
  const coverageTypes = [
    {
      title: "ביטוח תאונות אישיות",
      description: "כיסוי מקיף לתאונות בכל מקום ובכל זמן - בבית, בעבודה או בחופשה",
      icon: Shield,
    },
    {
      title: "נכות תעסוקתית מתאונה",
      description: "פיצוי במקרה של נכות שמשפיעה על יכולת התעסוקה שלכם",
      icon: Briefcase,
    },
    {
      title: "ביטול חריג רכב דו גלגלי",
      description: "הרחבת כיסוי לתאונות עם אופנוע, אופניים חשמליים או טרקטורון",
      icon: Bike,
    },
    {
      title: "ביטול חריג ספורט אתגרי",
      description: "כיסוי לפעילויות ספורט אתגרי חובבני כמו גלישה, טיפוס ועוד",
      icon: Mountain,
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-8 hidden lg:block">
            <DoodleDecoration type="shield" size="lg" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                תאונות אישיות
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה מפני
                <span className="text-primary"> הבלתי צפוי</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                תאונות יכולות לקרות לכל אחד בכל רגע. ביטוח תאונות אישיות מעניק לכם פיצוי כספי שיעזור לכם להתמודד עם ההשלכות.
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
                src={accidentsImage} 
                alt="ביטוח תאונות אישיות" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why This Insurance */}
        <section className="py-16 animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח תאונות אישיות?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כי תאונות לא מתרחשות רק לאחרים - וטוב להיות מוכנים
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  כיסוי 24/7
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הגנה בכל שעות היממה, בכל מקום בעולם - בבית, בעבודה או בחופשה
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  פיצוי מהיר
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  תהליך תביעות פשוט ומהיר כדי שתקבלו את הכסף כשאתם צריכים אותו
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  פרמיה נמוכה
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  עלות חודשית נמוכה עבור שקט נפשי ובטחון כלכלי מלא
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
              כיסויים מותאמים לאורח החיים שלכם
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
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
              title="הגנה 24/7 בכל מקום"
              description="כיסוי מקיף לתאונות בבית, בעבודה, בחופשה ובספורט — שקט נפשי בכל רגע."
              bgColor="bg-accent/10"
              doodle="umbrella"
            />
          </ScrollReveal>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceContactForm 
              insuranceType="ביטוח תאונות אישיות"
              title="מעוניינים בביטוח תאונות אישיות?"
              subtitle="השאירו פרטים ונחזור אליכם עם הצעה מותאמת אישית"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PersonalAccidents;
