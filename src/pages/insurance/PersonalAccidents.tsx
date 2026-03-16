import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Shield, AlertTriangle, Bike, Mountain, Briefcase, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const PersonalAccidents = () => {
  const coverageTypes = [
    {
      title: "ביטוח תאונות אישיות",
      icon: Shield,
      items: [
        "כיסוי מקיף לתאונות בכל מקום ובכל זמן",
        "בבית, בעבודה או בחופשה",
        "פיצוי לפי אחוזי נכות",
      ],
    },
    {
      title: "נכות תעסוקתית מתאונה",
      icon: Briefcase,
      items: [
        "פיצוי במקרה של נכות תעסוקתית",
        "כיסוי להשפעה על יכולת העבודה",
        "סכומי פיצוי גבוהים",
      ],
    },
    {
      title: "ביטול חריג רכב דו גלגלי",
      icon: Bike,
      items: [
        "כיסוי לתאונות עם אופנוע",
        "אופניים חשמליים וקורקינט",
        "טרקטורון ורכב שטח",
      ],
    },
    {
      title: "ביטול חריג ספורט אתגרי",
      icon: Mountain,
      items: [
        "כיסוי לפעילויות ספורט אתגרי",
        "גלישה, טיפוס ועוד",
        "ספורט חובבני מכוסה",
      ],
    },
  ];

  const faqItems = [
    {
      q: "האם ביטוח תאונות מכסה גם תאונות עם קורקינט חשמלי?",
      a: "בפוליסה סטנדרטית, תאונות עם רכב דו-גלגלי (כולל קורקינט ואופניים חשמליים) לרוב אינן מכוסות. ניתן לרכוש הרחבה ספציפית שמבטלת חריג זה ומספקת כיסוי מלא.",
    },
    {
      q: "מה ההבדל בין ביטוח תאונות לביטוח אובדן כושר עבודה?",
      a: "ביטוח תאונות מכסה רק מקרים שנגרמים מתאונה ומעניק פיצוי חד-פעמי לפי אחוזי נכות. ביטוח אובדן כושר עבודה מכסה כל סיבה (כולל מחלה) ומעניק פיצוי חודשי. מומלץ להחזיק את שניהם.",
    },
    {
      q: "האם יש ביטוח תאונות לילדים?",
      a: "כן, ביטוח תאונות אישיות זמין גם לילדים ומומלץ מאוד. ילדים חשופים לתאונות במיוחד — במגרשי משחקים, בספורט, באופניים ובפעילויות יומיומיות. הפרמיה לילדים נמוכה במיוחד.",
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
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">תאונות אישיות</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח תאונות אישיות
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            הגנה מפני הבלתי צפוי — ביטוח תאונות אישיות מעניק לכם פיצוי כספי 24/7 בכל מקום בעולם.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח תאונות אישיות</span>
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
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי 24/7</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הגנה בכל שעות היממה, בכל מקום בעולם — בבית, בעבודה או בחופשה.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">פיצוי מהיר</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  תהליך תביעות פשוט ומהיר כדי שתקבלו את הכסף כשאתם צריכים אותו.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">פרמיה נמוכה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  עלות חודשית נמוכה עבור שקט נפשי ובטחון כלכלי מלא.
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
                  תאונות הן אחד הגורמים המובילים לאשפוז ולנכות בישראל. תאונות דרכים, נפילות, תאונות ספורט ותאונות עבודה קורות כל יום — ולכל אחד מאיתנו. ההשלכות הכלכליות יכולות להיות כבדות: אובדן הכנסה, הוצאות רפואיות, שיקום, ולעתים נכות ארוכת טווח.
                </p>
                <p>
                  ביטוח תאונות אישיות מעניק לכם רשת ביטחון כלכלית 24 שעות ביממה, 7 ימים בשבוע — בבית, בעבודה, בחופשה ובכל מקום בעולם. הפיצוי הכספי מאפשר לכם להתמקד בהחלמה מבלי לדאוג לצד הכלכלי.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח תאונות אישיות רלוונטי לכל גיל ולכל אורח חיים. הוא חשוב במיוחד לאנשים פעילים, רוכבי אופניים חשמליים או אופנועים, ספורטאים חובבנים, עובדים בתחומים עם סיכון מוגבר, והורים לילדים קטנים שנמצאים בסיכון גבוה יותר לתאונות.
                </p>
                <p>
                  הפרמיה לביטוח תאונות אישיות נמוכה יחסית, ולכן אין סיבה לחכות. ככל שמצטרפים מוקדם יותר, כך נהנים מכיסוי רציף ומהפרמיות הנמוכות ביותר. מומלץ לבדוק ולהתאים את הביטוח לאורח החיים שלכם.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח תאונות אישיות, שימו לב לחריגים: האם רכב דו-גלגלי מכוסה? האם ספורט אתגרי נכלל? מהו סכום הפיצוי במקרה של נכות? האם יש פיצוי גם על ימי אשפוז ותקופת אי כושר? ההבדלים בין פוליסות יכולים להיות משמעותיים.
                </p>
                <p>
                  ב-SEELD אנחנו עוזרים לכם לבנות כיסוי תאונות אישיות שמותאם בדיוק לאורח החיים שלכם, עם כל ההרחבות הנדרשות ובמחיר הטוב ביותר מבין כל חברות הביטוח.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Types */}
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">כיסויים מותאמים לאורח החיים שלכם</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
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
                insuranceType="personal-accidents"
                title="הצטרפות לביטוח תאונות אישיות"
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

export default PersonalAccidents;
