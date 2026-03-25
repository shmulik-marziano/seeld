import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Clock, Calculator, FileText, CheckCircle, Shield, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const PreRetirement = () => {
  const productTypes = [
    {
      title: "תחשיב פנסיה",
      icon: Calculator,
      color: "#5ec6c6",
      description: "חישוב מדויק של הקצבה הצפויה והיערכות כלכלית",
      features: ["חישוב קצבה צפויה", "ניתוח פערים", "תוכנית השלמה"],
    },
    {
      title: "איחוד חסכונות",
      icon: FileText,
      color: "#f4a261",
      description: "ריכוז כל החסכונות הפנסיוניים למקסום הזכויות",
      features: ["מיפוי כל החסכונות", "בדיקת זכויות", "אופטימיזציה"],
    },
    {
      title: "תכנון מס",
      icon: Clock,
      color: "#90be6d",
      description: "אופטימיזציה של תשלומי המס בפרישה",
      features: ["תיאום מס", "פטורים והטבות", "אסטרטגיית משיכה"],
    },
  ];

  const faqItems = [
    {
      q: "מתי אפשר לפרוש?",
      a: "גיל הפרישה בישראל הוא 67 לגברים ו-65 לנשים (עולה בהדרגה). ניתן לפרוש מוקדם יותר, אך זה ישפיע על גובה הקצבה. פרישה מאוחרת יותר תגדיל את הקצבה החודשית.",
    },
    {
      q: "האם כדאי למשוך הון חד-פעמי או קצבה?",
      a: "התשובה תלויה במצבכם הכלכלי. קצבה חודשית מבטיחה הכנסה קבועה לכל החיים. משיכת הון חד-פעמי נותנת גמישות אך דורשת ניהול עצמי. ברוב המקרים, שילוב של שניהם הוא הפתרון האופטימלי.",
    },
    {
      q: "יש לי כספים ב-5 גופים שונים, מה עושים?",
      a: "איחוד חסכונות פנסיוניים יכול לחסוך דמי ניהול ולפשט את הניהול. אך לא תמיד כדאי לאחד — לפעמים יש יתרון בשמירה על פוליסות ותיקות עם תנאים מיוחדים. אנחנו נבדוק כל מקרה לגופו.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "אינפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, hsl(168 42% 14%) 0%, hsl(152 42% 18%) 40%, hsl(160 38% 24%) 70%, hsl(145 30% 18%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #f4a261 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, hsl(28 45% 60%) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          <svg className="absolute bottom-10 left-0 w-full h-16 opacity-[0.06]" viewBox="0 0 800 50" fill="none">
            <path d="M0 35 Q200 5 400 28 T800 15" stroke="hsl(160,50%,65%)" strokeWidth="1.5" strokeDasharray="8 6" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#f4a261] flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-white/40">לפני פרישה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            הכנה <span className="text-[#f4a261]">מקיפה לפרישה</span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            כל מה שצריך לדעת לפני המעבר לפנסיה — תחשיב קצבה, איחוד חסכונות ותכנון מס אופטימלי.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-[#0a3d3d] font-bold text-base shadow-lg shadow-black/10 hover:bg-gray-100 transition-all min-h-[48px]">
              ייעוץ לפני פרישה
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 transition-all min-h-[48px]">
              שלבי ההכנה
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
          <span className="text-[#0a3d3d] font-medium">לפני פרישה</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">מה כולל ליווי לפני פרישה?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Calculator, title: "תחשיב קצבה", desc: "חישוב מדויק של הקצבה הצפויה", color: "#5ec6c6" },
                { icon: FileText, title: "איחוד חסכונות", desc: "ריכוז כל החסכונות למקום אחד", color: "#f4a261" },
                { icon: Clock, title: "תכנון מס", desc: "אופטימיזציה של המס בפרישה", color: "#90be6d" },
                { icon: Shield, title: "הגנה מלאה", desc: "ביטוחים וזכויות מותאמים לפרישה", color: "#e76f51" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group text-center">
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

        {/* Product Types */}
        <section id="product-types" className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">שלבי ההכנה לפרישה</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">תהליך מקיף שמבטיח פרישה חלקה ומשתלמת</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productTypes.map((type, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה זה חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  השנים שלפני הפרישה הן התקופה הקריטית ביותר לתכנון פנסיוני. החלטות שמתקבלות בשלב הזה — כמו מתי לפרוש, איך למשוך את הכספים, ואיפה לרכז את החסכונות — ישפיעו על רמת החיים שלכם לעשרות השנים הבאות. טעויות בשלב זה עלולות לעלות מאות אלפי שקלים.
                </p>
                <p>
                  רבים מגיעים לגיל הפרישה עם חסכונות מפוזרים במספר גופים, פוליסות ישנות עם דמי ניהול גבוהים, וללא תוכנית מס מסודרת. הכנה נכונה לפרישה כוללת ריכוז כל המידע, אופטימיזציה של החסכונות, ובניית תוכנית משיכה שממקסמת את ההכנסה הפנויה.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי להתחיל?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  מומלץ להתחיל בתהליך הכנה לפרישה לפחות 3-5 שנים לפני גיל הפרישה המתוכנן. זה נותן מספיק זמן לבצע התאמות, לאחד חסכונות, לבנות תוכנית מס, ולהיערך נפשית וכלכלית למעבר. ככל שמתחילים מוקדם יותר, כך האפשרויות רחבות יותר.
                </p>
                <p>
                  גם אם אתם כבר קרובים לפרישה ולא התחלתם להתכונן — עדיין לא מאוחר. ייעוץ מקצועי בשלב הזה יכול לחסוך לכם סכומים משמעותיים ולהבטיח שהכסף שצברתם ישמש אתכם בצורה הטובה ביותר.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  תהליך ההכנה לפרישה כולל מספר שלבים: איסוף כל המידע על החסכונות הפנסיוניים (קרנות פנסיה, ביטוחי מנהלים, קרנות השתלמות), חישוב הקצבה הצפויה, בדיקת זכויות מביטוח לאומי, תכנון מס אופטימלי, ובחירת אסטרטגיית משיכה (קצבה, הון, או שילוב).
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ליווי מקיף לפני פרישה. נרכז את כל המידע, נבנה תוכנית מותאמת אישית, ונלווה אתכם בכל שלב — כדי שהמעבר לפנסיה יהיה חלק, בטוח ומשתלם.
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
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#f4a261] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#5ec6c6] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">מתכוננים לפרישה?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לפני פרישה"
                description="מלאו את הפרטים וקבלו ניתוח מקיף של החסכונות הפנסיוניים שלכם"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PreRetirement;
