import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Shield, Heart, Stethoscope, Pill, Building2, FileCheck, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const HealthInsurance = () => {
  const coverageTypes = [
    {
      title: "בסיס",
      icon: Shield,
      items: [
        "תרופות מחוץ לסל הבריאות",
        "השתלות וטיפולים מיוחדים מחוץ לישראל",
        "ניתוחים וטיפולים מחליפי ניתוח מחוץ לישראל",
      ],
    },
    {
      title: "ניתוחים בארץ",
      icon: Building2,
      items: [
        "משלים שב\"ן ללא השתתפות עצמית",
        "שקל ראשון",
        "משלים שב\"ן עם השתתפות עצמית 5,000 ₪",
      ],
    },
    {
      title: "ייעוץ ובדיקות",
      icon: Stethoscope,
      items: [
        "ייעוץ ובדיקות בסיס",
        "ייעוץ ובדיקות מורחב",
      ],
    },
    {
      title: "הרחבות",
      icon: Pill,
      items: [
        "אבחון רפואי מהיר",
        "טיפולים בטכנולוגיות מתקדמות ואביזרים רפואיים",
        "טיפולים ואבחונים לילד",
        "ליווי רפואי וטיפולים אגב אירוע רפואי משמעותי",
      ],
    },
    {
      title: "כתבי שירות",
      icon: FileCheck,
      items: [
        "רפואה אישית און ליין פלוס",
        "רפואה משלימה",
        "ביקור רופא בבית",
      ],
    },
  ];

  const faqItems = [
    {
      q: "האם ביטוח בריאות פרטי מחליף את קופת החולים?",
      a: "לא. ביטוח בריאות פרטי משלים את השירותים של קופת החולים ומעניק כיסוי לטיפולים, תרופות וניתוחים שאינם כלולים בסל הבריאות הממלכתי.",
    },
    {
      q: "מהי תקופת אכשרה?",
      a: "תקופת אכשרה היא פרק זמן (בדרך כלל 3-12 חודשים) מרגע הצטרפות לביטוח ועד שניתן לממש את הכיסוי. תקופה זו משתנה בין חברות ובין סוגי כיסויים.",
    },
    {
      q: "האם אפשר לבטח את כל המשפחה?",
      a: "בהחלט. רוב חברות הביטוח מציעות פוליסות משפחתיות במחיר מוזל, הכוללות כיסוי להורים ולילדים תחת פוליסה אחת.",
    },
    {
      q: "כמה עולה ביטוח בריאות פרטי?",
      a: "העלות משתנה בהתאם לגיל, מצב בריאותי, רמת הכיסוי וחברת הביטוח. באופן כללי, מדובר בעשרות עד מאות שקלים בחודש. ככל שמצטרפים צעירים יותר, הפרמיה נמוכה יותר.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#0a3d3d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            ביטוח בריאות פרטי
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            גישה מהירה לרופאים מומחים, ניתוחים וטיפולים מתקדמים — הגנה מקיפה על הבריאות שלכם ושל משפחתכם.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link to="/insurance" className="hover:text-[#0a3d3d] transition-colors">ביטוח</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">ביטוח בריאות</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">למה זה חשוב?</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  מערכת הבריאות הציבורית מוגבלת. ביטוח פרטי מבטיח גישה מהירה לרופאים מומחים, בדיקות מתקדמות וזמני המתנה קצרים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">מתי לרכוש?</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כמה שיותר מוקדם, יותר טוב. פרמיה נמוכה בגיל צעיר, תנאי קבלה קלים, וללא חריגים על מצב רפואי קיים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">מה חשוב לדעת?</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  בדקו תקופת אכשרה, חריגים, השתתפות עצמית ורשת רופאים. השוואה בין חברות חוסכת מאות שקלים בחודש.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Article Content */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה ביטוח בריאות פרטי חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  מערכת הבריאות הציבורית בישראל מספקת שירותים בסיסיים, אך לעיתים קרובות זמני ההמתנה ארוכים, הבחירה ברופא מוגבלת, ותרופות חדשניות אינן כלולות בסל הבריאות. ביטוח בריאות פרטי מאפשר לכם לקבל את הטיפול הרפואי הטוב ביותר בזמן הנכון, עם גישה לרופאים מומחים, טכנולוגיות מתקדמות ותרופות שאינן בסל.
                </p>
                <p>
                  במקרה של מחלה או ניתוח, ביטוח בריאות פרטי יכול לחסוך לכם חודשים של המתנה ולהעניק לכם שליטה מלאה על הטיפול שלכם. מדובר בהשקעה בבריאות שלכם ושל משפחתכם, שמשתלמת במיוחד ברגעי האמת.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש ביטוח בריאות?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  התשובה הקצרה היא: כמה שיותר מוקדם, יותר טוב. ככל שמצטרפים בגיל צעיר יותר, הפרמיה החודשית נמוכה יותר ותנאי הקבלה קלים יותר. חשוב במיוחד לרכוש ביטוח בריאות לפני שמתפתחות בעיות רפואיות, מכיוון שמצב רפואי קיים עלול להוביל לחריגים בפוליסה.
                </p>
                <p>
                  מומלץ לרכוש ביטוח בריאות בשלבי חיים משמעותיים: כניסה לשוק העבודה, לידת ילד ראשון, או מעבר לגיל 40. אלו הרגעים שבהם הצורך בכיסוי רפואי איכותי הופך לקריטי.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת לפני שרוכשים?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח בריאות, חשוב לשים לב למספר נקודות מפתח: תקופת אכשרה (תקופת המתנה לפני שניתן לממש את הביטוח), חריגים בפוליסה, גובה ההשתתפות העצמית, ורשת הרופאים והמוסדות הרפואיים הזמינים.
                </p>
                <p>
                  ב-SeelD אנחנו משווים עבורכם בין כל חברות הביטוח המובילות ומוצאים את הפוליסה המתאימה ביותר לצרכים ולתקציב שלכם, ללא עלות נוספת.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Types */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">מגוון רחב של כיסויים המותאמים לצרכים שלכם</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverageTypes.map((coverage, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <coverage.icon className="w-5 h-5 text-[#0a3d3d]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a3d3d]">{coverage.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {coverage.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-gray-600 text-sm flex items-start gap-2">
                        <span className="text-[#5ec6c6] mt-0.5 flex-shrink-0">&#x2022;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-16 sm:py-20">
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
        <section className="py-16 sm:py-20 bg-gray-50">
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
        <section id="contact-form" className="py-16 sm:py-20 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-2xl p-8 sm:p-12 text-center text-white mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="health"
                title="הצטרפות לביטוח בריאות"
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

export default HealthInsurance;
