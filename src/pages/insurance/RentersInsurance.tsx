import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Shield, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const RentersInsurance = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח תכולה לשוכרים</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הגנה על הרכוש האישי שלכם בדירה שכורה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                תכולת הדירה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי מלא לרהיטים, בגדים ומכשירי חשמל שלכם
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                פריצה וגניבה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                פיצוי במקרה של פריצה לדירה או גניבת רכוש
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                אחריות כלפי המשכיר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי לנזקים שנגרמו למבנה הדירה
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
                כשוכרי דירה, אתם נוטים לחשוב שהמשכיר אחראי על כל נזק שיקרה. אבל האמת שונה — תכולת הדירה שלכם, כולל רהיטים, מכשירי חשמל, בגדים ופריטים אישיים, היא באחריותכם בלבד. שריפה, הצפה, פריצה או רעידת אדמה יכולים למחוק את כל רכושכם בתוך דקות, וללא ביטוח תכולה תיאלצו לשאת בעלות השיקום מכיסכם.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח תכולה לשוכרים מעניק לכם שקט נפשי בעלות חודשית נמוכה במיוחד. הפוליסה מכסה את כל הפריטים שלכם בדירה, ובמקרים רבים כוללת גם אחריות כלפי צד שלישי — למשל אם הצפה בדירתכם גרמה נזק לשכנים. זוהי הגנה בסיסית שכל שוכר חייב לשקול.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                הזמן האידיאלי לרכוש ביטוח תכולה הוא ביום שבו אתם נכנסים לדירה חדשה. לא כדאי לחכות לאירוע כדי להבין שאתם חשופים. גם אם אתם גרים בדירה כבר זמן מה ועדיין אין לכם ביטוח — עכשיו זה הרגע לתקן את זה. פוליסה חדשה נכנסת לתוקף מיידית ברוב המקרים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                במיוחד כדאי לבדוק ביטוח תכולה כשאתם רוכשים ריהוט או מכשירי חשמל יקרים, כשאתם עוברים לאזור עם סיכון גבוה יותר לפריצות, או כשמשפחתכם גדלה ותכולת הבית שלכם מתרחבת.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                כשאתם בוחרים ביטוח תכולה, שימו לב לשווי התכולה שאתם מצהירים עליו — הערכת חסר עלולה לגרום לכך שתקבלו פיצוי חלקי בלבד. חשוב גם לבדוק אם הפוליסה כוללת כיסוי לפריצה, כיסוי לנזקי טבע, ואחריות כלפי צד שלישי. השתתפות עצמית היא גורם מפתח שמשפיע על הפרמיה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו משווים עבורכם את כל ההצעות מחברות הביטוח המובילות, ומוצאים את הפוליסה שמתאימה בדיוק לסוג הדירה, התכולה והתקציב שלכם — ללא עלות נוספת עבורכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח תכולה מכסה גם נזקי מים?</h3>
                  <p className="text-muted-foreground">כן, רוב הפוליסות כוללות כיסוי לנזקי הצפה ונזילות מים, כולל נזקים שנגרמים לשכנים כתוצאה מהצפה בדירתכם. חשוב לוודא שהכיסוי כולל גם צנרת תת-רצפתית.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין ביטוח תכולה לביטוח דירה?</h3>
                  <p className="text-muted-foreground">ביטוח דירה מכסה את המבנה עצמו (קירות, גג, צנרת) והוא באחריות הבעלים. ביטוח תכולה מכסה את הרכוש שבתוך הדירה — רהיטים, מכשירים ופריטים אישיים — והוא רלוונטי במיוחד לשוכרים.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה עולה ביטוח תכולה לשוכרים?</h3>
                  <p className="text-muted-foreground">ביטוח תכולה לשוכרים הוא מהביטוחים המשתלמים ביותר, עם עלות של כ-50-150 שקלים בחודש בהתאם לשווי התכולה, מיקום הדירה ורמת הכיסוי.</p>
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

        <InsuranceContactForm insuranceType="ביטוח תכולה לשוכרים" />
      </main>
      <Footer />
    </div>
  );
};

export default RentersInsurance;
