import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const faqCategories = [
  {
    title: "ביטוח",
    questions: [
      { q: "למה חשוב לעשות ביטוח בריאות פרטי?", a: "ביטוח בריאות פרטי מאפשר גישה מהירה לרופאים מומחים, בדיקות מתקדמות וניתוחים ללא תורים ארוכים. הוא משלים את סל הבריאות הציבורי ומעניק שקט נפשי במקרה של מחלה." },
      { q: "מה ההבדל בין ביטוח חיים לביטוח למקרה מוות?", a: "ביטוח חיים הוא מושג רחב הכולל כיסוי למקרה מוות, אובדן כושר עבודה ומחלות קשות. ביטוח למקרה מוות הוא רכיב ספציפי שמשלם סכום חד-פעמי למוטבים במקרה פטירה." },
      { q: "האם כדאי לעשות ביטוח משכנתא דרך הבנק?", a: "לא בהכרח. ביטוח משכנתא דרך סוכן ביטוח עצמאי יכול לחסוך לכם אלפי שקלים בשנה. חובה להשוות הצעות לפני שמחליטים. הבנק חייב לקבל כל פוליסה שעומדת בתנאי המשכנתא." },
      { q: "מה זה ביטוח אובדן כושר עבודה ולמי זה חשוב?", a: "ביטוח אובדן כושר עבודה מבטיח תשלום חודשי אם לא תוכלו לעבוד בשל מחלה או תאונה. זה חיוני לכל עובד שכיר או עצמאי שתלוי בהכנסתו החודשית." },
      { q: "האם אני צריך ביטוח דירה אם אני שוכר?", a: "כן! ביטוח דירה לשוכרים (ביטוח צד ג׳ ותכולה) מגן על הרכוש האישי שלכם ועל אחריות כלפי צדדים שלישיים. העלות נמוכה יחסית והכיסוי משמעותי." },
    ],
  },
  {
    title: "פנסיה",
    questions: [
      { q: "מתי כדאי להתחיל לחסוך לפנסיה?", a: "ככל שמתחילים מוקדם יותר, כך ריבית דריבית עובדת לטובתכם. גם הפקדות קטנות בגיל צעיר יכולות להצטבר לסכומים משמעותיים לפרישה." },
      { q: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?", a: "קרן פנסיה היא מוצר קולקטיבי עם דמי ניהול נמוכים יותר וכולל כיסוי סיעודי. ביטוח מנהלים הוא מוצר אישי עם גמישות רבה יותר בהתאמת הכיסויים. כיום רוב העובדים החדשים מצטרפים לקרנות פנסיה." },
      { q: "האם אפשר למשוך כסף מהפנסיה לפני גיל פרישה?", a: "בדרך כלל לא, אלא במקרים חריגים כמו נכות, מחלה קשה או הכנסה נמוכה מאוד. משיכה מוקדמת כרוכה בתשלום מס ומפחיתה משמעותית את הקצבה העתידית." },
      { q: "כמה אחוזים מהשכר צריך להפריש לפנסיה?", a: "על פי חוק, מעסיק מפריש 6.5% ועובד 6% מהשכר. עצמאים חייבים להפריש לפחות 4.45% מההכנסה. מומלץ להפריש מעבר למינימום החוקי אם אפשר." },
    ],
  },
  {
    title: "חיסכון והשקעות",
    questions: [
      { q: "מה ההבדל בין קרן השתלמות לקופת גמל?", a: "קרן השתלמות ניתנת למשיכה לאחר 6 שנים (3 שנים לצורך השתלמות) עם פטור ממס רווחי הון. קופת גמל מיועדת לטווח ארוך ומשמשת כהשלמה לפנסיה." },
      { q: "מה זה גמל להשקעה?", a: "גמל להשקעה היא קופת חיסכון גמישה שמאפשרת משיכה בכל עת (בניכוי מס רווחי הון 25%). זו אלטרנטיבה מצוינת לפיקדון בבנק עם פוטנציאל תשואה גבוה יותר." },
      { q: "האם כדאי לפתוח חיסכון לילד?", a: "בהחלט. חיסכון לילד מאפשר צבירת הון לטווח ארוך. ניתן לפתוח קופת חיסכון ייעודית לילדים עם הטבות מס. ככל שמתחילים מוקדם יותר, הסכום שנצבר יהיה גדול יותר." },
      { q: "מה עדיף — לשים כסף בפיקדון או להשקיע?", a: "תלוי בטווח הזמן ורמת הסיכון שאתם מוכנים לקחת. לטווח קצר (עד שנתיים) — פיקדון בטוח יותר. לטווח בינוני-ארוך — השקעה בשוק ההון נותנת פוטנציאל תשואה גבוה יותר." },
    ],
  },
  {
    title: "כללי",
    questions: [
      { q: "למה לפנות לסוכן ביטוח ולא לקנות ישירות מחברת ביטוח?", a: "סוכן ביטוח עצמאי משווה בין כל חברות הביטוח בשוק ומתאים את הפוליסה לצרכים שלכם. הוא מלווה אתכם גם בעת תביעה ודואג לאינטרס שלכם — ללא עלות נוספת." },
      { q: "האם יש עלות לייעוץ ראשוני?", a: "לא. שיחת הייעוץ הראשונית ב-SeelD היא ללא עלות וללא התחייבות. נשמח להכיר אתכם ולהבין את הצרכים שלכם." },
      { q: "מה זה ׳חילוץ זכויות׳?", a: "חילוץ זכויות הוא תהליך שבו בודקים האם יש לכם כספים ׳שקטים׳ — חסכונות פנסיוניים, ביטוחים ישנים או קופות גמל שנשכחו. אנחנו עוזרים לאתר ולמצות את כל הזכויות שלכם." },
      { q: "איך אני יודע שהביטוח שלי מתאים לי?", a: "מומלץ לעשות סקירת ביטוח אחת לשנה-שנתיים, או בכל שינוי משמעותי בחיים (נישואים, לידה, משכנתא, שינוי עבודה). צרו קשר ונשמח לבדוק את הכיסויים שלכם." },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#0a3d3d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            שאלות נפוצות
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            ריכזנו עבורכם תשובות לשאלות הנפוצות ביותר בתחומי ביטוח, פנסיה וחיסכון.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">שאלות נפוצות</span>
        </nav>
      </div>

      <main>
        {/* FAQ Categories */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl space-y-14">
              {faqCategories.map((category, catIdx) => (
                <div key={category.title}>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d] mb-5 pb-3 border-b border-gray-100">
                    {category.title}
                  </h2>
                  <Accordion type="multiple" className="space-y-3">
                    {category.questions.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${catIdx}-${idx}`}
                        className="bg-white border border-gray-200 rounded-2xl px-6 overflow-hidden data-[state=open]:shadow-sm"
                      >
                        <AccordionTrigger className="text-right text-base font-semibold text-[#0a3d3d] hover:no-underline py-5">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 leading-relaxed pb-5 text-sm sm:text-base">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">לא מצאתם תשובה?</h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                צרו איתנו קשר — נשמח לענות על כל שאלה ולתת ייעוץ מותאם אישית, ללא עלות.
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#5ec6c6] text-[#0a3d3d] font-semibold rounded-full hover:bg-[#4db5b5] transition-colors"
              >
                צרו קשר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
