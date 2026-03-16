import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Shield, Users } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const NursingInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-8 hidden lg:block">
          <DoodleDecoration type="shield" size="lg" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.15} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח סיעודי</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הגנה כלכלית במקרה של הפיכה לסיעודי - לכם ולמשפחתכם
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                פיצוי חודשי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                תשלום חודשי למימון טיפול סיעודי איכותי
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                טיפול בבית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מימון מטפל סיעודי בבית או במוסד
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                הגנה על המשפחה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מניעת נטל כלכלי על בני המשפחה
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <section className="py-8 mb-12">
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="הגנה כלכלית" description="פיצוי חודשי שמכסה את עלויות הטיפול הסיעודי" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="shield" />
            <FeatureCard title="גמישות בטיפול" description="בחירה בין טיפול בבית, מוסד או שילוב של שניהם" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="family" />
            <FeatureCard title="ללא בדיקות רפואיות" description="הצטרפות פשוטה ללא תהליך חיתום מורכב" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="lightbulb" />
            <FeatureCard title="שקט נפשי" description="ביטחון שהמשפחה לא תישא בנטל הכלכלי" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="umbrella" />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                מצב סיעודי הוא אחד האתגרים הכלכליים הגדולים ביותר שמשפחה יכולה להתמודד איתם. עלות טיפול סיעודי בבית נעה בין 10,000 ל-20,000 שקלים בחודש, ושהייה במוסד סיעודי יכולה להגיע ל-15,000-25,000 שקלים ומעלה. ללא ביטוח, הנטל הכלכלי נופל ישירות על המשפחה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח סיעודי מעניק פיצוי חודשי שמאפשר מימון טיפול איכותי — בין אם בבית או במוסד — מבלי להכביד על בני המשפחה. זוהי הגנה שמשמרת את הכבוד, העצמאות ואיכות החיים של המבוטח, ומגנה על החסכונות של כל המשפחה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הזמן האידיאלי לרכוש ביטוח סיעודי הוא בגילאי 40-55. בגיל זה הפרמיות עדיין סבירות, ותנאי הקבלה קלים יותר. ככל שמתקדמים בגיל, העלות עולה משמעותית, ומצבים רפואיים קיימים עלולים להגביל את הכיסוי.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                אל תחכו לגיל מבוגר מדי — כ-50% מהאנשים מעל גיל 65 יזדקקו לטיפול סיעודי בשלב כלשהו. ככל שמצטרפים מוקדם יותר, כך הפרמיה הקבועה נמוכה יותר לאורך כל תקופת הביטוח.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח סיעודי, שימו לב להגדרת המצב הסיעודי בפוליסה (כמה פעולות יום-יומיות צריך שלא תוכלו לבצע), לתקופת ההמתנה לפני תחילת הפיצוי, לגובה הפיצוי החודשי, ולתקופה המקסימלית שהביטוח משלם. חשוב גם לבדוק אם יש אפשרות לטיפול בבית ולא רק במוסד.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מלווים אתכם בבחירת ביטוח סיעודי שמותאם למצבכם, משווים בין כל החברות ומוודאים שהכיסוי שתקבלו אכן ייתן מענה אמיתי ביום שתצטרכו אותו.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מהו מצב סיעודי?</h3>
                  <p className="text-muted-foreground">מצב סיעודי מוגדר כחוסר יכולת לבצע באופן עצמאי לפחות 3 מתוך 6 פעולות יום-יומיות: לקום ולשכב, להתלבש ולהתפשט, להתרחץ, לאכול ולשתות, לשלוט בסוגרים, ולנוע בבית. גם תשישות נפש (דמנציה) נחשבת למצב סיעודי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם הביטוח הלאומי מכסה מצב סיעודי?</h3>
                  <p className="text-muted-foreground">הביטוח הלאומי מעניק גמלת סיעוד הכוללת שעות עזרה מוגבלות, אך הסכום רחוק מלכסות את העלות האמיתית של טיפול סיעודי. ביטוח סיעודי פרטי משלים את הפער ומאפשר טיפול ברמה ראויה.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח סיעודי פרטי לקולקטיבי?</h3>
                  <p className="text-muted-foreground">ביטוח קולקטיבי (דרך קופת חולים) זול יותר אך מציע כיסוי מוגבל יותר ויכול להשתנות לאורך הזמן. ביטוח פרטי יקר יותר אך מספק כיסוי רחב, יציב, ומותאם אישית. מומלץ לשלב את שניהם.</p>
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
          title="הצטרפות לביטוח סיעודי"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח סיעודי"
        />
      </main>
      <Footer />
    </div>
  );
};

export default NursingInsurance;
