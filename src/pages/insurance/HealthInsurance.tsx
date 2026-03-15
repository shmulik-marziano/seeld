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

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה ביטוח בריאות פרטי חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                מערכת הבריאות הציבורית בישראל מספקת שירותים בסיסיים, אך לעיתים קרובות זמני ההמתנה ארוכים, הבחירה ברופא מוגבלת, ותרופות חדשניות אינן כלולות בסל הבריאות. ביטוח בריאות פרטי מאפשר לכם לקבל את הטיפול הרפואי הטוב ביותר בזמן הנכון, עם גישה לרופאים מומחים, טכנולוגיות מתקדמות ותרופות שאינן בסל.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                במקרה של מחלה או ניתוח, ביטוח בריאות פרטי יכול לחסוך לכם חודשים של המתנה ולהעניק לכם שליטה מלאה על הטיפול שלכם. מדובר בהשקעה בבריאות שלכם ושל משפחתכם, שמשתלמת במיוחד ברגעי האמת.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש ביטוח בריאות?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                התשובה הקצרה היא: כמה שיותר מוקדם, יותר טוב. ככל שמצטרפים בגיל צעיר יותר, הפרמיה החודשית נמוכה יותר ותנאי הקבלה קלים יותר. חשוב במיוחד לרכוש ביטוח בריאות לפני שמתפתחות בעיות רפואיות, מכיוון שמצב רפואי קיים עלול להוביל לחריגים בפוליסה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ לרכוש ביטוח בריאות בשלבי חיים משמעותיים: כניסה לשוק העבודה, לידת ילד ראשון, או מעבר לגיל 40. אלו הרגעים שבהם הצורך בכיסוי רפואי איכותי הופך לקריטי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת לפני שרוכשים?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח בריאות, חשוב לשים לב למספר נקודות מפתח: תקופת אכשרה (תקופת המתנה לפני שניתן לממש את הביטוח), חריגים בפוליסה, גובה ההשתתפות העצמית, ורשת הרופאים והמוסדות הרפואיים הזמינים. השוואה בין חברות ביטוח יכולה לחסוך מאות שקלים בחודש תוך שמירה על כיסוי מקיף.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו משווים עבורכם בין כל חברות הביטוח המובילות ומוצאים את הפוליסה המתאימה ביותר לצרכים ולתקציב שלכם, ללא עלות נוספת.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח בריאות פרטי מחליף את קופת החולים?</h3>
                  <p className="text-muted-foreground">לא. ביטוח בריאות פרטי משלים את השירותים של קופת החולים ומעניק כיסוי לטיפולים, תרופות וניתוחים שאינם כלולים בסל הבריאות הממלכתי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מהי תקופת אכשרה?</h3>
                  <p className="text-muted-foreground">תקופת אכשרה היא פרק זמן (בדרך כלל 3-12 חודשים) מרגע הצטרפות לביטוח ועד שניתן לממש את הכיסוי. תקופה זו משתנה בין חברות ובין סוגי כיסויים.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר לבטח את כל המשפחה?</h3>
                  <p className="text-muted-foreground">בהחלט. רוב חברות הביטוח מציעות פוליסות משפחתיות במחיר מוזל, הכוללות כיסוי להורים ולילדים תחת פוליסה אחת.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Companies Section */}
        <section className="py-16 bg-muted/20 rounded-3xl my-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-[#0a3d3d]">חברות שאנחנו משווקים</h2>
              <p className="text-lg text-muted-foreground">אנחנו עובדים עם חברות הביטוח המובילות בישראל כדי להביא לכם את ההצעה הטובה ביותר</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {["הפניקס", "מגדל", "הראל", "כלל", "מנורה מבטחים", "איילון", "הכשרה", "ביטוח ישיר", "שלמה ביטוח", "AIG", "ליברה"].map((company) => (
                <span key={company} className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-[#5ec6c6]/30 shadow-sm hover:shadow-md hover:border-[#5ec6c6] transition-all">
                  {company}
                </span>
              ))}
            </div>
          </div>
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
