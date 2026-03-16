import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Shield, HeartPulse, Baby, Users, Award, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const CriticalIllness = () => {
  const coverageTypes = [
    {
      title: "ביטוח מחלות קשות",
      icon: HeartPulse,
      items: [
        "כיסוי כספי למקרה של אבחון מחלה קשה",
        "סרטן, התקף לב, שבץ מוחי ועוד",
        "מענק חד-פעמי מיידי",
      ],
    },
    {
      title: "מענקית זהב לילד",
      icon: Baby,
      items: [
        "ביטוח מחלות קשות לילדים",
        "פיצוי כספי מיידי",
        "כיסוי מקיף למגוון מחלות",
      ],
    },
    {
      title: "מענקית לסרטן — עד גיל 64",
      icon: Shield,
      items: [
        "כיסוי ממוקד למחלת הסרטן",
        "פיצוי כספי גבוה",
        "מותאם למבוגרים עד גיל 64",
      ],
    },
    {
      title: "מענקית לסרטן — מגיל 65",
      icon: Users,
      items: [
        "כיסוי מותאם לגיל הזהב",
        "תנאים מיוחדים למבוטחים מגיל 65",
        "פיצוי כספי למימון טיפולים",
      ],
    },
    {
      title: "מענקית לסרטן — עד גיל 18",
      icon: Award,
      items: [
        "הגנה מיוחדת לילדים ונוער",
        "כיסוי מקיף למחלת הסרטן",
        "פרמיה נמוכה במיוחד",
      ],
    },
  ];

  const faqItems = [
    {
      q: "אילו מחלות מכוסות בביטוח?",
      a: "רוב הפוליסות מכסות סרטן, התקף לב, שבץ מוחי, ניתוח מעקפים, השתלת איברים, אי ספיקת כליות, טרשת נפוצה ועוד. חלק מהפוליסות מכסות גם מחלות נוספות. חשוב לקרוא את רשימת המחלות בפוליסה הספציפית.",
    },
    {
      q: "האם הפיצוי הוא חד-פעמי או חודשי?",
      a: "הפיצוי בביטוח מחלות קשות הוא חד-פעמי — סכום כסף שמשולם מיד עם אבחון המחלה. זה שונה מביטוח אובדן כושר עבודה שמשלם פיצוי חודשי. ניתן (ומומלץ) להחזיק את שני הביטוחים במקביל.",
    },
    {
      q: "האם ביטוח מחלות קשות מחליף ביטוח בריאות?",
      a: "לא. ביטוח בריאות מכסה את עלויות הטיפול הרפואי עצמו, בעוד ביטוח מחלות קשות מעניק מענק כספי חופשי לשימוש. שני הביטוחים משלימים זה את זה ומומלץ להחזיק את שניהם.",
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
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">מחלות קשות</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח מחלות קשות
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ביטחון כלכלי ברגעים הקשים — פיצוי כספי מיידי בעת אבחון מחלה קשה, כך שתוכלו להתמקד בהחלמה.
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
          <span className="text-[#0a3d3d] font-medium">ביטוח מחלות קשות</span>
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
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">פיצוי מיידי</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  קבלו סכום כסף חד-פעמי מיד עם אבחון המחלה, ללא צורך בהמתנה.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <HeartPulse className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">שימוש חופשי</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הכסף שלכם — השתמשו בו לכל מטרה: טיפולים, החלמה, או תמיכה במשפחה.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי רחב</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  כיסוי למגוון רחב של מחלות קשות כולל סרטן, התקף לב, שבץ ועוד.
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
                  אבחון של מחלה קשה כמו סרטן, התקף לב או שבץ מוחי הוא אירוע שמשנה חיים. מעבר להתמודדות הרפואית והנפשית, ישנן השלכות כלכליות כבדות: הוצאות על טיפולים שאינם בסל, אובדן הכנסה בתקופת ההחלמה, נסיעות לטיפולים, ולעתים צורך בהתאמות מיוחדות בבית.
                </p>
                <p>
                  ביטוח מחלות קשות מעניק מענק כספי חד-פעמי מיד עם אבחון המחלה — סכום שיכול להגיע למאות אלפי שקלים. הכסף לרשותכם לכל מטרה: טיפול רפואי בארץ או בחו״ל, מימון תקופת החלמה, שמירה על רמת החיים, או כל דבר אחר שתצטרכו.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח מחלות קשות כדאי לרכוש כמה שיותר מוקדם — בגיל צעיר הפרמיה נמוכה ותנאי הקבלה פשוטים. הסיכון לחלות במחלה קשה עולה עם הגיל, ולכן מי שרוכש ביטוח בגיל צעיר נהנה ממחיר נמוך לאורך שנים רבות.
                </p>
                <p>
                  מומלץ במיוחד למשפחות עם ילדים — ביטוח מחלות קשות לילדים (מענקית זהב) מספק הגנה כלכלית חיונית במקרה של אבחון מחלה קשה אצל ילד, ומאפשר להורים להתמקד בטיפול ולא בדאגות כלכליות.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  חשוב לבדוק אילו מחלות כלולות בפוליסה — רשימת המחלות משתנה בין חברות. שימו לב גם להגדרות: מתי בדיוק נחשב "אירוע מבוטח" (למשל, האם כל סוג סרטן מכוסה), מה תקופת ההמתנה, והאם ניתן לקבל פיצוי על יותר ממחלה אחת.
                </p>
                <p>
                  ב-SEELD אנחנו מנתחים עבורכם את כל הפוליסות, משווים את רשימות המחלות, התנאים והמחירים, ומוצאים את הכיסוי הרחב ביותר שמתאים לתקציב שלכם. ההבדלים בין הפוליסות יכולים להיות משמעותיים מאוד.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Types */}
        <section className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">פתרונות מותאמים לכל גיל ולכל צורך</p>
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
                insuranceType="critical-illness"
                title="הצטרפות לביטוח מחלות קשות"
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

export default CriticalIllness;
