import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const faqCategories = [
  {
    title: "ביטוח",
    icon: "🛡️",
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
    icon: "📊",
    questions: [
      { q: "מתי כדאי להתחיל לחסוך לפנסיה?", a: "ככל שמתחילים מוקדם יותר, כך ריבית דריבית עובדת לטובתכם. גם הפקדות קטנות בגיל צעיר יכולות להצטבר לסכומים משמעותיים לפרישה." },
      { q: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?", a: "קרן פנסיה היא מוצר קולקטיבי עם דמי ניהול נמוכים יותר וכולל כיסוי סיעודי. ביטוח מנהלים הוא מוצר אישי עם גמישות רבה יותר בהתאמת הכיסויים. כיום רוב העובדים החדשים מצטרפים לקרנות פנסיה." },
      { q: "האם אפשר למשוך כסף מהפנסיה לפני גיל פרישה?", a: "בדרך כלל לא, אלא במקרים חריגים כמו נכות, מחלה קשה או הכנסה נמוכה מאוד. משיכה מוקדמת כרוכה בתשלום מס ומפחיתה משמעותית את הקצבה העתידית." },
      { q: "כמה אחוזים מהשכר צריך להפריש לפנסיה?", a: "על פי חוק, מעסיק מפריש 6.5% ועובד 6% מהשכר. עצמאים חייבים להפריש לפחות 4.45% מההכנסה. מומלץ להפריש מעבר למינימום החוקי אם אפשר." },
    ],
  },
  {
    title: "חיסכון והשקעות",
    icon: "💰",
    questions: [
      { q: "מה ההבדל בין קרן השתלמות לקופת גמל?", a: "קרן השתלמות ניתנת למשיכה לאחר 6 שנים (3 שנים לצורך השתלמות) עם פטור ממס רווחי הון. קופת גמל מיועדת לטווח ארוך ומשמשת כהשלמה לפנסיה." },
      { q: "מה זה גמל להשקעה?", a: "גמל להשקעה היא קופת חיסכון גמישה שמאפשרת משיכה בכל עת (בניכוי מס רווחי הון 25%). זו אלטרנטיבה מצוינת לפיקדון בבנק עם פוטנציאל תשואה גבוה יותר." },
      { q: "האם כדאי לפתוח חיסכון לילד?", a: "בהחלט. חיסכון לילד מאפשר צבירת הון לטווח ארוך. ניתן לפתוח קופת חיסכון ייעודית לילדים עם הטבות מס. ככל שמתחילים מוקדם יותר, הסכום שנצבר יהיה גדול יותר." },
      { q: "מה עדיף — לשים כסף בפיקדון או להשקיע?", a: "תלוי בטווח הזמן ורמת הסיכון שאתם מוכנים לקחת. לטווח קצר (עד שנתיים) — פיקדון בטוח יותר. לטווח בינוני-ארוך — השקעה בשוק ההון נותנת פוטנציאל תשואה גבוה יותר." },
    ],
  },
  {
    title: "כללי",
    icon: "❓",
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
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="mb-16 text-center space-y-6 relative">
          <div className="absolute top-0 left-4 hidden md:block">
            <DoodleDecoration type="lightbulb" size="lg" className="opacity-25 rotate-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            שאלות נפוצות
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed animate-slide-up stagger-1">
            ריכזנו עבורכם תשובות לשאלות הנפוצות ביותר בתחומי ביטוח, פנסיה וחיסכון.
          </p>
        </div>

        {/* FAQ Categories */}
        {faqCategories.map((category, catIdx) => (
          <ScrollReveal key={category.title} delay={catIdx * 80}>
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.title}
              </h2>
              <div className="rounded-2xl bg-card p-4 md:p-6">
                <Accordion type="multiple" className="space-y-2">
                  {category.questions.map((item, idx) => (
                    <AccordionItem key={idx} value={`${catIdx}-${idx}`} className="border-b border-border/40 last:border-0">
                      <AccordionTrigger className="text-right text-base font-medium hover:no-underline py-4">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          </ScrollReveal>
        ))}

        <LogoDotsDivider />

        {/* CTA */}
        <ScrollReveal direction="scale">
          <section className="text-center py-12 rounded-2xl bg-card relative overflow-hidden mt-8">
            <div className="absolute top-4 right-4 hidden md:block">
              <DoodleDecoration type="shield" size="sm" className="opacity-20 rotate-12" />
            </div>
            <h2 className="text-3xl font-bold mb-4">לא מצאתם תשובה?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
              צרו איתנו קשר — נשמח לענות על כל שאלה ולתת ייעוץ מותאם אישית, ללא עלות.
            </p>
            <Link to="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
                <Mail className="ml-2 h-4 w-4" />
                צרו קשר
              </Button>
            </Link>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
