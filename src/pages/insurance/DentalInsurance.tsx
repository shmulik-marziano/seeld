import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Smile, Shield, Star, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const DentalInsurance = () => {
  const faqItems = [
    {
      q: "האם ביטוח שיניים מכסה שתלים?",
      a: "כן, רוב הפוליסות כוללות כיסוי לשתלים דנטליים, אם כי בדרך כלל לאחר תקופת אכשרה של 12-18 חודשים ועם תקרת כיסוי מוגדרת. השתתפות עצמית מופחתת יכולה לחסוך אלפי שקלים.",
    },
    {
      q: "מה כולל הכיסוי לילדים?",
      a: "ביטוח שיניים לילדים כולל בדרך כלל טיפולים משמרים, אורתודונטיה (יישור שיניים), ציפויי פלואוריד, וסתימות. זהו אחד הרכיבים המשתלמים ביותר בביטוח שיניים משפחתי.",
    },
    {
      q: "האם אפשר לבחור רופא שיניים?",
      a: "בהתאם לפוליסה, תוכלו לבחור מתוך רשת רופאי שיניים בהסכם (עם הנחות משמעותיות) או לפנות לכל רופא שיניים ולקבל החזר חלקי. פוליסות מסוימות מציעות גם שילוב של שני המסלולים.",
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
              <Smile className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח שיניים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח שיניים
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            כיסוי מקיף לטיפולי שיניים — משמרים, שיקומיים וקוסמטיים. חסכו אלפי שקלים על שתלים, כתרים ויישור שיניים.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח שיניים</span>
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
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">טיפולים משמרים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  סתימות, ניקוי אבנית וטיפולי שורש — כיסוי מלא לטיפולים הבסיסיים החיוניים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Smile className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">שיקום הפה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כתרים, גשרים ושתלים דנטליים — חסכו אלפי שקלים על טיפולים שיקומיים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">יישור שיניים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  טיפולי אורתודונטיה לילדים ומבוגרים — חיוך ישר ובריא בעלות מופחתת.
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
                  טיפולי שיניים הם מהיקרים ביותר בתחום הרפואה בישראל, וסל הבריאות הציבורי כמעט אינו מכסה אותם. שתל דנטלי בודד עולה אלפי שקלים, כתר או גשר יכולים להגיע לעשרות אלפים, ויישור שיניים לילד עולה לעתים יותר מ-20,000 שקלים. ללא ביטוח שיניים, טיפולים אלו הופכים לנטל כלכלי משמעותי.
                </p>
                <p>
                  ביטוח שיניים מאפשר לכם לקבל טיפולים איכותיים בעלות מופחתת בהרבה. הפוליסה מכסה מגוון רחב של טיפולים — מטיפולים משמרים בסיסיים כמו סתימות וניקוי, דרך טיפולים שיקומיים כמו כתרים ושתלים, ועד יישור שיניים לילדים ומבוגרים.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הזמן הטוב ביותר לרכוש ביטוח שיניים הוא לפני שאתם צריכים טיפול יקר. ברוב הפוליסות יש תקופת אכשרה של מספר חודשים לטיפולים שיקומיים, כך שכדאי להצטרף מוקדם. אם יש לכם ילדים — ביטוח שיניים הוא חיוני במיוחד לתקופת יישור השיניים.
                </p>
                <p>
                  מומלץ לרכוש ביטוח שיניים גם אם אתם חושבים שהשיניים שלכם בסדר. בדיקות שגרתיות וניקוי אבנית תקופתי חיוניים למניעת בעיות עתידיות, וביטוח שיניים מכסה גם את הטיפולים המונעים האלו.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח שיניים, שימו לב לתקופות האכשרה (בדרך כלל 3-6 חודשים לטיפולים משמרים ו-12-18 חודשים לטיפולים שיקומיים), תקרות הכיסוי לכל סוג טיפול, רשימת רופאי השיניים בהסכם, וגובה ההשתתפות העצמית. חברות שונות מציעות תנאים שונים מהותית.
                </p>
                <p>
                  ב-SEELD אנחנו יודעים שביטוח שיניים הוא אחד הביטוחים הכי שווים לכל משפחה. נשווה עבורכם את כל ההצעות ונמצא את הפוליסה שנותנת לכם את הכיסוי הרחב ביותר במחיר הטוב ביותר.
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
                insuranceType="dental"
                title="הצטרפות לביטוח שיניים"
                description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח שיניים"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DentalInsurance;
