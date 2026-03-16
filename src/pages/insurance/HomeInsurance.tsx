import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Home, Shield, Flame, CheckCircle, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const HomeInsurance = () => {
  const coverageTypes = [
    {
      title: "ביטוח מבנה",
      icon: Shield,
      color: "#5ec6c6",
      items: ["נזקי שריפה", "נזקי רעידת אדמה", "נזקי סערה"],
    },
    {
      title: "ביטוח תכולה",
      icon: Home,
      color: "#f4a261",
      items: ["ריהוט וציוד", "מכשירי חשמל", "תכשיטים ויקרי ערך"],
    },
    {
      title: "כיסויים מורחבים",
      icon: Flame,
      color: "#e76f51",
      items: ["שריפה ופיצוץ", "נזקי מים", "פריצה וגניבה"],
    },
  ];

  const faqItems = [
    {
      q: "האם שוכר דירה צריך ביטוח?",
      a: "בהחלט. גם אם ביטוח המבנה הוא באחריות הבעלים, ביטוח תכולה מגן על הרכוש האישי שלכם - ריהוט, מכשירי חשמל, ביגוד ועוד. זהו ביטוח זול יחסית שמעניק הגנה חשובה.",
    },
    {
      q: "מה ההבדל בין ביטוח מבנה לביטוח תכולה?",
      a: "ביטוח מבנה מכסה את המבנה הפיזי של הדירה (קירות, רצפה, תקרה, צנרת). ביטוח תכולה מכסה את כל מה שבתוך הדירה - ריהוט, ביגוד, מכשירי חשמל ורכוש אישי. מומלץ לרכוש את שניהם.",
    },
    {
      q: "כמה עולה ביטוח דירה?",
      a: "ביטוח תכולה בלבד יכול לעלות כ-300-800 שקלים בשנה. ביטוח מבנה + תכולה מקיף נע בין 800 ל-2,500 שקלים בשנה, בהתאם לגודל הדירה, המיקום וסכומי הביטוח.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-8 left-12 w-20 h-20 rounded-full bg-[#f4a261] opacity-12" />
        <div className="absolute bottom-10 right-8 w-16 h-16 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="absolute top-16 right-1/4 w-10 h-10 rounded-full bg-[#90be6d] opacity-18" />
        <div className="absolute bottom-8 left-1/3 w-6 h-6 rounded-full bg-[#e76f51] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#f4a261] flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח דירה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            הגנה מקיפה על <span className="text-[#f4a261]">הבית שלכם</span>
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ביטוח דירה מגן עליכם ועל הרכוש היקר שלכם מפני נזקים בלתי צפויים - שריפה, פריצה, נזקי מים ועוד.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#enrollment-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              להצטרפות ל-SeelD
            </a>
            <a href="#coverage" className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              סוגי כיסויים
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
          <span className="text-[#0a3d3d] font-medium">ביטוח דירה</span>
        </nav>
      </div>

      <main>
        {/* Coverage Types */}
        <section id="coverage" className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">הגנה מקסימלית על הדירה והתכולה שלכם</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverageTypes.map((coverage, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: coverage.color }}>
                      <coverage.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a3d3d]">{coverage.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {coverage.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-gray-600 text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: coverage.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="pb-10 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה ביטוח דירה חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הדירה היא הנכס היקר ביותר שברשותכם. נזק מאש, הצפה, רעידת אדמה או פריצה יכול לגרום להפסדים כלכליים עצומים ללא ביטוח מתאים. ביטוח דירה מגן על המבנה ועל התכולה שלכם, ומעניק לכם שקט נפשי לדעת שבמקרה חירום, לא תישארו לבד מול הנזק.
                </p>
                <p>
                  חשוב לדעת שביטוח מבנה הוא חובה על פי חוק לדירות בבתים משותפים (באחריות ועד הבית), אך ביטוח תכולה הוא באחריותכם האישית. שילוב של ביטוח מבנה ותכולה מעניק הגנה מקסימלית.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש ביטוח דירה?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח דירה רלוונטי ברגע שיש לכם דירה - בין אם בבעלות ובין אם בשכירות. שוכרים צריכים לפחות ביטוח תכולה להגנה על הריהוט והציוד האישי שלהם. בעלי דירות צריכים גם ביטוח מבנה וגם ביטוח תכולה.
                </p>
                <p>
                  מומלץ לרכוש ביטוח דירה מיד עם כניסה לדירה חדשה, ולחדש אותו מדי שנה תוך בחינת ההצעות בשוק. שינויים כמו שיפוץ, רכישת ציוד יקר או הוספת חדר מחייבים עדכון של סכומי הביטוח.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  וודאו שסכום ביטוח המבנה תואם את עלות הבנייה מחדש (לא שווי השוק), ושסכום ביטוח התכולה מכסה את שווי כל הרכוש בדירה. שימו לב להחרגות כמו נזקי רטיבות כרוניים, בלאי טבעי, ונזקים שנגרמו ברשלנות. בדקו גם את גובה ההשתתפות העצמית ואת הכיסוי לצד שלישי.
                </p>
                <p>
                  ב-SeelD נעזור לכם לבנות פוליסה מותאמת אישית שמכסה בדיוק את מה שאתם צריכים, במחיר הטוב ביותר בשוק.
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
        <section id="enrollment-form" className="py-10 sm:py-16 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-12 text-center mb-10 relative overflow-hidden">
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#f4a261] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#5ec6c6] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="home"
                title="הצטרפות לביטוח דירה"
                description="מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomeInsurance;
