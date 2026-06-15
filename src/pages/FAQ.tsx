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
import { usePageMeta } from "@/hooks/usePageMeta";

const categoryColors = ["#d6157e", "#6b6fc4", "#3b3f99", "#f06ba8"];

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
      { q: "האם יש עלות לייעוץ ראשוני?", a: "לא. שיחת הייעוץ הראשונית ב-SEELD היא ללא עלות וללא התחייבות. נשמח להכיר אתכם ולהבין את הצרכים שלכם." },
      { q: "מה זה ׳חילוץ זכויות׳?", a: "חילוץ זכויות הוא תהליך שבו בודקים האם יש לכם כספים ׳שקטים׳ — חסכונות פנסיוניים, ביטוחים ישנים או קופות גמל שנשכחו. אנחנו עוזרים לאתר ולמצות את כל הזכויות שלכם." },
      { q: "איך אני יודע שהביטוח שלי מתאים לי?", a: "מומלץ לעשות סקירת ביטוח אחת לשנה-שנתיים, או בכל שינוי משמעותי בחיים (נישואים, לידה, משכנתא, שינוי עבודה). צרו קשר ונשמח לבדוק את הכיסויים שלכם." },
      { q: "כמה זמן לוקח לעבור חברה?", a: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכל — טפסים, ניוד, בדיקה שלא נפגעים כיסויים קיימים." },
      { q: "מה קורה אם יש בעיה עם חברת הביטוח?", a: "שמוליק מטפל. זה בדיוק למה יש סוכן — שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם." },
      { q: "מה זה סריקת תיק?", a: "בדיקה של כל מה שיש לכם — ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים, ודמי ניהול גבוהים. בלי עלות ובלי התחייבות." },
    ],
  },
];

const FAQ = () => {
  usePageMeta("שאלות נפוצות", "תשובות לשאלות הנפוצות על ביטוח, פנסיה, חיסכון והשירות של SEELD.");
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner - Bold design */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        {/* Solid colored circles */}
        <div className="absolute top-[12%] left-[6%] w-[90px] h-[90px] rounded-full bg-[#d6157e]" />
        <div className="absolute bottom-[18%] right-[7%] w-[60px] h-[60px] rounded-full bg-[#3b3f99]" />
        <div className="absolute top-[55%] left-[25%] w-[30px] h-[30px] rounded-full bg-[#6b6fc4]" />
        <div className="absolute top-[25%] right-[18%] w-[25px] h-[25px] rounded-full bg-[#f06ba8]" />

        {/* Dashed curved line */}
        <div className="absolute bottom-12 left-[12%] hidden lg:block">
          <svg width="140" height="90" viewBox="0 0 140 90" fill="none">
            <path d="M10 10 C 40 80, 100 80, 130 30" stroke="#1a1a4b" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="130,30 122,26 128,38" fill="#1a1a4b" opacity="0.12" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1a1a4b] mb-4 leading-tight">
            שאלות <span className="text-[#d6157e]">נפוצות</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            ריכזנו עבורכם תשובות לשאלות הנפוצות ביותר בתחומי ביטוח, פנסיה וחיסכון.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#1a1a4b] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1a1a4b] font-medium">שאלות נפוצות</span>
        </nav>
      </div>

      <main>
        {/* FAQ Categories */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl space-y-14">
              {faqCategories.map((category, catIdx) => (
                <div key={category.title}>
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[catIdx % categoryColors.length] }} />
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a4b]">
                      {category.title}
                    </h2>
                  </div>
                  <Accordion type="multiple" className="space-y-3">
                    {category.questions.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${catIdx}-${idx}`}
                        className="bg-[#f8f9fc] border border-[#1a1a4b]/[0.06] rounded-2xl px-6 overflow-hidden data-[state=open]:shadow-md data-[state=open]:shadow-[#1a1a4b]/[0.04] transition-all"
                      >
                        <AccordionTrigger className="text-right text-base font-bold text-[#1a1a4b] hover:no-underline py-5">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-500 leading-relaxed pb-5 text-sm sm:text-base">
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
        <section className="py-10 sm:py-16 bg-[#f8f9fc] relative overflow-hidden">
          <div className="absolute top-6 right-[8%] w-4 h-4 rounded-full bg-[#6b6fc4] hidden sm:block" />
          <div className="absolute bottom-10 left-[10%] w-3 h-3 rounded-full bg-[#f06ba8] hidden sm:block" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#1a1a4b] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute top-[-30px] right-[-30px] w-[90px] h-[90px] rounded-full bg-[#d6157e] opacity-20" />
              <div className="absolute bottom-[-20px] left-[-20px] w-[70px] h-[70px] rounded-full bg-[#3b3f99] opacity-15" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 relative">לא מצאתם <span className="text-[#d6157e]">תשובה?</span></h2>
              <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto relative">
                צרו איתנו קשר — נשמח לענות על כל שאלה ולתת ייעוץ מותאם אישית, ללא עלות.
              </p>
              <Link
                to="/contact"
                className="relative inline-block px-10 py-4 bg-[#d6157e] text-[#1a1a4b] font-bold rounded-full hover:bg-[#cc1672] transition-colors shadow-xl shadow-[#d6157e]/20 text-base"
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
