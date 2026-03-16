import Header from "@/components/Header";
import { Wallet, TrendingUp, Shield, Calculator, CheckCircle, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import ScrollReveal from "@/components/ScrollReveal";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const GemelFunds = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute top-8 left-8 hidden lg:block">
            <DoodleDecoration type="savings" size="lg" className="opacity-25 rotate-12" parallax parallaxSpeed={0.15} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Wallet className="w-4 h-4" />
                קופות גמל
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                גמישות מקסימלית
                <span className="text-primary"> בחיסכון שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#analysis-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  ניתוח קופות גמל חינם
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <Wallet className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Benefits */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">יתרונות קופת גמל</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  ניהול מקצועי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  ניהול השקעות על ידי גופים מובילים בשוק ההון
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> מנהלי השקעות מנוסים</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פיזור סיכונים</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  גמישות מלאה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  בחירה בין משיכה הונית לקצבה
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> סכום חד פעמי</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> קצבה חודשית</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  הטבות מס
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  חיסכון משמעותי במס
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> זיכוי מס על הפקדות</li>
                  <li className="flex items-center gap-2"><Banknote className="w-4 h-4 text-primary" /> פטור ממס רווחי הון</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="גמישות בחיסכון שלכם"
              description="קופת גמל מאפשרת בחירה בין משיכה הונית לקצבה חודשית — ההחלטה בידיכם."
              bgColor="bg-primary/5"
              doodle="pension"
              buttonText="ניתוח חינם"
              buttonHref="#analysis-form"
            />
          </ScrollReveal>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה קופת גמל חשובה?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                קופת גמל היא מכשיר חיסכון ייחודי המשלב גמישות מקסימלית עם הטבות מס משמעותיות. בניגוד לקרן פנסיה, קופת גמל מאפשרת לכם לבחור בפרישה בין משיכת הכסף כסכום חד פעמי (משיכה הונית) לבין קבלת קצבה חודשית - גמישות שלא קיימת במוצרים פנסיוניים אחרים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                קופת גמל להשקעה, שהושקה בשנת 2016, היא מוצר חיסכון מעולה גם לטווח בינוני. היא מאפשרת הפקדות ללא תקרה, ניהול מקצועי של ההשקעות, ופטור ממס רווחי הון בעת משיכה כקצבה. זהו מכשיר חיסכון שכל משק בית צריך לשקול.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לפתוח קופת גמל?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                קופת גמל מתאימה בכל שלב בחיים. עצמאים יכולים להפקיד לקופת גמל וליהנות מהטבות מס משמעותיות. שכירים יכולים להפקיד מעבר להפקדות החובה של המעסיק כדי להגדיל את החיסכון. גם הורים יכולים לפתוח קופת גמל להשקעה עבור הילדים כחיסכון לטווח ארוך.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ לבצע ניתוח תקופתי של קופות הגמל הקיימות שלכם, לבדוק את דמי הניהול ואת ביצועי ההשקעות, ולוודא שהכסף שלכם מנוהל בצורה אופטימלית.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ישנם מספר סוגי קופות גמל: קופת גמל לחיסכון (המשך הקופות הישנות), קופת גמל להשקעה (מוצר חדש וגמיש), וקופת גמל לתגמולים. לכל סוג תנאים שונים בנוגע למשיכה, מיסוי והטבות. חשוב לבחור את המוצר הנכון בהתאם למטרת החיסכון ולאופק ההשקעה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מנתחים את כל קופות הגמל שלכם, בודקים דמי ניהול, תשואות ומסלולי השקעה, ומוודאים שהכסף שלכם עובד בצורה הטובה ביותר. הייעוץ שלנו חינמי ואובייקטיבי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין קופת גמל לקרן פנסיה?</h3>
                  <p className="text-muted-foreground">קרן פנסיה כוללת כיסויים ביטוחיים (נכות ושאירים) ומחייבת קבלת קצבה חודשית. קופת גמל היא מוצר חיסכון טהור עם גמישות רבה יותר, כולל אפשרות למשיכה הונית. לרוב מומלץ שילוב של שניהם.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מתי אפשר למשוך כסף מקופת גמל?</h3>
                  <p className="text-muted-foreground">קופת גמל לחיסכון ניתנת למשיכה בגיל 60. קופת גמל להשקעה ניתנת למשיכה בכל עת (לאחר 6 שנים מההפקדה הראשונה עם פטור ממס רווחי הון, או לפני כן עם תשלום מס).</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם כדאי להעביר קופת גמל ישנה?</h3>
                  <p className="text-muted-foreground">במקרים רבים כן. קופות גמל ישנות עשויות לגבות דמי ניהול גבוהים ולהשקיע במסלולים שאינם אופטימליים. העברת קופת גמל היא תהליך פשוט וללא עלות, וניתוח מקצועי יחשוף האם כדאי לבצע מהלך כזה.</p>
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
              <p className="text-lg text-muted-foreground">אנחנו עובדים עם הגופים המוסדיים המובילים בישראל כדי להביא לכם את התנאים הטובים ביותר</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"].map((company) => (
                <span key={company} className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-[#5ec6c6]/30 shadow-sm hover:shadow-md hover:border-[#5ec6c6] transition-all">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Analysis Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm 
              focusArea="savings"
              title="ניתוח קופות גמל"
              description="הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GemelFunds;
