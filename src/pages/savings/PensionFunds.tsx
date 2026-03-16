import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { PiggyBank, TrendingUp, Shield, Users, CheckCircle, Calculator, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const PensionFunds = () => {
  const pensionTypes = [
    {
      title: "פנסיה מקיפה חדשה",
      icon: Shield,
      color: "#5ec6c6",
      description: "קרן פנסיה המשלבת חיסכון, ביטוח נכות וביטוח שאירים",
      features: ["תשואות מנוהלות", "כיסוי אובדן כושר עבודה", "פנסיית שאירים"],
    },
    {
      title: "פנסיה כללית",
      icon: TrendingUp,
      color: "#f4a261",
      description: "מסלול חיסכון בלבד ללא רכיבים ביטוחיים",
      features: ["תשואות גבוהות יותר", "גמישות מקסימלית", "דמי ניהול נמוכים"],
    },
    {
      title: "פנסיה משלימה",
      icon: PiggyBank,
      color: "#90be6d",
      description: "הפקדות נוספות מעבר לחובה לשיפור הפנסיה",
      features: ["הטבות מס", "הגדלת הקצבה", "חיסכון לטווח ארוך"],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין פנסיה מקיפה לפנסיה כללית?",
      a: "פנסיה מקיפה כוללת חיסכון + כיסויים ביטוחיים (נכות ושאירים). פנסיה כללית היא חיסכון בלבד ללא כיסויים ביטוחיים, ולכן דמי הניהול בה נמוכים יותר והתשואה הפוטנציאלית גבוהה יותר. רוב העובדים צריכים פנסיה מקיפה.",
    },
    {
      q: "האם אפשר להעביר קרן פנסיה?",
      a: "כן, ניתן להעביר קרן פנסיה מחברה אחת לאחרת ללא עלות. התהליך פשוט ונמשך כ-10 ימי עסקים. חשוב לבדוק שהתנאים בקרן החדשה טובים יותר לפני המעבר.",
    },
    {
      q: "מהם דמי ניהול סבירים בקרן פנסיה?",
      a: "דמי ניהול ממוצעים הם כ-0.2%-0.5% מהצבירה ו-1.5%-4% מההפקדה. עם משא ומתן נכון ניתן להגיע לדמי ניהול נמוכים משמעותית, במיוחד אם יש לכם צבירה גבוהה.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-6 left-8 w-24 h-24 rounded-full bg-[#90be6d] opacity-12" />
        <div className="absolute bottom-8 right-14 w-16 h-16 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="absolute top-20 right-1/3 w-10 h-10 rounded-full bg-[#f4a261] opacity-18" />
        <div className="absolute bottom-14 left-1/4 w-6 h-6 rounded-full bg-[#e76f51] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#90be6d] flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">קרנות פנסיה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            תכננו את <span className="text-[#90be6d]">העתיד הפנסיוני</span> שלכם
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            קרן פנסיה היא מכשיר חיסכון ארוך טווח המבטיח לכם הכנסה חודשית קבועה לאחר הפרישה. עם הייעוץ המקצועי שלנו, תבחרו את הקרן המתאימה ביותר.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ניתוח תיק פנסיוני חינם
            </a>
            <a href="#pension-types" className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              סוגי פנסיה
            </a>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link to="/savings" className="hover:text-[#0a3d3d] transition-colors">חיסכון ופנסיה</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">קרנות פנסיה</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">יתרונות קרן הפנסיה</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: TrendingUp, title: "תשואות מנוהלות", desc: "הכספים מנוהלים על ידי מנהלי השקעות מקצועיים", color: "#5ec6c6" },
                { icon: Shield, title: "כיסויים ביטוחיים", desc: "פנסיית נכות ושאירים להגנה על המשפחה", color: "#f4a261" },
                { icon: Calculator, title: "הטבות מס", desc: "זיכוי מס והפחתת הכנסה חייבת במס", color: "#90be6d" },
                { icon: Users, title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לבחירת המסלול המתאים", color: "#e76f51" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: item.color }}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pension Types */}
        <section id="pension-types" className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי קרנות פנסיה</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">הכירו את האפשרויות השונות ובחרו את המסלול המתאים לכם</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pensionTypes.map((type, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color }}>
                      <type.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a3d3d]">{type.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: type.color }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה קרן פנסיה חשובה?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  קרן הפנסיה היא עמוד התווך של הביטחון הפיננסי שלכם בפרישה. היא מבטיחה הכנסה חודשית קבועה לאחר שתפסיקו לעבוד, ומספקת גם כיסויים ביטוחיים חיוניים כמו ביטוח נכות (אובדן כושר עבודה) וביטוח שאירים להגנה על המשפחה.
                </p>
                <p>
                  בישראל, הפקדה לפנסיה היא חובה על כל עובד שכיר מכוח צו הרחבה לפנסיה חובה. עם זאת, רבים אינם מודעים לכך שבחירה נכונה של קרן פנסיה ומסלול השקעה יכולה לשנות באופן דרמטי את גובה הקצבה החודשית בפרישה - הפרש שיכול להגיע למאות אלפי שקלים לאורך שנות הפנסיה.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לבדוק את קרן הפנסיה?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  מומלץ לבדוק את קרן הפנסיה לפחות אחת לשנה. בדקו את דמי הניהול (שצריכים להיות הנמוכים ביותר האפשריים), את מסלול ההשקעה (שצריך להתאים לגיל ולרמת הסיכון שלכם), ואת ביצועי הקרן בהשוואה לקרנות מתחרות.
                </p>
                <p>
                  שינויים בחיים כמו מעבר מקום עבודה, נישואים, לידת ילד או עלייה בשכר הם הזדמנויות מצוינות לבצע ניתוח פנסיוני מקיף. גם אם אתם מרוצים מהקרן הנוכחית, ייתכן שתוכלו להוריד את דמי הניהול ולחסוך עשרות אלפי שקלים לאורך השנים.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  דמי ניהול הם הגורם המשמעותי ביותר להפרש בחיסכון הפנסיוני לאורך זמן. הפרש של 0.5% בדמי ניהול יכול להסתכם במאות אלפי שקלים לאורך עשרות שנות חיסכון. בנוסף, חשוב לוודא שהכיסויים הביטוחיים (נכות ושאירים) מותאמים לצרכים שלכם ואינם מיותרים.
                </p>
                <p>
                  ב-SeelD אנו מבצעים ניתוח פנסיוני מקיף וחינמי, בודקים את דמי הניהול, מסלולי ההשקעה והכיסויים הביטוחיים, ומוודאים שהכסף שלכם עובד בצורה הטובה ביותר עבורכם.
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
              אנחנו עובדים עם הגופים המוסדיים המובילים בישראל כדי להביא לכם את התנאים הטובים ביותר
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

        {/* Analysis Form */}
        <section id="analysis-form" className="py-10 sm:py-16 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-12 text-center mb-10 relative overflow-hidden">
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#90be6d] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#5ec6c6] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ניתוח פנסיוני חינמי?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ניתוח תיק פנסיוני חינם"
                description="הזינו את הפרטים ויועץ מוסמך יחזור אליכם עם המלצות מותאמות"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionFunds;
