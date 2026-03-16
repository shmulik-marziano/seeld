import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accessibility as AccessibilityIcon } from "lucide-react";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-6 left-10 w-20 h-20 rounded-full bg-[#90be6d] opacity-10" />
        <div className="absolute bottom-4 right-16 w-14 h-14 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#90be6d] flex items-center justify-center">
              <AccessibilityIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d]">הצהרת נגישות</h1>
              <p className="text-sm text-gray-400">עדכון אחרון: מרץ 2026</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">מחויבות לנגישות</h2>
            <p>
              SEELD פיננסים וביטוח מחויבת להנגשת האתר והשירותים הדיגיטליים שלה לכלל האוכלוסייה,
              לרבות אנשים עם מוגבלויות, וזאת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות,
              תשנ"ח-1998, ולתקנות הנגישות שהותקנו מכוחו.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">תקן הנגישות</h2>
            <p>
              אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
              התשע"ג-2013, ברמת AA לפי תקן WCAG 2.1 של ארגון W3C.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">התאמות הנגישות באתר</h2>
            <ul className="list-disc pr-6 space-y-2">
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
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">דרכי פנייה בנושא נגישות</h2>
            <p className="mb-4">
              אם נתקלתם בבעיית נגישות באתר, נשמח לקבל את פנייתכם כדי שנוכל לטפל בנושא:
            </p>
            <div className="bg-[#f8f9fc] rounded-xl p-5 space-y-1">
              <p><strong className="text-[#0a3d3d]">רכז נגישות:</strong> שמוליק מרציאנו</p>
              <p>טלפון: <a href="tel:0523097444" className="text-[#5ec6c6] hover:underline">052-309-7444</a></p>
              <p>אימייל: <a href="mailto:info@seeld-ins.co.il" className="text-[#5ec6c6] hover:underline">info@seeld-ins.co.il</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">תוכנות והתקנים נתמכים</h2>
            <p>
              האתר תוכנן לתמוך בדפדפנים הנפוצים (Chrome, Firefox, Safari, Edge) בגרסאותיהם
              העדכניות, ובמכשירים ניידים מבוססי Android ו-iOS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0a3d3d] mb-3">עדכון הצהרת הנגישות</h2>
            <p>
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
