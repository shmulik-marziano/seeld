import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Shield, AlertTriangle, Users, Home, Handshake, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

import healthImage from "@/assets/insurance-health.jpg";
import criticalImage from "@/assets/insurance-critical.jpg";
import accidentsImage from "@/assets/insurance-accidents.jpg";
import lifeImage from "@/assets/insurance-life.jpg";
import mortgageImage from "@/assets/insurance-mortgage.jpg";
import partnersImage from "@/assets/insurance-partners.jpg";

interface InsuranceCategory {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  icon: React.ReactNode;
  highlights: string[];
}

const insuranceCategories: InsuranceCategory[] = [
  {
    id: "health",
    title: "ביטוחי בריאות",
    description: "כיסוי מקיף לטיפולים רפואיים, ניתוחים, תרופות ובדיקות מתקדמות",
    href: "/insurance/health",
    image: healthImage,
    icon: <Heart className="h-6 w-6" />,
    highlights: ["ניתוחים בארץ ובחו״ל", "תרופות מחוץ לסל", "ייעוץ ובדיקות"],
  },
  {
    id: "critical",
    title: "מחלות קשות",
    description: "הגנה כלכלית במקרה של אבחון מחלה קשה עם מענק כספי חד פעמי",
    href: "/insurance/critical-illness",
    image: criticalImage,
    icon: <Shield className="h-6 w-6" />,
    highlights: ["מענק חד פעמי", "כיסוי מגוון מחלות", "ללא תלות בהוצאות"],
  },
  {
    id: "accidents",
    title: "תאונות אישיות",
    description: "פיצוי במקרה של פגיעה או נכות כתוצאה מתאונה",
    href: "/insurance/accidents",
    image: accidentsImage,
    icon: <AlertTriangle className="h-6 w-6" />,
    highlights: ["כיסוי 24/7", "נכות תעסוקתית", "הרחבות לספורט"],
  },
  {
    id: "life",
    title: "ביטוחי חיים",
    description: "הבטחת עתיד המשפחה עם כיסוי למקרה מוות ונכות",
    href: "/insurance/life",
    image: lifeImage,
    icon: <Users className="h-6 w-6" />,
    highlights: ["ביטוח חיים זוגי", "שחרור מפרמיה", "כיסוי נכות"],
  },
  {
    id: "mortgage",
    title: "ביטוח משכנתא",
    description: "הגנה על הבית והמשפחה במקרה של פטירה או אובדן כושר עבודה",
    href: "/insurance/mortgage",
    image: mortgageImage,
    icon: <Home className="h-6 w-6" />,
    highlights: ["כיסוי יתרת משכנתא", "פרמיה יורדת", "התאמה אישית"],
  },
  {
    id: "partners",
    title: "ריסק שותפים",
    description: "הגנה על העסק והשותפים במקרה של פטירת אחד השותפים",
    href: "/insurance/partners",
    image: partnersImage,
    icon: <Handshake className="h-6 w-6" />,
    highlights: ["הגנה על העסק", "רכישת מניות", "המשכיות עסקית"],
  },
];

const InsuranceCategoryCard = ({ category, index }: { category: InsuranceCategory; index: number }) => {
  return (
    <ScrollReveal delay={index * 100}>
      <Link to={category.href} className="group block">
        <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50">
          <div className="relative h-48 overflow-hidden">
            <img
              src={category.image}
              alt={category.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white">
              <div className="p-2 bg-primary/90 rounded-lg backdrop-blur-sm">
                {category.icon}
              </div>
              <h3 className="text-xl font-bold">{category.title}</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {category.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {category.highlights.map((highlight, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {highlight}
                </span>
              ))}
            </div>
            <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
              <span>למידע נוסף</span>
              <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </ScrollReveal>
  );
};

const Insurances = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 animate-fade-in relative">
          <div className="absolute top-0 left-8 hidden lg:block">
            <DoodleDecoration type="shield" size="lg" className="opacity-30 rotate-6" parallax parallaxSpeed={0.15} />
          </div>
          <div className="absolute bottom-0 right-8 hidden lg:block">
            <DoodleDecoration type="family" size="md" className="opacity-30 -rotate-6" parallax parallaxSpeed={0.1} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            <span>מגוון פתרונות ביטוח</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            מוצרי ביטוח
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            סקירה מקיפה של כל סוגי הביטוחים והכיסויים הזמינים עבורכם. 
            בחרו את הקטגוריה המתאימה לכם וקבלו מידע מפורט.
          </p>
        </section>

        <LogoDotsDivider />

        {/* Insurance Categories Grid */}
        <section className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceCategories.map((category, index) => (
              <InsuranceCategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="my-16 space-y-6">
          <ScrollReveal>
            <div className="rounded-3xl bg-[hsl(var(--muted))] p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
              <div className="flex-1 space-y-3 z-10 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">ייעוץ מקצועי</h3>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-lg">
                  צוות מומחים מנוסה שמלווה אתכם בבחירת הביטוח המושלם עם התאמה אישית לצרכים שלכם.
                </p>
                <a href="/contact" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 border border-foreground/30 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors">
                  קבעו פגישה
                </a>
              </div>
              <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 order-first sm:order-last">
                <DoodleDecoration type="lightbulb" size="xl" className="!w-full !h-full opacity-60" />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="rounded-3xl bg-primary/5 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
              <div className="flex-1 space-y-3 z-10 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">הגנה מלאה למשפחה</h3>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-lg">
                  כיסוי ביטוחי מקיף שמגן עליכם ועל יקיריכם בכל תרחיש — מבריאות ועד רכוש.
                </p>
                <a href="/insurance/life" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 border border-foreground/30 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors">
                  למידע נוסף
                </a>
              </div>
              <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 order-first sm:order-last">
                <DoodleDecoration type="umbrella" size="xl" className="!w-full !h-full opacity-60" />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="rounded-3xl bg-accent/10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
              <div className="flex-1 space-y-3 z-10 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">ליווי בתביעות</h3>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-lg">
                  תמיכה מלאה בעת הגשת תביעות ומימוש הזכויות שלכם — אנחנו איתכם בכל שלב.
                </p>
                <a href="/rights-extraction" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 border border-foreground/30 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors">
                  מיצוי זכויות
                </a>
              </div>
              <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 order-first sm:order-last">
                <DoodleDecoration type="key" size="xl" className="!w-full !h-full opacity-60" />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* CTA Section */}
        <ScrollReveal direction="scale">
          <section className="my-16 rounded-[2.5rem] bg-card p-12 text-center border border-border relative overflow-hidden">
            <div className="absolute top-4 left-4 hidden md:block">
              <DoodleDecoration type="savings" size="sm" className="opacity-20 rotate-12" parallax parallaxSpeed={0.08} />
            </div>
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold">רוצים לדעת יותר?</h2>
              <p className="text-lg text-muted-foreground">
                צרו קשר עם הסוכנים שלנו לקבלת הצעת מחיר מותאמת אישית
              </p>
              <Link to="/contact">
                <Button size="lg" className="rounded-full px-10">
                  צור קשר
                </Button>
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Insurances;
