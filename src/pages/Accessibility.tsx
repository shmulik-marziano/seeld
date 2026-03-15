import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight animate-slide-down">
            הצהרת נגישות
          </h1>
          <p className="text-muted-foreground animate-slide-up stagger-1">
            עדכון אחרון: מרץ 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">מחויבות לנגישות</h2>
            <p className="text-muted-foreground">
              SeelD פיננסים וביטוח מחויבת להנגשת האתר והשירותים הדיגיטליים שלה לכלל האוכלוסייה, 
              לרבות אנשים עם מוגבלויות, וזאת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, 
              תשנ"ח-1998, ולתקנות הנגישות שהותקנו מכוחו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">תקן הנגישות</h2>
            <p className="text-muted-foreground">
              אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), 
              התשע"ג-2013, ברמת AA לפי תקן WCAG 2.1 של ארגון W3C.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">התאמות הנגישות באתר</h2>
            <ul className="list-disc pr-6 space-y-2 text-muted-foreground">
              <li>ניווט באמצעות מקלדת בכל חלקי האתר</li>
              <li>תמיכה בקורא מסך (Screen Reader)</li>
              <li>אפשרות להגדלת טקסט</li>
              <li>אפשרות לשינוי ניגודיות צבעים</li>
              <li>תיאור טקסטואלי (alt) לתמונות</li>
              <li>מבנה כותרות היררכי ותקין</li>
              <li>התאמה לצפייה במכשירים ניידים</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">דרכי פנייה בנושא נגישות</h2>
            <p className="text-muted-foreground mb-4">
              אם נתקלתם בבעיית נגישות באתר, נשמח לקבל את פנייתכם כדי שנוכל לטפל בנושא:
            </p>
            <p className="text-muted-foreground">
              רכז נגישות: שמוליק מרציאנו<br />
              טלפון: <a href="tel:0523097444" className="text-accent hover:underline">052-309-7444</a><br />
              אימייל: <a href="mailto:info@seeld-ins.co.il" className="text-accent hover:underline">info@seeld-ins.co.il</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">תוכנות והתקנים נתמכים</h2>
            <p className="text-muted-foreground">
              האתר תוכנן לתמוך בדפדפנים הנפוצים (Chrome, Firefox, Safari, Edge) בגרסאותיהם 
              העדכניות, ובמכשירים ניידים מבוססי Android ו-iOS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">עדכון הצהרת הנגישות</h2>
            <p className="text-muted-foreground">
              הצהרה זו עודכנה לאחרונה במרץ 2026. אנו ממשיכים לפעול לשיפור הנגישות באתר 
              ועוקבים אחר ההתפתחויות בתחום.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Accessibility;
