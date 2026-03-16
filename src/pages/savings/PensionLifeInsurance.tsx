import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PensionLifeInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח חיים פנסיוני</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            שילוב בין חיסכון פנסיוני לביטוח חיים המעניק הגנה מקיפה למשפחה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                הגנה מלאה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ביטוח חיים שמגן על המשפחה במקרה של אובדן מפרנס
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                חיסכון מצטבר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                צבירת כספים לפנסיה במקביל לכיסוי ביטוחי
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                גמישות מלאה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                התאמת סכומי הביטוח והחיסכון לצרכים המשתנים
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
                ביטוח חיים פנסיוני (ביטוח מנהלים) הוא מוצר ייחודי שמשלב חיסכון לפנסיה עם כיסוי ביטוחי מקיף. בניגוד לקרן פנסיה שמנוהלת בצורה אחידה, ביטוח מנהלים מאפשר גמישות רבה יותר בהתאמת הכיסויים הביטוחיים לצרכים הספציפיים שלכם.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                המוצר כולל מרכיב חיסכון שצובר כספים לפנסיה, לצד כיסויים ביטוחיים כמו ביטוח חיים (ריסק), אובדן כושר עבודה, ופטור מתשלום פרמיות. זוהי תכנית שמגנה על המשפחה בהווה ובונה עתיד כלכלי בטוח.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח מנהלים רלוונטי במיוחד למי שרוצה שליטה מלאה על הכיסויים הביטוחיים שלו. הוא מתאים לשכירים שרוצים כיסוי ביטוחי מותאם, לעצמאים שצריכים גמישות, ולבעלי הכנסה גבוהה שרוצים למקסם את החיסכון הפנסיוני.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                אם יש לכם כבר ביטוח מנהלים ותיק, חשוב לבדוק אותו מעת לעת — פוליסות ישנות לרוב כוללות דמי ניהול גבוהים ותנאים פחות טובים. ייתכן שכדאי להעביר את הפוליסה או לעדכן אותה.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת ביטוח מנהלים, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי ההשקעה של החברה, לתנאי הכיסוי הביטוחי (במיוחד הגדרת אובדן כושר עבודה), ולגמישות בשינוי מסלולים. פוליסות שונות מציעות תנאים שונים מאוד.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מבצעים ניתוח מעמיק של ביטוחי המנהלים שלכם, משווים מול כל החברות בשוק, ומוודאים שאתם מקבלים את התנאים הטובים ביותר — הן בחלק החיסכוני והן בחלק הביטוחי.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח מנהלים לקרן פנסיה?</h3>
                  <p className="text-muted-foreground">קרן פנסיה מנוהלת בצורה קולקטיבית עם תנאים אחידים, בעוד ביטוח מנהלים מאפשר התאמה אישית של הכיסויים. קרן פנסיה כוללת ביטוח אובדן כושר עבודה ושאירים מובנה, בעוד בביטוח מנהלים הכיסויים נרכשים בנפרד.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם אפשר להעביר ביטוח מנהלים לקרן פנסיה?</h3>
                  <p className="text-muted-foreground">כן, ניתן לבצע ניוד בין מוצרים פנסיוניים. עם זאת, חשוב לבדוק את ההשלכות לפני המעבר — למשל, אובדן תנאים ביטוחיים ייחודיים שקיימים בביטוח המנהלים הנוכחי.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה קורה עם הכסף בגיל הפרישה?</h3>
                  <p className="text-muted-foreground">בגיל הפרישה ניתן לקבל את הכספים כקצבה חודשית (פטורה ממס עד תקרה מסוימת), כסכום חד-פעמי (חייב במס), או שילוב של שניהם. חשוב לתכנן מראש את אסטרטגיית המשיכה.</p>
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

        {/* Form */}
        <section id="analysis-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <PensionAnalysisForm
              focusArea="pension"
              title="ניתוח ביטוח חיים פנסיוני"
              description="מלאו את הפרטים ונבדוק אם הפוליסה שלכם מספקת את המיטב"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PensionLifeInsurance;
