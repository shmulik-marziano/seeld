import Header from "@/components/Header";
import { Plane, Globe, Shield, Briefcase, Heart, CheckCircle } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import Footer from "@/components/Footer";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import travelLogos from "@/assets/travel-insurance-logos.jpeg";

const TravelInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          <div className="absolute bottom-8 left-4 hidden lg:block">
            <DoodleDecoration type="shield" size="md" className="opacity-25 rotate-12" parallax parallaxSpeed={0.12} />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Plane className="w-4 h-4" />
                ביטוח נסיעות
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                טסים בראש שקט
                <span className="text-primary"> לכל מקום בעולם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח נסיעות לחו״ל מכסה אתכם בכל מקרה - טיפול רפואי, אובדן מזוודות, ביטול טיסה ועוד.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#enrollment-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  רכשו ביטוח עכשיו
                </a>
                <a href="#coverage" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  מה כולל הביטוח?
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <Plane className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Coverage Types */}
        <section id="coverage" className="py-16 scroll-mt-24 relative">
          <div className="absolute -top-4 right-8 hidden lg:block">
            <DoodleDecoration type="handshake" size="sm" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.08} />
          </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">מה כולל הביטוח?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  כיסוי רפואי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  טיפול רפואי ואשפוז בכל מקום בעולם
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> אשפוז עד מיליון דולר</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> פינוי רפואי</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> טיפולי שיניים חירום</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  מזוודות וכבודה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  פיצוי במקרה של אובדן או נזק
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> אובדן מזוודות</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> עיכוב כבודה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> נזק לציוד</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  ביטול נסיעה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  החזר הוצאות במקרה של ביטול
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ביטול טיסה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> קיצור נסיעה</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> איחור בטיסה</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה לבטח דרכנו?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="כיסוי עולמי" description="הגנה בכל מקום בעולם - אירופה, אסיה, אמריקה ועוד" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="umbrella" />
            <FeatureCard title="רכישה מהירה" description="קנו ביטוח נסיעות תוך דקות ספורות ישירות מהאתר" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="calculator" />
            <FeatureCard title="מוקד חירום" description="מוקד סיוע בינלאומי זמין 24/7 בכל שפה" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="shield" />
            <FeatureCard title="מחיר משתלם" description="ביטוח מקיף במחירים תחרותיים עם כיסוי רחב" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="savings" />
          </div>
        </section>

        {/* Quick Purchase Banner */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl bg-[hsl(210,30%,15%)] p-8 md:p-12 text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">רכשו ביטוח נסיעות לחו״ל עכשיו</h2>
              <p className="text-white/70 text-lg">רכישה מהירה ומאובטחת דרך הראל ביטוח — הסוכן שלכם ב-SeelD</p>
              <div className="relative inline-block">
                <img
                  src={travelLogos}
                  alt="הראל ביטוח נסיעות לחו״ל - PassportCard"
                  className="max-w-xs md:max-w-sm mx-auto rounded-xl shadow-lg border border-white/10"
                />
                <div className="absolute inset-0 flex">
                  {/* Harel Link (Left zone) */}
                  <a
                    href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-1/2 h-full cursor-pointer rounded-l-xl hover:bg-white/5 transition-colors"
                    title="רכישת ביטוח הראל"
                  />
                  {/* PassportCard Link (Right zone) */}
                  <a
                    href="https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-1/2 h-full cursor-pointer rounded-r-xl hover:bg-white/5 transition-colors"
                    title="רכישת ביטוח PassportCard"
                  />
                </div>
              </div>
              <p className="text-white/50 text-sm">לחצו על הלוגו לרכישה מיידית</p>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                נסיעה לחו״ל ללא ביטוח היא הימור מסוכן. טיפול רפואי בחו״ל עולה עשרות ואף מאות אלפי שקלים — אשפוז של כמה ימים בארה״ב יכול להגיע לסכומים אסטרונומיים. גם אירועים כמו ביטול טיסה, אובדן מזוודות או גניבת דרכון יכולים להפוך חופשה לסיוט כלכלי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח נסיעות מעניק לכם שקט נפשי מוחלט: כיסוי רפואי מלא, פינוי רפואי, סיוע בשפה שלכם, החזר הוצאות בגין ביטולים, ופיצוי על אובדן כבודה. בעלות של כמה עשרות שקלים ליום, אתם קונים ביטחון שלא יסולא בפז.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                כדאי לרכוש ביטוח נסיעות מיד עם הזמנת הטיסה או חבילת הנופש. כך תהנו גם מכיסוי לביטול הנסיעה מסיבות רפואיות או אחרות. ככל שתרכשו מוקדם יותר, כך הכיסוי שלכם רחב יותר ואתם מוגנים מרגע הרכישה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                חשוב במיוחד לדאוג לביטוח כשנוסעים ליעדים עם עלויות רפואיות גבוהות כמו ארה״ב או אירופה, כשנוסעים עם ילדים, כשמתכננים פעילויות ספורט אתגרי, או כשיש מצב רפואי קיים שדורש הצהרת בריאות מוקדמת.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח נסיעות, שימו לב לסכום הכיסוי הרפואי (מומלץ לפחות מיליון דולר ליעדים יקרים), חריגי הפוליסה, כיסוי ספורט אתגרי, כיסוי מצבים רפואיים קודמים, ומוקד חירום 24/7 בעברית. יש הבדלים גדולים בין פוליסות שנראות דומות.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו משווים עבורכם בין כל חברות הביטוח המובילות ומוצאים את הפוליסה המתאימה ביותר ליעד, למשך הנסיעה ולצרכים הספציפיים שלכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח נסיעות מכסה גם קורונה?</h3>
                  <p className="text-muted-foreground">רוב הפוליסות העדכניות כוללות כיסוי לקורונה ומחלות מדבקות אחרות, כולל אשפוז, בידוד וביטול נסיעה. חשוב לוודא שהכיסוי מפורט בתנאי הפוליסה.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה קורה אם אני צריך פינוי רפואי?</h3>
                  <p className="text-muted-foreground">ביטוח נסיעות מקיף כולל כיסוי לפינוי רפואי לישראל או למדינה קרובה עם בית חולים מתאים. זהו אחד הרכיבים היקרים ביותר שהביטוח מכסה ויכול להגיע למאות אלפי דולרים.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם כרטיס אשראי מספק ביטוח נסיעות?</h3>
                  <p className="text-muted-foreground">חלק מכרטיסי האשראי מציעים ביטוח נסיעות בסיסי, אך הכיסוי בדרך כלל מוגבל מאוד — סכומים נמוכים, חריגים רבים, ותהליך תביעות מסובך. מומלץ תמיד לרכוש ביטוח ייעודי.</p>
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

        {/* Enrollment Form */}
        <section id="enrollment-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceEnrollmentForm
              insuranceType="travel"
              title="רכישת ביטוח נסיעות"
              description="מלאו את פרטי הנסיעה ונחזור אליכם עם הצעה"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TravelInsurance;
