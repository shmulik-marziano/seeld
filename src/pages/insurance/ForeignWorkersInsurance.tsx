import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const ForeignWorkersInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-4 hidden lg:block">
          <DoodleDecoration type="handshake" size="lg" className="opacity-20 -rotate-6" parallax parallaxSpeed={0.12} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח עובדים זרים ותיירים</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ביטוח בריאות לעובדים זרים ותיירים בישראל כנדרש בחוק
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                כיסוי רפואי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אשפוז, ניתוחים וטיפולים רפואיים בישראל
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                עמידה בחוק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ביטוח העונה על דרישות החוק להעסקת עובדים זרים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                שירות 24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מוקד שירות זמין בשפות שונות
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                על פי חוק, כל מעסיק בישראל חייב לספק ביטוח בריאות לעובדים זרים שמועסקים אצלו. העובדים הזרים אינם זכאים לשירותי בריאות דרך קופות החולים, ולכן ביטוח פרטי הוא הדרך היחידה להבטיח להם טיפול רפואי הולם. אי עמידה בחובה זו חושפת את המעסיק לקנסות כבדים ולתביעות.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח עובדים זרים מכסה אשפוז, ניתוחים, ביקורים אצל רופאים, בדיקות ותרופות. הוא מספק שקט נפשי למעסיק ולעובד כאחד, ומבטיח שבמקרה של מצב רפואי, העובד יקבל את הטיפול הדרוש ללא דיחוי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח עובדים זרים חייב להיות בתוקף מהיום הראשון של ההעסקה. מעסיקים צריכים לדאוג לפוליסה לפני כניסת העובד לעבודה. אם מדובר בתייר שמגיע לביקור בישראל, מומלץ לרכוש ביטוח עוד לפני ההגעה לארץ.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                חשוב לחדש את הביטוח בזמן ולא לאפשר פער בכיסוי. פער ביטוחי חושף את המעסיק לאחריות אישית על הוצאות רפואיות של העובד, שיכולות להגיע לסכומים גבוהים מאוד.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח עובדים זרים צריך לעמוד בדרישות המינימליות של החוק, הכוללות כיסוי רפואי בסיסי כולל אשפוז, ניתוחים ותרופות. ישנן פוליסות בסיסיות ופוליסות מורחבות — הבחירה תלויה בצרכים ובתקציב. שימו לב גם לשירות בשפות שונות, שחשוב לעובדים שאינם דוברי עברית.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מתמחים בהתאמת ביטוח עובדים זרים למעסיקים מכל הסוגים — ממשפחות המעסיקות מטפלות סיעודיות ועד חברות עם עשרות עובדים. נמצא לכם את הפוליסה שעומדת בדרישות החוק ובמחיר הטוב ביותר.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח עובדים זרים הוא חובה על פי חוק?</h3>
                  <p className="text-muted-foreground">כן, על פי חוק ביטוח בריאות ממלכתי וחוק עובדים זרים, כל מעסיק חייב לספק ביטוח בריאות לעובד זר. אי עמידה בחובה זו עלולה להוביל לקנסות ולאחריות אישית על הוצאות רפואיות.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה הכיסוי המינימלי הנדרש?</h3>
                  <p className="text-muted-foreground">הכיסוי המינימלי כולל אשפוז, ניתוחים, בדיקות רפואיות, ביקורי רופא ותרופות. חלק מהפוליסות כוללות גם טיפולי שיניים חירום, ייעוץ נפשי ושירותי אמבולנס.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם הביטוח מכסה גם את בני משפחת העובד?</h3>
                  <p className="text-muted-foreground">ישנן פוליסות שמציעות הרחבה לבני משפחה של העובד הזר השוהים בישראל. זוהי הרחבה אופציונלית שכדאי לשקול, במיוחד אם בן/בת הזוג והילדים נמצאים בארץ.</p>
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
              {["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"].map((company) => (
                <span key={company} className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-[#5ec6c6]/30 shadow-sm hover:shadow-md hover:border-[#5ec6c6] transition-all">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        <InsuranceContactForm insuranceType="ביטוח עובדים זרים ותיירים" />
      </main>
      <Footer />
    </div>
  );
};

export default ForeignWorkersInsurance;
