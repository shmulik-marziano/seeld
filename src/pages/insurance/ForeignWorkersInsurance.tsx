import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Users, Globe, Shield, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const ForeignWorkersInsurance = () => {
  const faqItems = [
    {
      q: "האם ביטוח עובדים זרים הוא חובה על פי חוק?",
      a: "כן, על פי חוק ביטוח בריאות ממלכתי וחוק עובדים זרים, כל מעסיק חייב לספק ביטוח בריאות לעובד זר. אי עמידה בחובה זו עלולה להוביל לקנסות ולאחריות אישית על הוצאות רפואיות.",
    },
    {
      q: "מה הכיסוי המינימלי הנדרש?",
      a: "הכיסוי המינימלי כולל אשפוז, ניתוחים, בדיקות רפואיות, ביקורי רופא ותרופות. חלק מהפוליסות כוללות גם טיפולי שיניים חירום, ייעוץ נפשי ושירותי אמבולנס.",
    },
    {
      q: "האם הביטוח מכסה גם את בני משפחת העובד?",
      a: "ישנן פוליסות שמציעות הרחבה לבני משפחה של העובד הזר השוהים בישראל. זוהי הרחבה אופציונלית שכדאי לשקול, במיוחד אם בן/בת הזוג והילדים נמצאים בארץ.",
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
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח עובדים זרים ותיירים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח עובדים זרים ותיירים
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ביטוח בריאות לעובדים זרים ותיירים בישראל כנדרש בחוק — עמידה בדרישות החוק והגנה על העובדים.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח עובדים זרים ותיירים</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי רפואי</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  אשפוז, ניתוחים וטיפולים רפואיים בישראל לעובדים זרים ותיירים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">עמידה בחוק</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  ביטוח העונה על דרישות החוק להעסקת עובדים זרים בישראל.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">שירות 24/7</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  מוקד שירות זמין בשפות שונות — סיוע בכל שעה לעובדים ולמעסיקים.
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
                  על פי חוק, כל מעסיק בישראל חייב לספק ביטוח בריאות לעובדים זרים שמועסקים אצלו. העובדים הזרים אינם זכאים לשירותי בריאות דרך קופות החולים, ולכן ביטוח פרטי הוא הדרך היחידה להבטיח להם טיפול רפואי הולם. אי עמידה בחובה זו חושפת את המעסיק לקנסות כבדים ולתביעות.
                </p>
                <p>
                  ביטוח עובדים זרים מכסה אשפוז, ניתוחים, ביקורים אצל רופאים, בדיקות ותרופות. הוא מספק שקט נפשי למעסיק ולעובד כאחד, ומבטיח שבמקרה של מצב רפואי, העובד יקבל את הטיפול הדרוש ללא דיחוי.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח עובדים זרים חייב להיות בתוקף מהיום הראשון של ההעסקה. מעסיקים צריכים לדאוג לפוליסה לפני כניסת העובד לעבודה. אם מדובר בתייר שמגיע לביקור בישראל, מומלץ לרכוש ביטוח עוד לפני ההגעה לארץ.
                </p>
                <p>
                  חשוב לחדש את הביטוח בזמן ולא לאפשר פער בכיסוי. פער ביטוחי חושף את המעסיק לאחריות אישית על הוצאות רפואיות של העובד, שיכולות להגיע לסכומים גבוהים מאוד.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח עובדים זרים צריך לעמוד בדרישות המינימליות של החוק, הכוללות כיסוי רפואי בסיסי כולל אשפוז, ניתוחים ותרופות. ישנן פוליסות בסיסיות ופוליסות מורחבות — הבחירה תלויה בצרכים ובתקציב. שימו לב גם לשירות בשפות שונות, שחשוב לעובדים שאינם דוברי עברית.
                </p>
                <p>
                  ב-SeelD אנחנו מתמחים בהתאמת ביטוח עובדים זרים למעסיקים מכל הסוגים — ממשפחות המעסיקות מטפלות סיעודיות ועד חברות עם עשרות עובדים. נמצא לכם את הפוליסה שעומדת בדרישות החוק ובמחיר הטוב ביותר.
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
                insuranceType="foreign-workers"
                title="הצטרפות לביטוח עובדים זרים"
                description="מלאו את הפרטים וקבלו הצעה מותאמת אישית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForeignWorkersInsurance;
