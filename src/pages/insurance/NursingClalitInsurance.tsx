import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Shield, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const NursingClalitInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 right-4 hidden lg:block">
          <DoodleDecoration type="family" size="md" className="opacity-20 rotate-6" parallax parallaxSpeed={0.1} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח סיעודי לחברי כללית</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            כיסוי סיעודי משופר לחברי קופת חולים כללית
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                השלמה לכללית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי משלים לביטוח הבסיסי של כללית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                תנאים מועדפים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                פרמיות מוזלות לחברי כללית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                כיסוי מורחב
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                הרחבות נוספות מעבר לכיסוי הבסיסי
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
                חברי כללית נהנים מביטוח סיעודי קולקטיבי בסיסי, אך הכיסוי שהוא מספק מוגבל מאוד ואינו מכסה את העלויות האמיתיות של טיפול סיעודי. הפער בין מה שכללית מציעה לבין העלות בפועל יכול להגיע לאלפי שקלים בחודש — סכום שנופל על כתפי המשפחה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח סיעודי משלים לחברי כללית נועד לגשר על הפער הזה. הוא מספק פיצוי חודשי נוסף מעבר למה שכללית נותנת, ומאפשר לכם לבחור בטיפול סיעודי ברמה גבוהה — בבית או במוסד — ללא דאגות כלכליות.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הזמן הטוב ביותר לרכוש ביטוח סיעודי משלים הוא כשאתם עדיין בריאים, בדרך כלל בגילאי 40-55. בגיל זה הפרמיות נמוכות יחסית ותנאי החיתום נוחים. אל תחכו עד שיופיעו בעיות בריאותיות — אז יהיה מאוחר מדי או יקר מדי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                שימו לב: הביטוח הקולקטיבי של כללית יכול להשתנות לאורך הזמן — תנאים, מחירים או כיסויים עלולים להצטמצם. ביטוח פרטי משלים נשאר קבוע ויציב, ומהווה רשת ביטחון שלא תלויה בהחלטות של הקופה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                כשרוכשים ביטוח סיעודי משלים, חשוב לבדוק איך הפוליסה הפרטית משתלבת עם הכיסוי הקולקטיבי של כללית. חשוב לוודא שאין כפילויות מיותרות, ושהפיצוי הכולל (קולקטיבי + פרטי) אכן מכסה את העלות הריאלית של טיפול סיעודי באזור מגוריכם.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מתמחים בהתאמה מדויקת של ביטוח סיעודי משלים לחברי כללית. נבדוק את הכיסוי הקולקטיבי הקיים שלכם, נחשב את הפער, ונמצא את הפוליסה הפרטית שמשלימה בדיוק את מה שחסר.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה כולל הביטוח הסיעודי הקולקטיבי של כללית?</h3>
                  <p className="text-muted-foreground">הביטוח הקולקטיבי של כללית מספק כיסוי בסיסי הכולל פיצוי חודשי מוגבל לתקופה מוגדרת. הכיסוי משתנה בהתאם לגיל ההצטרפות ולמסלול שנבחר, אך בדרך כלל אינו מספיק לכיסוי מלא של עלויות הטיפול.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר לשלב ביטוח קולקטיבי עם פרטי?</h3>
                  <p className="text-muted-foreground">בהחלט. השילוב הוא הפתרון האופטימלי — הביטוח הקולקטיבי מספק בסיס במחיר נמוך, והביטוח הפרטי משלים את הכיסוי לרמה שמאפשרת טיפול איכותי ללא פשרות.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה קורה אם אעזוב את כללית?</h3>
                  <p className="text-muted-foreground">הביטוח הקולקטיבי של כללית מותנה בחברות בקופה. אם תעברו לקופה אחרת, תאבדו את הכיסוי הקולקטיבי. לכן חשוב שיהיה לכם גם ביטוח סיעודי פרטי שלא תלוי בחברות בקופת חולים ספציפית.</p>
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

        <InsuranceEnrollmentForm
          insuranceType="nursing"
          title="הצטרפות לביטוח סיעודי לחברי כללית"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח סיעודי"
        />
      </main>
      <Footer />
    </div>
  );
};

export default NursingClalitInsurance;
