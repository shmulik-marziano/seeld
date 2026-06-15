import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, Award, Shield, Heart, Briefcase, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import { usePageMeta } from "@/hooks/usePageMeta";

const Authors = () => {
  usePageMeta("הכותבים שלנו");
  const specialties = [
    { icon: Shield, title: "ביטוח כללי", description: "ביטוחי בריאות, חיים, רכב, דירה, עסקי ונסיעות" },
    { icon: TrendingUp, title: "חיסכון ופנסיה", description: "קרנות פנסיה, קופות גמל, קרנות השתלמות והשקעות" },
    { icon: Heart, title: "ביטוח סיעודי", description: "תכנון כיסוי סיעודי מותאם אישית למבוגרים ומשפחות" },
    { icon: Users, title: "תכנון פיננסי למשפחות", description: "ליווי מקיף לתכנון כלכלי בכל שלבי החיים" },
    { icon: Briefcase, title: "ביטוח עסקי", description: "פתרונות ביטוח מקיפים לעסקים קטנים וגדולים" },
    { icon: Award, title: "מיצוי זכויות", description: "איתור כספים אבודים והחזרי מס" },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="mb-16 text-center space-y-6 relative">
          <div className="absolute top-0 left-8 hidden lg:block">
            <DoodleDecoration type="handshake" size="lg" className="opacity-25 rotate-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            הסוכן שלכם
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            ליווי אישי ומקצועי בתחומי הפיננסים והביטוח
          </p>
        </div>

        {/* Agent Card */}
        <ScrollReveal>
          <div className="rounded-3xl bg-card p-8 md:p-12 mb-16 border border-border">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-5xl font-bold text-primary">שמ</span>
              </div>
              <div className="flex-1 text-center md:text-right">
                <h2 className="text-3xl font-bold mb-2">שמוליק מרציאנו</h2>
                <p className="text-primary font-medium text-lg mb-4">סוכן ביטוח ופנסיה מוסמך</p>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mb-6">
                  שמוליק מרציאנו הוא סוכן ביטוח ופנסיה מוסמך עם ניסיון עשיר בתחום הפיננסי. 
                  מתמחה בבניית תוכניות ביטוח וחיסכון מותאמות אישית, תוך שקיפות מלאה 
                  ומחויבות לאינטרס הלקוח. מלווה לקוחות רבים בכל שלבי החיים — מתכנון פנסיוני חכם 
                  ועד הגנה ביטוחית מקיפה.
                </p>
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <a 
                    href="tel:0523097444" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary hover:bg-muted transition-all text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    052-309-7444
                  </a>
                  <a 
                    href="mailto:shmulik@seeld-ins.co.il" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary hover:bg-muted transition-all text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    אימייל
                  </a>
                  <a 
                    href="https://wa.me/972523097444" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Specialties */}
        <section className="mb-16">
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-8 text-center">תחומי התמחות</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.map((spec, index) => (
              <ScrollReveal key={spec.title} delay={index * 80}>
                <div className="rounded-2xl bg-muted p-6 hover:bg-muted/80 transition-colors h-full">
                  <spec.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-bold mb-1">{spec.title}</h3>
                  <p className="text-muted-foreground text-sm">{spec.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <ScrollReveal direction="scale">
          <section className="rounded-3xl bg-primary/5 p-8 md:p-12 text-center border border-border">
            <h2 className="text-3xl font-bold mb-4">רוצים להתחיל?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              פגישת ייעוץ ראשונית ללא עלות וללא התחייבות. בואו נכיר ונבנה יחד תוכנית מותאמת.
            </p>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-10">
                קבעו פגישה
              </Button>
            </Link>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Authors;
