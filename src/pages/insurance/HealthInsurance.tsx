import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import FeatureCard from "@/components/FeatureCard";
import { Shield, Heart, Stethoscope, Pill, Building2, FileCheck } from "lucide-react";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import healthImage from "@/assets/insurance-health.jpg";

const HealthInsurance = () => {
  const coverageTypes = [
    {
      title: "בסיס",
      icon: Shield,
      items: [
        "תרופות מחוץ לסל הבריאות",
        "השתלות וטיפולים מיוחדים מחוץ לישראל",
        "ניתוחים וטיפולים מחליפי ניתוח מחוץ לישראל",
      ],
    },
    {
      title: "ניתוחים בארץ",
      icon: Building2,
      items: [
        "משלים שב\"ן ללא השתתפות עצמית",
        "שקל ראשון",
        "משלים שב\"ן עם השתתפות עצמית 5,000 ₪",
      ],
    },
    {
      title: "ייעוץ ובדיקות",
      icon: Stethoscope,
      items: [
        "ייעוץ ובדיקות בסיס",
        "ייעוץ ובדיקות מורחב",
      ],
    },
    {
      title: "הרחבות",
      icon: Pill,
      items: [
        "אבחון רפואי מהיר",
        "טיפולים בטכנולוגיות מתקדמות ואביזרים רפואיים",
        "טיפולים ואבחונים לילד",
        "ליווי רפואי וטיפולים אגב אירוע רפואי משמעותי",
      ],
    },
    {
      title: "כתבי שירות",
      icon: FileCheck,
      items: [
        "רפואה אישית און ליין פלוס",
        "רפואה משלימה",
        "ביקור רופא בבית",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-12 left-8 hidden lg:block">
            <DoodleDecoration type="shield" size="lg" className="opacity-25 rotate-12" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Heart className="w-4 h-4" />
                ביטוחי בריאות
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה מקיפה על
                <span className="text-primary"> הבריאות שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח בריאות פרטי מעניק לכם גישה לטיפולים הטובים ביותר, רופאים מומחים וזמני המתנה קצרים - כל זאת בתנאים הכי משתלמים עבורכם.
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
                src={healthImage} 
                alt="ביטוח בריאות" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why Health Insurance */}
        <section className="py-16 animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח בריאות פרטי?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ביטוח בריאות פרטי מספק לכם את השקט הנפשי לדעת שבכל מצב רפואי, תקבלו את הטיפול הטוב ביותר
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  זמני המתנה קצרים
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  קבלו גישה מהירה לרופאים מומחים ובדיקות מתקדמות ללא תורים ארוכים
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  בחירת רופא
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  בחרו את הרופא המנתח או המטפל שאתם רוצים, מבלי להתפשר
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  כיסוי מקיף
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  כיסוי לתרופות, ניתוחים, בדיקות וטיפולים שאינם כלולים בסל הבריאות
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Coverage Types */}
        <section id="coverage" className="py-16 scroll-mt-24 relative">
          <div className="absolute top-0 right-4 hidden lg:block">
            <DoodleDecoration type="handshake" size="md" className="opacity-20 -rotate-6" parallax parallaxSpeed={0.1} />
          </div>
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">סוגי הכיסויים</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              מגוון רחב של כיסויים המותאמים לצרכים שלכם
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
                  <ul className="space-y-2">
                    {coverage.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-muted-foreground text-sm flex items-start gap-2 justify-end">
                        {item}
                        <span className="text-primary mt-1">•</span>
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
              title="כיסוי מקיף לרפואה"
              description="גישה לרופאים מומחים, ניתוחים, תרופות וטכנולוגיות מתקדמות — הכל בתנאים הטובים ביותר."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="lightbulb"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="ייעוץ אישי בבחירת ביטוח"
              description="נעזור לכם לבחור את הכיסוי המתאים ביותר לצרכים ולתקציב שלכם."
              bgColor="bg-accent/10"
              doodle="target"
              buttonText="דברו איתנו"
              buttonHref="/contact"
            />
          </ScrollReveal>
        </section>

        {/* Enrollment Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceEnrollmentForm 
              insuranceType="health"
              title="הצטרפות לביטוח בריאות"
              description="מלאו את הפרטים לקבלת הצעה מותאמת אישית"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HealthInsurance;
