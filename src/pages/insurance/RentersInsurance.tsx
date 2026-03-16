import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Package, Shield, Key, Droplets, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const RentersInsurance = () => {
  const faqItems = [
    {
      q: "האם ביטוח תכולה מכסה גם נזקי מים?",
      a: "כן, רוב הפוליסות כוללות כיסוי לנזקי הצפה ונזילות מים, כולל נזקים שנגרמים לשכנים כתוצאה מהצפה בדירתכם. חשוב לוודא שהכיסוי כולל גם צנרת תת-רצפתית.",
    },
    {
      q: "מה ההבדל בין ביטוח תכולה לביטוח דירה?",
      a: "ביטוח דירה מכסה את המבנה עצמו (קירות, גג, צנרת) והוא באחריות הבעלים. ביטוח תכולה מכסה את הרכוש שבתוך הדירה — רהיטים, מכשירים ופריטים אישיים — והוא רלוונטי במיוחד לשוכרים.",
    },
    {
      q: "כמה עולה ביטוח תכולה לשוכרים?",
      a: "ביטוח תכולה לשוכרים הוא מהביטוחים המשתלמים ביותר, עם עלות של כ-50-150 שקלים בחודש בהתאם לשווי התכולה, מיקום הדירה ורמת הכיסוי.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="absolute bottom-6 right-12 w-14 h-14 rounded-full bg-[#e76f51] opacity-12" />
        <div className="absolute top-16 right-1/3 w-8 h-8 rounded-full bg-[#f4a261] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#e76f51] flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח תכולה לשוכרים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח תכולה לשוכרים
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            הגנה על הרכוש האישי שלכם בדירה שכורה — רהיטים, מכשירי חשמל ופריטים אישיים מכוסים מפני נזק, גניבה והצפה.
          </p>
          <div className="mt-6">
            <a href="#contact-form" className="inline-flex items-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              קבלו הצעה מותאמת
            </a>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link to="/insurance" className="hover:text-[#0a3d3d] transition-colors">ביטוח</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">ביטוח תכולה לשוכרים</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">תכולת הדירה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כיסוי מלא לרהיטים, בגדים ומכשירי חשמל שלכם מפני שריפה, הצפה, פריצה ונזקי טבע.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">פריצה וגניבה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  פיצוי במקרה של פריצה לדירה או גניבת רכוש, כולל מכשירים אלקטרוניים ותכשיטים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">אחריות כלפי המשכיר</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כיסוי לנזקים שנגרמו למבנה הדירה ואחריות כלפי צד שלישי כמו שכנים.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Article Content */}
        <section className="pb-10 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה זה חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כשוכרי דירה, אתם נוטים לחשוב שהמשכיר אחראי על כל נזק שיקרה. אבל האמת שונה — תכולת הדירה שלכם, כולל רהיטים, מכשירי חשמל, בגדים ופריטים אישיים, היא באחריותכם בלבד. שריפה, הצפה, פריצה או רעידת אדמה יכולים למחוק את כל רכושכם בתוך דקות, וללא ביטוח תכולה תיאלצו לשאת בעלות השיקום מכיסכם.
                </p>
                <p>
                  ביטוח תכולה לשוכרים מעניק לכם שקט נפשי בעלות חודשית נמוכה במיוחד. הפוליסה מכסה את כל הפריטים שלכם בדירה, ובמקרים רבים כוללת גם אחריות כלפי צד שלישי — למשל אם הצפה בדירתכם גרמה נזק לשכנים. זוהי הגנה בסיסית שכל שוכר חייב לשקול.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הזמן האידיאלי לרכוש ביטוח תכולה הוא ביום שבו אתם נכנסים לדירה חדשה. לא כדאי לחכות לאירוע כדי להבין שאתם חשופים. גם אם אתם גרים בדירה כבר זמן מה ועדיין אין לכם ביטוח — עכשיו זה הרגע לתקן את זה. פוליסה חדשה נכנסת לתוקף מיידית ברוב המקרים.
                </p>
                <p>
                  במיוחד כדאי לבדוק ביטוח תכולה כשאתם רוכשים ריהוט או מכשירי חשמל יקרים, כשאתם עוברים לאזור עם סיכון גבוה יותר לפריצות, או כשמשפחתכם גדלה ותכולת הבית שלכם מתרחבת.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כשאתם בוחרים ביטוח תכולה, שימו לב לשווי התכולה שאתם מצהירים עליו — הערכת חסר עלולה לגרום לכך שתקבלו פיצוי חלקי בלבד. חשוב גם לבדוק אם הפוליסה כוללת כיסוי לפריצה, כיסוי לנזקי טבע, ואחריות כלפי צד שלישי. השתתפות עצמית היא גורם מפתח שמשפיע על הפרמיה.
                </p>
                <p>
                  ב-SeelD אנחנו משווים עבורכם את כל ההצעות מחברות הביטוח המובילות, ומוצאים את הפוליסה שמתאימה בדיוק לסוג הדירה, התכולה והתקציב שלכם — ללא עלות נוספת עבורכם.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">שאלות נפוצות</h2>
              <Accordion type="multiple" className="space-y-3">
                {faqItems.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
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
          </div>
        </section>

        {/* Companies Badges */}
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-3">חברות שאנחנו משווקים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">
              אנחנו עובדים עם חברות הביטוח המובילות בישראל כדי להביא לכם את ההצעה הטובה ביותר
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {companies.map((company) => (
                <span
                  key={company}
                  className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#0a3d3d] border border-gray-200 hover:border-[#5ec6c6] hover:shadow-sm transition-all"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Lead Form CTA */}
        <section id="contact-form" className="py-10 sm:py-16 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-12 text-center mb-10 relative overflow-hidden">
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#5ec6c6] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#f4a261] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="renters"
                title="הצטרפות לביטוח תכולה לשוכרים"
                description="מלאו את הפרטים לקבלת הצעה מותאמת אישית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RentersInsurance;
