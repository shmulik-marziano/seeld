import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Heart, Shield, Building2, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const NursingClalitInsurance = () => {
  const faqItems = [
    {
      q: "מה כולל הביטוח הסיעודי הקולקטיבי של כללית?",
      a: "הביטוח הקולקטיבי של כללית מספק כיסוי בסיסי הכולל פיצוי חודשי מוגבל לתקופה מוגדרת. הכיסוי משתנה בהתאם לגיל ההצטרפות ולמסלול שנבחר, אך בדרך כלל אינו מספיק לכיסוי מלא של עלויות הטיפול.",
    },
    {
      q: "האם אפשר לשלב ביטוח קולקטיבי עם פרטי?",
      a: "בהחלט. השילוב הוא הפתרון האופטימלי — הביטוח הקולקטיבי מספק בסיס במחיר נמוך, והביטוח הפרטי משלים את הכיסוי לרמה שמאפשרת טיפול איכותי ללא פשרות.",
    },
    {
      q: "מה קורה אם אעזוב את כללית?",
      a: "הביטוח הקולקטיבי של כללית מותנה בחברות בקופה. אם תעברו לקופה אחרת, תאבדו את הכיסוי הקולקטיבי. לכן חשוב שיהיה לכם גם ביטוח סיעודי פרטי שלא תלוי בחברות בקופת חולים ספציפית.",
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
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח סיעודי לחברי כללית</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח סיעודי לחברי כללית
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            כיסוי סיעודי משופר לחברי קופת חולים כללית — השלמה חיונית לביטוח הקולקטיבי הבסיסי.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח סיעודי לחברי כללית</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">השלמה לכללית</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כיסוי משלים לביטוח הבסיסי של כללית — גישור על הפער הכלכלי.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">תנאים מועדפים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  פרמיות מוזלות ותנאי חיתום נוחים לחברי כללית.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי מורחב</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הרחבות נוספות מעבר לכיסוי הבסיסי — טיפול בבית ובמוסד.
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
                  חברי כללית נהנים מביטוח סיעודי קולקטיבי בסיסי, אך הכיסוי שהוא מספק מוגבל מאוד ואינו מכסה את העלויות האמיתיות של טיפול סיעודי. הפער בין מה שכללית מציעה לבין העלות בפועל יכול להגיע לאלפי שקלים בחודש — סכום שנופל על כתפי המשפחה.
                </p>
                <p>
                  ביטוח סיעודי משלים לחברי כללית נועד לגשר על הפער הזה. הוא מספק פיצוי חודשי נוסף מעבר למה שכללית נותנת, ומאפשר לכם לבחור בטיפול סיעודי ברמה גבוהה — בבית או במוסד — ללא דאגות כלכליות.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הזמן הטוב ביותר לרכוש ביטוח סיעודי משלים הוא כשאתם עדיין בריאים, בדרך כלל בגילאי 40-55. בגיל זה הפרמיות נמוכות יחסית ותנאי החיתום נוחים. אל תחכו עד שיופיעו בעיות בריאותיות — אז יהיה מאוחר מדי או יקר מדי.
                </p>
                <p>
                  שימו לב: הביטוח הקולקטיבי של כללית יכול להשתנות לאורך הזמן — תנאים, מחירים או כיסויים עלולים להצטמצם. ביטוח פרטי משלים נשאר קבוע ויציב, ומהווה רשת ביטחון שלא תלויה בהחלטות של הקופה.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כשרוכשים ביטוח סיעודי משלים, חשוב לבדוק איך הפוליסה הפרטית משתלבת עם הכיסוי הקולקטיבי של כללית. חשוב לוודא שאין כפילויות מיותרות, ושהפיצוי הכולל (קולקטיבי + פרטי) אכן מכסה את העלות הריאלית של טיפול סיעודי באזור מגוריכם.
                </p>
                <p>
                  ב-SeelD אנחנו מתמחים בהתאמה מדויקת של ביטוח סיעודי משלים לחברי כללית. נבדוק את הכיסוי הקולקטיבי הקיים שלכם, נחשב את הפער, ונמצא את הפוליסה הפרטית שמשלימה בדיוק את מה שחסר.
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
                insuranceType="nursing"
                title="הצטרפות לביטוח סיעודי לחברי כללית"
                description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח סיעודי"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NursingClalitInsurance;
