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
import {
  DISPLAY, LINE, MUTED, NAVY, PASTEL_BLUE, PASTEL_PEACH,
} from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

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

// Underline tabs — turquoise active marker, navy active text
const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5a6a78] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — find your answer */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 210, height: 210, bottom: -110, right: -70, backgroundColor: PASTEL_PEACH, opacity: 0.5 }}
            />
            {/* The playful gesture: a giant background question mark (Frank Ruhl 900, decorative) */}
            <div
              className="hidden lg:block absolute select-none"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                color: NAVY,
                opacity: 0.05,
                fontSize: "clamp(180px, 22vw, 320px)",
                lineHeight: 1,
                left: "6%",
                top: "-4%",
              }}
            >
              ?
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>שאלות נפוצות</span>
            </nav>

            <h1
              className="dna-display leading-[1.12] mb-6 max-w-3xl"
              style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
            >
              שאלות נפוצות
            </h1>
            <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9] mb-8" style={{ color: MUTED }}>
              שאלות שכולם שואלים. תשובות שפחות שומעים.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
              className="block dna-hover rounded-full"
              aria-label="פתיחת שיחה עם יועץ SEELD"
            >
              <StatusPill>היועץ מחובר עכשיו · שאלו במקום לגלול</StatusPill>
            </button>
          </div>
        </section>

        {/* QUESTIONS — categories as underline tabs */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <Tabs defaultValue="insurance" dir="rtl">
                <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto">
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
                            className="border-b border-[#E7EDF1] rounded-none px-0"
                          >
                            <AccordionTrigger className="text-base font-medium hover:no-underline py-5 px-3 -mx-3 rounded-md text-[#1D2D3D] text-start hover:bg-[#E1EAF1]/35 transition-colors">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[14.5px] leading-[1.85] pb-6 max-w-2xl text-[#3a4c5a]">
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
          </div>
        </section>

        {/* CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <h2
              className="text-white leading-tight mb-3"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)",
                letterSpacing: "-0.5px",
              }}
            >
              לא מצאתם תשובה?
            </h2>
            <p className="text-base leading-[1.85] mb-9 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              שאלה על התיק שלכם היא לא שאלה נפוצה. בשביל זה יש בן אדם.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
            >
              צרו קשר
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
