import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { SERIF, MONO } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

// SEELD Bento: warm paper panels on ink gutters (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const faqCategories = [
  {
    id: "insurance",
    title: "ביטוח",
    questions: [
      { q: "למה חשוב לעשות ביטוח בריאות פרטי?", a: "ביטוח בריאות פרטי מאפשר גישה מהירה לרופאים מומחים, בדיקות מתקדמות וניתוחים ללא תורים ארוכים. הוא משלים את סל הבריאות הציבורי ומעניק שקט נפשי במקרה של מחלה." },
      { q: "מה ההבדל בין ביטוח חיים לביטוח למקרה מוות?", a: "ביטוח חיים הוא מושג רחב הכולל כיסוי למקרה מוות, אובדן כושר עבודה ומחלות קשות. ביטוח למקרה מוות הוא רכיב ספציפי שמשלם סכום חד-פעמי למוטבים במקרה פטירה." },
      { q: "האם כדאי לעשות ביטוח משכנתא דרך הבנק?", a: "לא בהכרח. ביטוח משכנתא דרך סוכן ביטוח עצמאי יכול לחסוך לכם אלפי שקלים בשנה. חובה להשוות הצעות לפני שמחליטים. הבנק חייב לקבל כל פוליסה שעומדת בתנאי המשכנתא." },
      { q: "מה זה ביטוח אובדן כושר עבודה ולמי זה חשוב?", a: "ביטוח אובדן כושר עבודה מבטיח תשלום חודשי אם לא תוכלו לעבוד בשל מחלה או תאונה. זה חיוני לכל עובד שכיר או עצמאי שתלוי בהכנסתו החודשית." },
      { q: "האם אני צריך ביטוח דירה אם אני שוכר?", a: "כן. ביטוח דירה לשוכרים (ביטוח צד ג׳ ותכולה) מגן על הרכוש האישי שלכם ועל אחריות כלפי צדדים שלישיים. העלות נמוכה יחסית והכיסוי משמעותי." },
    ],
  },
  {
    id: "pension",
    title: "פנסיה",
    questions: [
      { q: "מתי כדאי להתחיל לחסוך לפנסיה?", a: "ככל שמתחילים מוקדם יותר, כך ריבית דריבית עובדת לטובתכם. גם הפקדות קטנות בגיל צעיר יכולות להצטבר לסכומים משמעותיים לפרישה." },
      { q: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?", a: "קרן פנסיה היא מוצר קולקטיבי עם דמי ניהול נמוכים יותר וכולל כיסוי סיעודי. ביטוח מנהלים הוא מוצר אישי עם גמישות רבה יותר בהתאמת הכיסויים. כיום רוב העובדים החדשים מצטרפים לקרנות פנסיה." },
      { q: "האם אפשר למשוך כסף מהפנסיה לפני גיל פרישה?", a: "בדרך כלל לא, אלא במקרים חריגים כמו נכות, מחלה קשה או הכנסה נמוכה מאוד. משיכה מוקדמת כרוכה בתשלום מס ומפחיתה משמעותית את הקצבה העתידית." },
      { q: "כמה אחוזים מהשכר צריך להפריש לפנסיה?", a: "על פי חוק, מעסיק מפריש 6.5% ועובד 6% מהשכר. עצמאים חייבים להפריש לפחות 4.45% מההכנסה. מומלץ להפריש מעבר למינימום החוקי אם אפשר." },
    ],
  },
  {
    id: "savings",
    title: "חיסכון והשקעות",
    questions: [
      { q: "מה ההבדל בין קרן השתלמות לקופת גמל?", a: "קרן השתלמות ניתנת למשיכה לאחר 6 שנים (3 שנים לצורך השתלמות) עם פטור ממס רווחי הון. קופת גמל מיועדת לטווח ארוך ומשמשת כהשלמה לפנסיה." },
      { q: "מה זה גמל להשקעה?", a: "גמל להשקעה היא קופת חיסכון גמישה שמאפשרת משיכה בכל עת (בניכוי מס רווחי הון 25%). זו אלטרנטיבה מצוינת לפיקדון בבנק עם פוטנציאל תשואה גבוה יותר." },
      { q: "האם כדאי לפתוח חיסכון לילד?", a: "בהחלט. חיסכון לילד מאפשר צבירת הון לטווח ארוך. ניתן לפתוח קופת חיסכון ייעודית לילדים עם הטבות מס. ככל שמתחילים מוקדם יותר, הסכום שנצבר יהיה גדול יותר." },
      { q: "מה עדיף, לשים כסף בפיקדון או להשקיע?", a: "תלוי בטווח הזמן ורמת הסיכון שאתם מוכנים לקחת. לטווח קצר (עד שנתיים), פיקדון בטוח יותר. לטווח בינוני-ארוך, השקעה בשוק ההון נותנת פוטנציאל תשואה גבוה יותר." },
    ],
  },
  {
    id: "general",
    title: "כללי",
    questions: [
      { q: "למה לפנות לסוכן ביטוח ולא לקנות ישירות מחברת ביטוח?", a: "סוכן ביטוח עצמאי משווה בין כל חברות הביטוח בשוק ומתאים את הפוליסה לצרכים שלכם. הוא מלווה אתכם גם בעת תביעה ודואג לאינטרס שלכם, ללא עלות נוספת." },
      { q: "האם יש עלות לייעוץ ראשוני?", a: "לא. שיחת הייעוץ הראשונית ב-SEELD היא ללא עלות וללא התחייבות. נשמח להכיר אתכם ולהבין את הצרכים שלכם." },
      { q: "מה זה ׳חילוץ זכויות׳?", a: "חילוץ זכויות הוא תהליך שבו בודקים האם יש לכם כספים ׳שקטים׳: חסכונות פנסיוניים, ביטוחים ישנים או קופות גמל שנשכחו. אנחנו עוזרים לאתר ולמצות את כל הזכויות שלכם." },
      { q: "איך אני יודע שהביטוח שלי מתאים לי?", a: "מומלץ לעשות סקירת ביטוח אחת לשנה-שנתיים, או בכל שינוי משמעותי בחיים (נישואים, לידה, משכנתא, שינוי עבודה). צרו קשר ונשמח לבדוק את הכיסויים שלכם." },
      { q: "כמה זמן לוקח לעבור חברה?", a: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכל: טפסים, ניוד, בדיקה שלא נפגעים כיסויים קיימים." },
      { q: "מה קורה אם יש בעיה עם חברת הביטוח?", a: "שמוליק מטפל. זה בדיוק למה יש סוכן, שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם." },
      { q: "מה זה סריקת תיק?", a: "בדיקה של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים, ודמי ניהול גבוהים. בלי עלות ובלי התחייבות." },
    ],
  },
];

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5c5c5c] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors";

const FAQ = () => {
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
      <Header />

      {/* HERO — bento row: find your answer + the tiny orange tag tile */}
      <section className="px-2 pt-2">
        <div className="grid gap-2 lg:grid-cols-[1fr_auto] items-stretch">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10 w-full">
            <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
              <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span>←</span>
                <span className="text-[#171717]/70 font-medium">שאלות נפוצות</span>
              </nav>
              <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: PAPER_MUTED }}>
                שאלות ותשובות
              </span>
            </div>

            <h1
              className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              שאלות נפוצות
            </h1>
            <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9] mb-8">
              שאלות שכולם שואלים. תשובות שפחות שומעים.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
              className="block transition-transform hover:-translate-y-[1px]"
              aria-label="פתיחת שיחה עם יועץ SEELD"
            >
              <StatusPill>היועץ מחובר עכשיו · שאלו במקום לגלול</StatusPill>
            </button>
          </div></div>

          {/* Tiny orange tag tile beside the title */}
          <div className="bento-panel-orange flex lg:flex-col items-center justify-center gap-3 px-6 py-4 lg:py-8 lg:w-[120px]">
            <span
              className="text-[11px] tracking-[0.24em] font-semibold text-[#171717]/80 lg:[writing-mode:vertical-rl]"
              style={{ fontFamily: MONO }}
              dir="ltr"
            >
              Q&amp;A
            </span>
            <span className="text-[14px] font-semibold text-[#171717] whitespace-nowrap lg:[writing-mode:vertical-rl]">
              תשובות ישירות
            </span>
          </div>
        </div>
      </section>

      <main>
        {/* QUESTIONS — categories as underline tabs, all in one paper tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <Tabs defaultValue="insurance" dir="rtl">
                <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto">
                  {faqCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className={tabTriggerClass}>
                      {category.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {faqCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-0">
                    <div className="max-w-3xl">
                      <Accordion type="single" collapsible>
                        {category.questions.map((item, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`${category.id}-${idx}`}
                            className="border-b border-[#171717]/10 rounded-none px-0"
                          >
                            <AccordionTrigger className="text-start text-base font-medium text-[#171717] hover:no-underline py-5">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[#4d4d4d] leading-[1.85] pb-6 text-[14px] max-w-2xl">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </ScrollReveal>
          </div></div>
        </section>

        {/* CTA — the one next action (ink tile) */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-6">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                לא מצאתם תשובה?
              </h2>
              <p className="text-[#fafafa]/55 text-base leading-[1.85] mb-8 max-w-xl">
                שאלה על התיק שלכם היא לא שאלה נפוצה. בשביל זה יש בן אדם.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                צרו קשר
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
