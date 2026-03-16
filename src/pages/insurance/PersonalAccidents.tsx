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

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                תאונות הן אחד הגורמים המובילים לאשפוז ולנכות בישראל. תאונות דרכים, נפילות, תאונות ספורט ותאונות עבודה קורות כל יום — ולכל אחד מאיתנו. ההשלכות הכלכליות יכולות להיות כבדות: אובדן הכנסה, הוצאות רפואיות, שיקום, ולעתים נכות ארוכת טווח.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח תאונות אישיות מעניק לכם רשת ביטחון כלכלית 24 שעות ביממה, 7 ימים בשבוע — בבית, בעבודה, בחופשה ובכל מקום בעולם. הפיצוי הכספי מאפשר לכם להתמקד בהחלמה מבלי לדאוג לצד הכלכלי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח תאונות אישיות רלוונטי לכל גיל ולכל אורח חיים. הוא חשוב במיוחד לאנשים פעילים, רוכבי אופניים חשמליים או אופנועים, ספורטאים חובבנים, עובדים בתחומים עם סיכון מוגבר, והורים לילדים קטנים שנמצאים בסיכון גבוה יותר לתאונות.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                הפרמיה לביטוח תאונות אישיות נמוכה יחסית, ולכן אין סיבה לחכות. ככל שמצטרפים מוקדם יותר, כך נהנים מכיסוי רציף ומהפרמיות הנמוכות ביותר. מומלץ לבדוק ולהתאים את הביטוח לאורח החיים שלכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח תאונות אישיות, שימו לב לחריגים: האם רכב דו-גלגלי מכוסה? האם ספורט אתגרי נכלל? מהו סכום הפיצוי במקרה של נכות? האם יש פיצוי גם על ימי אשפוז ותקופת אי כושר? ההבדלים בין פוליסות יכולים להיות משמעותיים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו עוזרים לכם לבנות כיסוי תאונות אישיות שמותאם בדיוק לאורח החיים שלכם, עם כל ההרחבות הנדרשות ובמחיר הטוב ביותר מבין כל חברות הביטוח.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח תאונות מכסה גם תאונות עם קורקינט חשמלי?</h3>
                  <p className="text-muted-foreground">בפוליסה סטנדרטית, תאונות עם רכב דו-גלגלי (כולל קורקינט ואופניים חשמליים) לרוב אינן מכוסות. ניתן לרכוש הרחבה ספציפית שמבטלת חריג זה ומספקת כיסוי מלא.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח תאונות לביטוח אובדן כושר עבודה?</h3>
                  <p className="text-muted-foreground">ביטוח תאונות מכסה רק מקרים שנגרמים מתאונה ומעניק פיצוי חד-פעמי לפי אחוזי נכות. ביטוח אובדן כושר עבודה מכסה כל סיבה (כולל מחלה) ומעניק פיצוי חודשי. מומלץ להחזיק את שניהם.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם יש ביטוח תאונות לילדים?</h3>
                  <p className="text-muted-foreground">כן, ביטוח תאונות אישיות זמין גם לילדים ומומלץ מאוד. ילדים חשופים לתאונות במיוחד — במגרשי משחקים, בספורט, באופניים ובפעילויות יומיומיות. הפרמיה לילדים נמוכה במיוחד.</p>
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
              {["מנורה מבטחים", "הראל", "מגדל", "כלל", "הפניקס", "איילון", "מיטב", "ילין לפידות", "אנליסט", "אלטשולר שחם", "הכשרה"].map((company) => (
                <span key={company} className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-[#5ec6c6]/30 shadow-sm hover:shadow-md hover:border-[#5ec6c6] transition-all">
                  {company}
                </span>
              ))}
            </div>
          </div>
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
