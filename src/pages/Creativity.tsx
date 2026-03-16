import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Car, Shield, FileCheck, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const Creativity = () => {
  const insuranceTypes = [
    { icon: Car, title: "ביטוח רכב", description: "ביטוח חובה, מקיף וצד ג' - כל מה שהרכב שלך צריך", features: ["ביטוח חובה", "ביטוח מקיף", "צד ג'", "נזקי גוף"], href: "/insurance/vehicle" },
    { icon: Shield, title: "ביטוח דירה", description: "הגנה מלאה על הבית והתכולה מפני כל סיכון", features: ["ביטוח מבנה", "ביטוח תכולה", "צד ג'", "נזקי טבע"], href: "/insurance/home" },
    { icon: FileCheck, title: "ביטוח עסק", description: "פתרונות ביטוח מקיפים לעסק בכל גודל", features: ["אחריות מקצועית", "רכוש עסקי", "הפסד הכנסות", "חבות מעסיקים"], href: "/insurance/business" },
    { icon: Calculator, title: "ביטוח נסיעות", description: "נסיעה לחו\"ל בראש שקט עם כיסוי מלא", features: ["הוצאות רפואיות", "ביטול טיסה", "אובדן מזוודות", "חירום 24/7"], href: "/insurance/travel" },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            ביטוח רכוש ורכב
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            הגנו על הנכסים החשובים לכם עם פוליסות ביטוח מותאמות אישית. 
            השוו הצעות מחיר מחברות הביטוח המובילות וחסכו אלפי שקלים בשנה.
          </p>
          <Link to="/contact">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-6 text-lg hover:scale-105 transition-all animate-slide-up stagger-2">
              להצטרפות ל-SeelD
            </Button>
          </Link>
        </div>

        {/* Insurance Types Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insuranceTypes.map((type, index) => (
              <Link to={type.href} key={type.title} className="group">
                <div className={`rounded-2xl bg-card p-6 border border-border hover:shadow-lg transition-all hover:scale-[1.02] h-full animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
                  <type.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                  <ul className="space-y-1">
                    {type.features.map((feature) => (
                      <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16 rounded-[2.5rem] bg-muted p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-8 text-center">למה לבחור ב-SeelD?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">מגוון</div>
              <p className="text-muted-foreground">חברות ביטוח להשוואה</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">30%</div>
              <p className="text-muted-foreground">חיסכון ממוצע ללקוחות</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">שירות ותמיכה</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-[2.5rem] bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">מוכנים לחסוך על הביטוח?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            מלאו את הפרטים ונציג יחזור אליכם עם הצעות מחיר מותאמות אישית תוך שעות
          </p>
          <Link to="/contact">
            <Button variant="secondary" className="rounded-full px-10 py-6 text-lg hover:scale-105 transition-all">
              התחילו עכשיו
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creativity;
