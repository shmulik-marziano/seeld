import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building2, Users, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const EmployerFunds = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">קופות מרכזיות למעסיק</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            פתרונות פנסיוניים מותאמים לארגונים ולמעסיקים
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                ניהול קולקטיבי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ניהול מרוכז של זכויות העובדים בקופה אחת
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                חיסכון בעלויות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                דמי ניהול מופחתים הודות לכוח המיקוח של הארגון
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                שירות ארגוני
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ליווי מקצועי למחלקת משאבי אנוש ולעובדים
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
                קופה מרכזית לפיצויים היא כלי חיוני לכל מעסיק בישראל. היא מאפשרת למעסיק להפריש כספי פיצויים לקופה חיצונית באופן שוטף, במקום לשלם אותם כסכום חד-פעמי בעת פיטורין. כך המעסיק מפזר את העלות לאורך זמן ומגן על עצמו מפני הוצאות גדולות ובלתי צפויות.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                מעבר לחובה החוקית, ניהול נכון של הקופות המרכזיות יכול לחסוך לארגון סכומים משמעותיים בדמי ניהול ולהבטיח תשואות טובות יותר על כספי העובדים. ארגון שמנהל את הנושא בצורה מקצועית נהנה מיחסי עבודה טובים יותר ומשביעות רצון גבוהה של העובדים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                כל מעסיק חייב על פי חוק להפריש כספים פנסיוניים לעובדיו מהיום הראשון להעסקה. קופה מרכזית למעסיק רלוונטית במיוחד לארגונים עם מספר עובדים, שיכולים ליהנות מכוח מיקוח לדמי ניהול מוזלים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                מומלץ לבצע בדיקה תקופתית של ההסדר הפנסיוני הארגוני — לפחות אחת לשנה. שינויים בגודל הארגון, בתנאי השוק, או בביצועי הגופים המנהלים, יכולים להצדיק מעבר לקופה אחרת עם תנאים טובים יותר.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                בבחירת הסדר פנסיוני ארגוני, יש לשקול מספר גורמים: דמי הניהול שנגבים (ככל שהארגון גדול יותר, כך כוח המיקוח חזק יותר), ביצועי ההשקעה של הגוף המנהל, השירות למחלקת משאבי אנוש ולעובדים, ומגוון מסלולי ההשקעה הזמינים.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מתמחים בבניית הסדרים פנסיוניים ארגוניים. ננהל עבורכם משא ומתן מול כל הגופים המנהלים, נשיג דמי ניהול מופחתים, וניתן ליווי מקצועי שוטף למחלקת משאבי האנוש ולעובדים.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מה ההבדל בין קופה מרכזית לפיצויים לקופה אישית?</h3>
                  <p className="text-muted-foreground">קופה מרכזית מנוהלת ברמת הארגון ומאפשרת דמי ניהול מוזלים הודות לכוח המיקוח הקולקטיבי. קופה אישית מנוהלת ברמת העובד הבודד. בשני המקרים, הכספים שייכים לעובד.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם העובד יכול לבחור לאן להפריש?</h3>
                  <p className="text-muted-foreground">על פי חוק, לעובד יש את הזכות לבחור את הגוף הפנסיוני שלו. עם זאת, מעסיקים רבים מציעים הסדר ארגוני עם תנאים מועדפים שמשתלמים יותר לעובד.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">כמה אפשר לחסוך בדמי ניהול?</h3>
                  <p className="text-muted-foreground">בהסדר ארגוני, דמי הניהול יכולים להיות נמוכים משמעותית — לעתים 50% פחות מדמי הניהול הסטנדרטיים. ההבדל הזה מצטבר לסכומים גדולים לאורך שנות העבודה של כל עובד.</p>
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
              title="ייעוץ לקופות מרכזיות"
              description="מלאו פרטי הארגון ונחזור אליכם עם הצעה מותאמת"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EmployerFunds;
