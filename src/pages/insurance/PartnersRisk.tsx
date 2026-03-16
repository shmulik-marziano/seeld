import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import { LogoDotsDivider } from "@/components/LogoBrandElements";
import { Users, Shield, Briefcase, Building, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import partnersImage from "@/assets/insurance-partners.jpg";

const PartnersRisk = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Users className="w-4 h-4" />
                ריסק שותפים
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                הגנה על
                <span className="text-primary"> העסק שלכם</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                ביטוח חיים לשותפים מבטיח את המשכיות העסק במקרה של פטירת אחד השותפים. הגנה חיונית לכל שותפות עסקית.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="#contact-form" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all">
                  להצטרפות ל-SeelD
                </a>
                <a href="#info" className="px-8 py-4 rounded-full border border-border font-medium hover:bg-muted/60 transition-all">
                  למידע נוסף
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <img 
                src={partnersImage} 
                alt="ביטוח ריסק שותפים" 
                className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl"
              />
            </div>
          </div>
        </section>

        <LogoDotsDivider />

        {/* Why This Insurance */}
        <section className="py-16 animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">למה ביטוח ריסק שותפים?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כי העסק שבניתם יחד שווה הגנה - גם אם אחד מכם לא יהיה שם
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  רכישת חלק השותף
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  מימון לרכישת חלקו של השותף שנפטר מהיורשים, ושמירה על שליטה בעסק
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  המשכיות עסקית
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  הבטחת המשך פעילות העסק ללא תלות בשותף ספציפי
                </p>
              </CardContent>
            </Card>
            <Card className="text-right hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-end">
                  הגנה על היורשים
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  היורשים מקבלים תמורה הוגנת עבור חלקם בעסק במקום להיכנס לשותפות לא רצויה
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Info Section */}
        <section id="info" className="py-16 scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">איך זה עובד?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ביטוח ריסק שותפים הוא הסכם צולב שבו כל שותף מבוטח לטובת השותף האחר. 
                במקרה של פטירה, השותף הנותר מקבל את כספי הביטוח ורוכש את חלקו של הנפטר מהיורשים.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">סכום הביטוח נקבע לפי שווי העסק</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">1</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">נחתם הסכם רכישה הדדי בין השותפים</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">2</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">כל שותף רוכש פוליסה על חיי השותף האחר</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">3</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 justify-end">
                  <span className="text-muted-foreground">במקרה פטירה, הכסף עובר לרכישת החלק</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">4</span>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="p-8 text-right animate-scale-in">
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-center">יש לכם שותפות עסקית?</h3>
                <p className="text-muted-foreground text-center">
                  בואו נבנה יחד תוכנית הגנה שתבטיח את המשכיות העסק והגנה על כל הצדדים - 
                  השותפים, המשפחות והעסק עצמו.
                </p>
                <a
                  href="#contact-form"
                  className="block w-full text-center px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all"
                >
                  קבעו פגישת ייעוץ
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto space-y-12 text-right">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">למה זה חשוב?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                שותפות עסקית בנויה על אמון ושיתוף פעולה. אבל מה קורה כשאחד השותפים נפטר באופן פתאומי? ללא הגנה מתאימה, יורשי השותף הנפטר הופכים לשותפים שלכם — אנשים שאולי אין להם ניסיון, עניין או יכולת לנהל את העסק. זה מתכון לקונפליקטים ואף לקריסת העסק.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח ריסק שותפים פותר את הבעיה באלגנטיות: כל שותף מבוטח לטובת השותף האחר. במקרה פטירה, השותף הנותר מקבל את כספי הביטוח ורוכש את חלקו של הנפטר מהיורשים. כך העסק ממשיך לפעול, היורשים מקבלים תמורה הוגנת, ואיש לא נפגע.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מתי כדאי לרכוש?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח ריסק שותפים צריך להיות חלק מהסכם השותפות מהיום הראשון. ברגע שנוצרת שותפות עסקית — בין אם חדשה או ותיקה — חיוני להגדיר מנגנון הגנה שמבטיח את המשכיות העסק. עורכי דין רבים ממליצים על כך כחלק בלתי נפרד מהסכם השותפות.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                חשוב לעדכן את סכום הביטוח בהתאם לשווי העסק. ככל שהעסק צומח, כך גם סכום הביטוח צריך לעלות בהתאם. בדיקה תקופתית מוודאת שהכיסוי תמיד מתאים למצב העדכני של העסק.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">מה חשוב לדעת?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                ביטוח ריסק שותפים חייב להיות מגובה בהסכם משפטי (הסכם רכישה הדדי) שמגדיר את המנגנון המדויק. סכום הביטוח צריך לשקף את שווי חלקו של כל שותף בעסק, ולהתעדכן בהתאם לשינויים בשווי. ללא ההסכם, כספי הביטוח עלולים לא להגיע ליעדם.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ב-SeelD אנחנו מלווים שותפויות עסקיות בבניית מנגנון ביטוחי מושלם. נעזור לכם לקבוע את סכום הביטוח הנכון, נשווה בין חברות הביטוח, ונוודא שהפוליסה מותאמת להסכם השותפות שלכם.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#0a3d3d]">שאלות נפוצות</h2>
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">איך קובעים את סכום הביטוח?</h3>
                  <p className="text-muted-foreground">סכום הביטוח נקבע לפי שווי חלקו של כל שותף בעסק. ניתן לקבוע את השווי באמצעות הערכת שמאי, מאזן העסק, או הסכמה בין השותפים. מומלץ לעדכן את הסכום כל שנה-שנתיים.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">מי משלם את הפרמיה?</h3>
                  <p className="text-muted-foreground">בדרך כלל, כל שותף משלם את הפרמיה על חיי השותף האחר. לחילופין, העסק עצמו יכול לשאת בעלות. חשוב להתייעץ עם רואה חשבון לגבי ההשלכות המיסוייות של כל אפשרות.</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-2">האם ביטוח ריסק שותפים מתאים גם לשותפות של יותר מ-2?</h3>
                  <p className="text-muted-foreground">בהחלט. ניתן לבנות מנגנון ביטוחי לכל מספר שותפים — כל אחד מבוטח לטובת האחרים. במקרה של שותפות מורכבת, חשוב במיוחד להגדיר מנגנון ברור בהסכם.</p>
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

        {/* Contact Form */}
        <section id="contact-form" className="py-16 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <InsuranceContactForm
              insuranceType="ביטוח ריסק שותפים"
              title="מעוניינים בביטוח ריסק שותפים?"
              subtitle="צרו קשר לייעוץ מקצועי בהתאמת ביטוח לעסק שלכם"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PartnersRisk;
