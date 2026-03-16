import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Briefcase, Shield, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const DisabilityInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-8 hidden lg:block">
          <DoodleDecoration type="shield" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח אובדן כושר עבודה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הגנה על ההכנסה שלכם במקרה של אובדן יכולת לעבוד
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
                תשלום חודשי קבוע במקרה של אי יכולת לעבוד
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                הגדרה עיסוקית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי מותאם למקצוע הספציפי שלכם
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                שחרור מפרמיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                פטור מתשלום פרמיות בתקופת אי כושר
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
                היכולת לעבוד ולהתפרנס היא הנכס החשוב ביותר שלכם. ביטוח אובדן כושר עבודה מגן עליכם כאשר מחלה, תאונה או מצב רפואי מונעים מכם לחזור לעבודה לתקופה ממושכת. ללא כיסוי זה, אתם עלולים למצוא עצמכם ללא הכנסה בדיוק כשאתם צריכים אותה הכי הרבה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הפיצוי החודשי שמעניק הביטוח מאפשר לכם להמשיך לעמוד בהתחייבויות הכלכליות — משכנתא, הוצאות מחיה, חינוך הילדים — גם כשאינכם מסוגלים לעבוד. מדובר ברשת ביטחון קריטית שמגנה על רמת החיים של כל המשפחה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ככל שמצטרפים מוקדם יותר, הפרמיה נמוכה יותר ותנאי הקבלה קלים יותר. הגיל האידיאלי להצטרפות הוא בתחילת הקריירה, כשאתם בריאים ופעילים. מצב רפואי קיים עלול להוביל לחריגים בפוליסה או אף לסירוב קבלה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ במיוחד לרכוש ביטוח אובדן כושר עבודה כשיש לכם משכנתא, כשאתם מפרנסים עיקריים, או כשהמקצוע שלכם דורש מאמץ פיזי או מיומנות ספציפית. עצמאים שאין להם מעסיק שמפקיד עבורם לביטוח פנסיוני צריכים לדאוג לכיסוי זה במיוחד.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ההבדל המהותי ביותר בין פוליסות הוא ההגדרה העיסוקית: האם הביטוח מכסה אי יכולת לעסוק במקצוע שלכם (הגדרה עיסוקית) או אי יכולת לעסוק בכל עבודה שהיא (הגדרה כללית). הגדרה עיסוקית יקרה יותר אך מספקת הגנה טובה בהרבה. שימו לב גם לתקופת ההמתנה ולתקופת הביטוח.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו עוזרים לכם להבין את הפרטים הקטנים שעושים הבדל גדול, משווים בין כל חברות הביטוח, ומוודאים שאתם מקבלים כיסוי שבאמת יגן עליכם ברגע הקריטי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין הגדרה עיסוקית לכללית?</h3>
                  <p className="text-muted-foreground">הגדרה עיסוקית מעניקה פיצוי אם אינכם מסוגלים לעסוק במקצוע הספציפי שלכם, בעוד הגדרה כללית מפצה רק אם אינכם מסוגלים לעבוד בשום עבודה. לרופא, למשל, שבר ביד עלול לזכות בפיצוי בהגדרה עיסוקית אך לא בכללית.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה פיצוי אקבל?</h3>
                  <p className="text-muted-foreground">סכום הפיצוי נקבע בעת רכישת הפוליסה ובדרך כלל עומד על עד 75% מהשכר הממוצע שלכם. סכום גבוה יותר אפשרי אך כרוך בפרמיה גבוהה יותר.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם הפיצוי חייב במס?</h3>
                  <p className="text-muted-foreground">פיצוי מביטוח אובדן כושר עבודה חייב במס הכנסה, בדומה לשכר. עם זאת, ניתן לקבל הקלות מס מסוימות. חשוב להתייעץ עם רואה חשבון לגבי ההשלכות המיסוייות.</p>
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

        <InsuranceContactForm insuranceType="ביטוח אובדן כושר עבודה" />
      </main>
      <Footer />
    </div>
  );
};

export default DisabilityInsurance;
