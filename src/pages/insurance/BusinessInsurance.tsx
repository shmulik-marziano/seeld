import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Building2, Shield, Users, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const BusinessInsurance = () => {
  const coverageTypes = [
    {
      title: "מבנה ותכולה",
      icon: Building2,
      items: [
        "נזקי אש ופריצה",
        "ציוד ומכונות",
        "מלאי עסקי",
      ],
    },
    {
      title: "אחריות מקצועית",
      icon: Shield,
      items: [
        "תביעות לקוחות",
        "הוצאות משפטיות",
        "פיצויים",
      ],
    },
    {
      title: "חבות מעסיקים",
      icon: Users,
      items: [
        "תאונות עבודה",
        "מחלות מקצוע",
        "פיצויי עובדים",
      ],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין ביטוח אחריות מקצועית לביטוח צד שלישי?",
      a: "ביטוח אחריות מקצועית מכסה נזקים שנגרמו כתוצאה מטעות מקצועית או רשלנות בשירות, בעוד ביטוח צד שלישי מכסה נזקי גוף ורכוש שנגרמו לאחרים בשטח העסק או כתוצאה מפעילותו.",
    },
    {
      q: "האם ביטוח חבות מעסיקים הוא חובה?",
      a: "כן, על פי חוק כל מעסיק בישראל חייב בביטוח חבות מעסיקים. הביטוח מכסה תביעות עובדים בגין נזקי גוף שנגרמו במהלך העבודה או כתוצאה ממנה.",
    },
    {
      q: "מה זה ביטוח אובדן רווחים?",
      a: "ביטוח אובדן רווחים מפצה את העסק על הכנסות שאבדו בעקבות אירוע מבוטח, כמו שריפה שגרמה להשבתת העסק. הביטוח מכסה הוצאות קבועות ואובדן רווח למשך תקופת השיקום.",
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
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח עסקים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח עסקי מקיף
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ביטוח עסקי מקיף שמגן על המבנה, התכולה, העובדים והפעילות העסקית שלכם — הגנה מלאה על העסק שלכם.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח עסקי</span>
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
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">מבנה ותכולה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הגנה על המבנה, הציוד והמלאי של העסק מפני נזקי אש, פריצה והצפה.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">אחריות מקצועית</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כיסוי לתביעות בגין נזקים מפעילות העסק, הוצאות משפטיות ופיצויים.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">חבות מעסיקים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  ביטוח לתביעות עובדים בגין נזקי גוף — תאונות עבודה ומחלות מקצוע.
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
                  עסק הוא מערכת מורכבת שחשופה לסיכונים רבים — משריפה או הצפה ועד תביעות לקוחות, גניבת ציוד או נזק לצד שלישי. ביטוח עסקי מקיף הוא לא מותרות אלא הכרח. אירוע אחד בלתי צפוי ללא כיסוי ביטוחי יכול להוביל לסגירת העסק או לחובות כבדים שייקח שנים להתאושש מהם.
                </p>
                <p>
                  ביטוח עסקי נכון מגן על הנכסים הפיזיים, על הפעילות השוטפת, על העובדים ועל המוניטין שלכם. הוא מאפשר לכם להתמקד בצמיחה ופיתוח העסק מתוך ידיעה שאם משהו ישתבש — יש לכם רשת ביטחון כלכלית.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כל עסק זקוק לביטוח מהיום הראשון לפעילותו. בין אם מדובר בעסק חדש שזה עתה נפתח, או בעסק ותיק שמרחיב את פעילותו — ביטוח עסקי הוא תנאי בסיסי לניהול אחראי. ענפים רבים אף דורשים ביטוח אחריות מקצועית כתנאי לקבלת רישיון עסק.
                </p>
                <p>
                  חשוב במיוחד לעדכן את הביטוח בכל שינוי משמעותי: הרחבת העסק, גיוס עובדים חדשים, רכישת ציוד יקר, מעבר למיקום חדש, או כניסה לתחום פעילות נוסף. ביטוח שלא מעודכן עלול להשאיר אתכם בלי כיסוי ברגע האמת.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח עסקי בנוי ממספר שכבות: ביטוח מבנה ותכולה, ביטוח אחריות מקצועית, ביטוח חבות מעסיקים, ביטוח אובדן רווחים ועוד. חשוב לבנות פוליסה שמתאימה בדיוק לסוג העסק, לענף ולהיקף הפעילות שלכם. פוליסה גנרית לא תספק מענה אמיתי.
                </p>
                <p>
                  ב-SeelD אנחנו מתמחים בהתאמת ביטוח עסקי מדויק. נבין את הצרכים הייחודיים של העסק שלכם, נשווה הצעות מכל חברות הביטוח, ונבנה חבילת כיסוי שמגנה על העסק בלי שתשלמו על דברים שאתם לא צריכים.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Types */}
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">מגוון רחב של כיסויים המותאמים לצרכי העסק שלכם</p>
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
                insuranceType="business"
                title="הצטרפות לביטוח עסקי"
                description="מלאו את פרטי העסק ונחזור אליכם עם הצעה מותאמת"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessInsurance;
