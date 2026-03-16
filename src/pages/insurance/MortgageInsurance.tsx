import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Home, Shield, Heart, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const MortgageInsurance = () => {
  const faqItems = [
    {
      q: "האם אפשר להעביר ביטוח משכנתא מהבנק?",
      a: "כן, על פי חוק אתם רשאים לבחור כל חברת ביטוח לביטוח המשכנתא. הבנק לא יכול לחייב אתכם לרכוש דווקא דרכו. התהליך פשוט ואנחנו ב-SEELD מטפלים בכל הבירוקרטיה עבורכם.",
    },
    {
      q: "כמה אפשר לחסוך בהעברת ביטוח?",
      a: "החיסכון משתנה בהתאם לגובה המשכנתא, הגיל ומצב הבריאות, אך בממוצע מדובר בחיסכון של 30%-50% מהפרמיה החודשית. לאורך חיי המשכנתא זה מסתכם בעשרות אלפי שקלים.",
    },
    {
      q: "האם ביטוח משכנתא כולל גם אובדן כושר עבודה?",
      a: "ניתן להוסיף כיסוי לאובדן כושר עבודה כהרחבה לפוליסת ביטוח המשכנתא. כיסוי זה ישלם את תשלומי המשכנתא החודשיים במקרה שלא תוכלו לעבוד עקב מחלה או תאונה.",
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
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח משכנתא</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח חיים למשכנתא
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            הגנו על הבית שלכם — ביטוח חיים למשכנתא מבטיח שהמשפחה תישאר בבית גם אם קורה משהו.
          </p>
          <div className="mt-6">
            <a href="#contact-form" className="inline-flex items-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              בדקו את המחיר שלכם
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
          <span className="text-[#0a3d3d] font-medium">ביטוח משכנתא</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">פירעון המשכנתא</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  במקרה של פטירה, הביטוח מכסה את יתרת המשכנתא והבית עובר למשפחה ללא חובות.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">לא חייבים דרך הבנק</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הבנקים דורשים ביטוח חיים כתנאי למשכנתא — אבל אתם בוחרים מאיפה לקנות.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">חיסכון בפרמיה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  ביטוח דרך סוכן עצמאי יכול לחסוך לכם אלפי שקלים לאורך תקופת המשכנתא.
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
                  משכנתא היא ההתחייבות הפיננסית הגדולה ביותר שרוב האנשים לוקחים על עצמם. ביטוח חיים למשכנתא מבטיח שאם קורה משהו בלתי צפוי, המשפחה לא תיאלץ למכור את הבית או להתמודד עם חוב עצום. הביטוח מכסה את יתרת המשכנתא ומשחרר את המשפחה מהנטל הכלכלי.
                </p>
                <p>
                  מה שהרבה אנשים לא יודעים הוא שאתם לא חייבים לרכוש את ביטוח המשכנתא דרך הבנק. החוק מאפשר לכם לבחור כל חברת ביטוח, ובמקרים רבים הפרמיות בחברות ביטוח חיצוניות נמוכות משמעותית — חיסכון שיכול להצטבר לעשרות אלפי שקלים לאורך חיי המשכנתא.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח חיים למשכנתא הוא תנאי חובה לקבלת המשכנתא, ולכן יש לרכוש אותו עוד לפני החתימה על ההסכם. אבל גם אם כבר יש לכם משכנתא וביטוח דרך הבנק — זה הזמן לבדוק אם אתם משלמים מחיר הוגן. העברת ביטוח מהבנק לחברה חיצונית היא תהליך פשוט.
                </p>
                <p>
                  כדאי לבצע בדיקה מחודשת כל כמה שנים, או בכל אירוע משמעותי: מחזור משכנתא, ירידה ביתרה, שינוי במצב הבריאותי או הכלכלי. פעמים רבות ניתן לחסוך באופן משמעותי על ידי התאמת הפוליסה למצב העדכני.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ישנם שני סוגי ביטוח חיים למשכנתא: ביטוח עם סכום יורד (הסכום יורד בהתאם ליתרת המשכנתא) וביטוח עם סכום קבוע (הסכום נשאר זהה לכל אורך התקופה). ביטוח עם סכום קבוע יקר יותר אך מעניק הגנה רחבה יותר, כי היתרה הנותרת הולכת למשפחה.
                </p>
                <p>
                  ב-SEELD אנחנו מתמחים בהשוואת ביטוחי משכנתא ויכולים לחסוך לכם אלפי שקלים. נבדוק את הפוליסה הקיימת שלכם, נשווה מול כל חברות הביטוח, ונמצא את ההצעה הטובה ביותר — הכל בלי בירוקרטיה מיותרת.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים לחסוך בביטוח המשכנתא?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                השאירו פרטים ונבדוק אם אפשר להוזיל לכם את העלויות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="mortgage"
                title="בדיקת ביטוח משכנתא"
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

export default MortgageInsurance;
