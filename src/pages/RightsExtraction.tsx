import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, CheckCircle, FileText, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const RightsExtraction = () => {
  const rights = [
    {
      title: "החזרי מס הכנסה",
      description: "בדקו האם מגיעים לכם החזרי מס עבור 6 שנים אחורה",
      icon: FileText,
    },
    {
      title: "קצבאות ביטוח לאומי",
      description: "מיצוי זכויות לקצבת נכות, זקנה, ילדים ועוד",
      icon: Users,
    },
    {
      title: "הטבות מס לעצמאים",
      description: "ניכויים והקלות מס לבעלי עסקים",
      icon: CheckCircle,
    },
    {
      title: "זכויות פנסיוניות",
      description: "איתור קופות אבודות וכספים שלא ידעתם עליהם",
      icon: Search,
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            מיצוי זכויות
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            גלו את כל הזכויות וההטבות שמגיעות לכם מהמדינה, מביטוח לאומי ומרשויות המס.
            אנחנו נעזור לכם למצות את מלוא הזכויות שלכם.
          </p>
        </div>

        {/* Rights Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rights.map((right, index) => (
              <ScrollReveal key={right.title} delay={index * 100}>
                <div className="rounded-2xl bg-card p-8 border border-border hover:shadow-lg transition-all hover:scale-[1.02]">
                  <right.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{right.title}</h3>
                  <p className="text-muted-foreground mb-6">{right.description}</p>
                  <Link to="/contact">
                    <Button variant="outline" className="rounded-full group">
                      בדוק זכאות
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="rounded-[2.5rem] bg-muted p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">איך זה עובד?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold mb-2">מלאו פרטים</h3>
              <p className="text-muted-foreground text-sm">ענו על מספר שאלות קצרות</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold mb-2">נבדוק עבורכם</h3>
              <p className="text-muted-foreground text-sm">המערכת תסרוק את הזכויות המגיעות לכם</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold mb-2">קבלו דוח</h3>
              <p className="text-muted-foreground text-sm">תקבלו רשימת זכויות והמלצות לפעולה</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
