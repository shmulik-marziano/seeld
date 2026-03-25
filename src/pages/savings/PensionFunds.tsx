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
import CompanyLogos from "@/components/CompanyLogos";
import DoodleIcon from "@/components/DoodleIcon";

const PensionFunds = () => {
  const pensionTypes = [
    {
      title: "פנסיה מקיפה חדשה",
      icon: Shield,
      doodle: "shield",
      color: "#5ec6c6",
      description: "קרן פנסיה המשלבת חיסכון, ביטוח נכות וביטוח שאירים",
      features: ["תשואות מנוהלות", "כיסוי אובדן כושר עבודה", "פנסיית שאירים"],
    },
    {
      title: "פנסיה כללית",
      icon: TrendingUp,
      doodle: "growth",
      color: "#f4a261",
      description: "מסלול חיסכון בלבד ללא רכיבים ביטוחיים",
      features: ["תשואות גבוהות יותר", "גמישות מקסימלית", "דמי ניהול נמוכים"],
    },
    {
      title: "פנסיה משלימה",
      icon: PiggyBank,
      doodle: "savings",
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

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner — matches insurance page style */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, hsl(168 42% 14%) 0%, hsl(152 42% 18%) 40%, hsl(160 38% 24%) 70%, hsl(145 30% 18%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #90be6d 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, hsl(28 45% 60%) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          <svg className="absolute bottom-10 left-0 w-full h-16 opacity-[0.06]" viewBox="0 0 800 50" fill="none">
            <path d="M0 35 Q200 5 400 28 T800 15" stroke="hsl(160,50%,65%)" strokeWidth="1.5" strokeDasharray="8 6" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-[#90be6d]">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/40">קרנות פנסיה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            תכננו את <span className="text-[#90be6d]">העתיד הפנסיוני</span> שלכם
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            קרן פנסיה היא מכשיר חיסכון ארוך טווח שמבטיח לכם הכנסה חודשית קבועה לאחר הפרישה. עם הייעוץ שלנו, תבחרו את הקרן שמתאימה בדיוק לכם.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-[#0a3d3d] font-bold text-base hover:bg-white/90 transition-all min-h-[48px] shadow-lg shadow-black/10">
              ניתוח תיק פנסיוני חינם
            </a>
            <a href="#pension-types" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 hover:border-white/25 transition-all min-h-[48px]">
              סוגי פנסיה
            </a>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-400">
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
                { icon: TrendingUp, doodle: "growth", title: "תשואות מנוהלות", desc: "הכספים מנוהלים על ידי מנהלי השקעות מקצועיים", color: "#5ec6c6" },
                { icon: Shield, doodle: "shield", title: "כיסויים ביטוחיים", desc: "פנסיית נכות ושאירים להגנה על המשפחה", color: "#f4a261" },
                { icon: Calculator, doodle: "calculator", title: "הטבות מס", desc: "זיכוי מס והפחתת הכנסה חייבת במס", color: "#90be6d" },
                { icon: Users, doodle: "handshake", title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לבחירת המסלול המתאים", color: "#e76f51" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group text-center">
                  <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <DoodleIcon name={item.doodle} size={48} />
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
                    <div className="w-14 h-14 flex items-center justify-center">
                      <DoodleIcon name={type.doodle} size={48} />
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
                  ב-SEELD אנו מבצעים ניתוח פנסיוני מקיף וחינמי, בודקים את דמי הניהול, מסלולי ההשקעה והכיסויים הביטוחיים, ומוודאים שהכסף שלכם עובד בצורה הטובה ביותר עבורכם.
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

        {/* Companies */}
        <CompanyLogos variant="grid" />

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
