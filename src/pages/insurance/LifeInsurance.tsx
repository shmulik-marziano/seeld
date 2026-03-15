import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import FeatureCard from "@/components/FeatureCard";
import { Shield, Heart, Users, Baby, FileCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import lifeImage from "@/assets/insurance-life.jpg";

const LifeInsurance = () => {
  const coverageTypes = [
    {
      category: "בסיס",
      items: [
        { title: "ביטוח חיים", description: "הגנה כלכלית ליקיריכם במקרה של פטירה", icon: Heart },
        { title: "ביטוח חיים זוגי", description: "כיסוי משותף לזוגות עם תנאים משופרים", icon: Users },
        { title: "ביטוח חיים חודשי", description: "גמישות בתשלומים עם אפשרות לשינויים", icon: FileCheck },
      ],
    },
    {
      category: "מגן משלים לילד",
      items: [
        { title: "מגן משלים לילד", description: "השלמת כיסוי לשאירים בפנסיה עבור ילדים", icon: Baby },
      ],
    },
    {
      category: "נספחים",
      items: [
        { title: "שחרור בריסק", description: "שחרור מתשלום פרמיות במקרה של נכות", icon: Shield },
        { title: "נכות תמידית", description: "פיצוי במקרה של נכות תמידית מכל סיבה", icon: AlertTriangle },
        { title: "נכות מתאונה", description: "כיסוי לנכות שנגרמה כתוצאה מתאונה", icon: AlertTriangle },
        { title: "מוות מתאונה", description: "פיצוי נוסף במקרה של מוות כתוצאה מתאונה", icon: Heart },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-4 hidden lg:block">
            <DoodleDecoration type="family" size="lg" className="opacity-25 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Heart className="w-4 h-4" />
                ביטוחי חיים
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                להגן על
                <span className="text-primary"> מי שחשוב לכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח חיים מבטיח שהמשפחה שלכם תהיה מוגנת כלכלית גם כשאתם לא שם. זו ההשקעה הכי חשובה בשקט הנפשי של כולם.
              </p>
              <div className="flex flex-wrap gap-4">
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
                src={lifeImage} 
                alt="ביטוח חיים" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why This Insurance */}
        <section className="py-16 animate-slide-up relative">
          <div className="absolute -top-4 right-0 hidden lg:block">
            <DoodleDecoration type="shield" size="md" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.1} />
          </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח חיים?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כי האנשים שאתם אוהבים ראויים להגנה גם כשאתם לא לידם
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  הגנה על המשפחה
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הבטיחו שהמשפחה שלכם תוכל להמשיך את אורח החיים שלה גם בלעדיכם
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  כיסוי משכנתא
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הבטיחו שהבית ישאר בבעלות המשפחה גם אם קורה משהו
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  עתיד הילדים
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Baby className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הבטיחו את המימון ללימודים ולעתיד של הילדים שלכם
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
              מגוון פתרונות להגנה מקסימלית
            </p>
          </div>
          <div className="space-y-12">
            {coverageTypes.map((category, catIdx) => (
              <div key={catIdx} className="animate-slide-up" style={{ animationDelay: `${catIdx * 150}ms` }}>
                <h3 className="text-2xl font-bold mb-6 text-right">{category.category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, idx) => (
                    <Card key={idx} className="text-right hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 justify-end text-lg">
                          {item.title}
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="הגנה מלאה למשפחה"
              description="ביטוח חיים מבטיח שהמשפחה שלכם תהיה מוגנת כלכלית גם כשאתם לא שם. שקט נפשי אמיתי."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="umbrella"
              buttonText="קבלו הצעה"
              buttonHref="#contact-form"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="כיסוי משכנתא"
              description="הבטיחו שהבית ישאר בבעלות המשפחה גם במקרה בלתי צפוי."
              bgColor="bg-primary/5"
              doodle="key"
            />
          </ScrollReveal>
        </section>

        {/* Enrollment Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceEnrollmentForm 
              insuranceType="life"
              title="הצטרפות לביטוח חיים"
              description="מלאו את הפרטים לקבלת הצעה מותאמת אישית"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LifeInsurance;
