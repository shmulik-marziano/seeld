import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Smile, Shield, Star } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const DentalInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-12 right-4 hidden lg:block">
          <DoodleDecoration type="family" size="md" className="opacity-20 rotate-12" parallax parallaxSpeed={0.1} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Smile className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח שיניים</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            כיסוי מקיף לטיפולי שיניים - משמרים, שיקומיים וקוסמטיים
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                טיפולים משמרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                סתימות, ניקוי אבנית וטיפולי שורש
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-primary" />
                שיקום הפה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כתרים, גשרים ושתלים דנטליים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                יישור שיניים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                טיפולי אורתודונטיה לילדים ומבוגרים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <section className="py-8 mb-12">
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="רופאים מומחים" description="רשת רופאי שיניים מובילים בכל רחבי הארץ" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="handshake" />
            <FeatureCard title="חיסכון משמעותי" description="עד 70% הנחה על טיפולי שיניים יקרים כמו שתלים וכתרים" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="savings" />
            <FeatureCard title="ללא תקופת המתנה" description="כיסוי מיידי לטיפולים משמרים ללא המתנה" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="shield" />
            <FeatureCard title="כיסוי לכל המשפחה" description="תוכניות מותאמות לילדים, מבוגרים ומשפחות שלמות" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="family" />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                טיפולי שיניים הם מהיקרים ביותר בתחום הרפואה בישראל, וסל הבריאות הציבורי כמעט אינו מכסה אותם. שתל דנטלי בודד עולה אלפי שקלים, כתר או גשר יכולים להגיע לעשרות אלפים, ויישור שיניים לילד עולה לעתים יותר מ-20,000 שקלים. ללא ביטוח שיניים, טיפולים אלו הופכים לנטל כלכלי משמעותי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח שיניים מאפשר לכם לקבל טיפולים איכותיים בעלות מופחתת בהרבה. הפוליסה מכסה מגוון רחב של טיפולים — מטיפולים משמרים בסיסיים כמו סתימות וניקוי, דרך טיפולים שיקומיים כמו כתרים ושתלים, ועד יישור שיניים לילדים ומבוגרים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הזמן הטוב ביותר לרכוש ביטוח שיניים הוא לפני שאתם צריכים טיפול יקר. ברוב הפוליסות יש תקופת אכשרה של מספר חודשים לטיפולים שיקומיים, כך שכדאי להצטרף מוקדם. אם יש לכם ילדים — ביטוח שיניים הוא חיוני במיוחד לתקופת יישור השיניים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ לרכוש ביטוח שיניים גם אם אתם חושבים שהשיניים שלכם בסדר. בדיקות שגרתיות וניקוי אבנית תקופתי חיוניים למניעת בעיות עתידיות, וביטוח שיניים מכסה גם את הטיפולים המונעים האלו.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח שיניים, שימו לב לתקופות האכשרה (בדרך כלל 3-6 חודשים לטיפולים משמרים ו-12-18 חודשים לטיפולים שיקומיים), תקרות הכיסוי לכל סוג טיפול, רשימת רופאי השיניים בהסכם, וגובה ההשתתפות העצמית. חברות שונות מציעות תנאים שונים מהותית.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו יודעים שביטוח שיניים הוא אחד הביטוחים הכי שווים לכל משפחה. נשווה עבורכם את כל ההצעות ונמצא את הפוליסה שנותנת לכם את הכיסוי הרחב ביותר במחיר הטוב ביותר.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח שיניים מכסה שתלים?</h3>
                  <p className="text-muted-foreground">כן, רוב הפוליסות כוללות כיסוי לשתלים דנטליים, אם כי בדרך כלל לאחר תקופת אכשרה של 12-18 חודשים ועם תקרת כיסוי מוגדרת. השתתפות עצמית מופחתת יכולה לחסוך אלפי שקלים.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה כולל הכיסוי לילדים?</h3>
                  <p className="text-muted-foreground">ביטוח שיניים לילדים כולל בדרך כלל טיפולים משמרים, אורתודונטיה (יישור שיניים), ציפויי פלואוריד, וסתימות. זהו אחד הרכיבים המשתלמים ביותר בביטוח שיניים משפחתי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר לבחור רופא שיניים?</h3>
                  <p className="text-muted-foreground">בהתאם לפוליסה, תוכלו לבחור מתוך רשת רופאי שיניים בהסכם (עם הנחות משמעותיות) או לפנות לכל רופא שיניים ולקבל החזר חלקי. פוליסות מסוימות מציעות גם שילוב של שני המסלולים.</p>
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

        <InsuranceEnrollmentForm
          insuranceType="dental"
          title="הצטרפות לביטוח שיניים"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח שיניים"
        />
      </main>
      <Footer />
    </div>
  );
};

export default DentalInsurance;
