import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Cookie } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const CookiePolicy = () => {
  usePageMeta("מדיניות עוגיות");
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-6 left-10 w-20 h-20 rounded-full bg-[#f4a261] opacity-10" />
        <div className="absolute bottom-4 right-16 w-14 h-14 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f4a261] flex items-center justify-center">
              <Cookie className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d]">מדיניות עוגיות (Cookies)</h1>
              <p className="text-sm text-gray-400">עדכון אחרון: מרץ 2026</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">מה הן עוגיות?</h2>
            <p>
              עוגיות (Cookies) הן קבצי טקסט קטנים שנשמרים במכשיר שלכם בעת ביקור באתר.
              הן מאפשרות לאתר לזכור את העדפותיכם ולשפר את חוויית השימוש.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">סוגי העוגיות שאנו משתמשים בהן</h2>

            <div className="space-y-5 mt-4">
              <div className="bg-[#f8f9fc] rounded-xl p-5">
                <h3 className="text-base font-bold text-[#0a3d3d] mb-2">עוגיות הכרחיות</h3>
                <p>
                  עוגיות אלו נדרשות לתפקוד בסיסי של האתר, כגון שמירת העדפות נגישות,
                  מצב ערכת הנושא (בהיר/כהה), וניהול מפגשי משתמשים. לא ניתן לבטל עוגיות אלו.
                </p>
              </div>

              <div className="bg-[#f8f9fc] rounded-xl p-5">
                <h3 className="text-base font-bold text-[#0a3d3d] mb-2">עוגיות פונקציונליות</h3>
                <p>
                  עוגיות אלו מאפשרות לאתר לזכור בחירות שביצעתם (כגון שפה או אזור)
                  ולספק תכונות משופרות ומותאמות אישית.
                </p>
              </div>

              <div className="bg-[#f8f9fc] rounded-xl p-5">
                <h3 className="text-base font-bold text-[#0a3d3d] mb-2">עוגיות אנליטיות</h3>
                <p>
                  עוגיות אלו מסייעות לנו להבין כיצד מבקרים משתמשים באתר, אילו דפים
                  הם מבקרים ואילו שגיאות הם נתקלים בהן. מידע זה מסייע לנו לשפר את האתר.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">ניהול עוגיות</h2>
            <p>
              באפשרותכם לשלוט בעוגיות ולמחוק אותן דרך הגדרות הדפדפן שלכם.
              שימו לב שביטול עוגיות עלול לפגוע בחוויית השימוש באתר ובחלק מהתכונות שלו.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">עוגיות צד שלישי</h2>
            <p>
              ייתכן שחלק מהעוגיות באתר מוגדרות על ידי שירותי צד שלישי המופיעים בדפים שלנו,
              כגון שירותי אנליטיקה. לא ניתן לנו לשלוט בעוגיות אלו ומומלץ לעיין
              במדיניות הפרטיות של אותם שירותים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">יצירת קשר</h2>
            <div className="bg-[#f8f9fc] rounded-xl p-5">
              <p>לשאלות בנוגע למדיניות העוגיות, ניתן לפנות אלינו:</p>
              <p className="mt-2">אימייל: <a href="mailto:info@seeld-ins.co.il" className="text-[#5ec6c6] hover:underline">info@seeld-ins.co.il</a></p>
              <p>טלפון: <a href="tel:0523097444" className="text-[#5ec6c6] hover:underline">052-309-7444</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
