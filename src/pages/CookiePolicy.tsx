import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight animate-slide-down">
            מדיניות עוגיות (Cookies)
          </h1>
          <p className="text-muted-foreground animate-slide-up stagger-1">
            עדכון אחרון: מרץ 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">מה הן עוגיות?</h2>
            <p className="text-muted-foreground">
              עוגיות (Cookies) הן קבצי טקסט קטנים שנשמרים במכשיר שלכם בעת ביקור באתר. 
              הן מאפשרות לאתר לזכור את העדפותיכם ולשפר את חוויית השימוש.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">סוגי העוגיות שאנו משתמשים בהן</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">עוגיות הכרחיות</h3>
            <p className="text-muted-foreground mb-4">
              עוגיות אלו נדרשות לתפקוד בסיסי של האתר, כגון שמירת העדפות נגישות, 
              מצב ערכת הנושא (בהיר/כהה), וניהול מפגשי משתמשים. לא ניתן לבטל עוגיות אלו.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">עוגיות פונקציונליות</h3>
            <p className="text-muted-foreground mb-4">
              עוגיות אלו מאפשרות לאתר לזכור בחירות שביצעתם (כגון שפה או אזור) 
              ולספק תכונות משופרות ומותאמות אישית.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">עוגיות אנליטיות</h3>
            <p className="text-muted-foreground">
              עוגיות אלו מסייעות לנו להבין כיצד מבקרים משתמשים באתר, אילו דפים 
              הם מבקרים ואילו שגיאות הם נתקלים בהן. מידע זה מסייע לנו לשפר את האתר.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">ניהול עוגיות</h2>
            <p className="text-muted-foreground">
              באפשרותכם לשלוט בעוגיות ולמחוק אותן דרך הגדרות הדפדפן שלכם. 
              שימו לב שביטול עוגיות עלול לפגוע בחוויית השימוש באתר ובחלק מהתכונות שלו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">עוגיות צד שלישי</h2>
            <p className="text-muted-foreground">
              ייתכן שחלק מהעוגיות באתר מוגדרות על ידי שירותי צד שלישי המופיעים בדפים שלנו, 
              כגון שירותי אנליטיקה. לא ניתן לנו לשלוט בעוגיות אלו ומומלץ לעיין 
              במדיניות הפרטיות של אותם שירותים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">יצירת קשר</h2>
            <p className="text-muted-foreground">
              לשאלות בנוגע למדיניות העוגיות, ניתן לפנות אלינו:<br />
              אימייל: <a href="mailto:info@seeld-ins.co.il" className="text-accent hover:underline">info@seeld-ins.co.il</a><br />
              טלפון: <a href="tel:0523097444" className="text-accent hover:underline">052-309-7444</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
