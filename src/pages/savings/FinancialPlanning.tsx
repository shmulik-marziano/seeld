import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Target, PieChart, Lightbulb, CheckCircle, TrendingUp, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import DoodleIcon from "@/components/DoodleIcon";

const FinancialPlanning = () => {
  const productTypes = [
    {
      title: "ניתוח מקיף",
      icon: PieChart,
      doodle: "charts",
      color: "#5ec6c6",
      description: "מיפוי מלא של המצב הכלכלי והגדרת יעדים",
      features: ["מיפוי הכנסות והוצאות", "הגדרת יעדים", "זיהוי הזדמנויות"],
    },
    {
      title: "תוכנית פעולה",
      icon: Target,
      doodle: "target",
      color: "#f4a261",
      description: "בניית אסטרטגיה מותאמת אישית להשגת היעדים",
      features: ["אסטרטגיה מותאמת", "לוחות זמנים", "יעדים מדידים"],
    },
    {
      title: "ליווי שוטף",
      icon: Lightbulb,
      doodle: "lightbulb",
      color: "#90be6d",
      description: "מעקב ועדכון התוכנית בהתאם לשינויים בחיים",
      features: ["פגישות תקופתיות", "עדכוני תוכנית", "תמיכה מקצועית"],
    },
  ];

  const faqItems = [
    {
      q: "מה כולל תהליך תכנון כלכלי?",
      a: "התהליך כולל פגישת היכרות, איסוף נתונים כלכליים מלאים, ניתוח מעמיק, הצגת ממצאים והמלצות, בניית תוכנית פעולה, ויישום עם ליווי שוטף. הכל מותאם אישית למצב ולצרכים שלכם.",
    },
    {
      q: "כמה זמן לוקח התהליך?",
      a: "תהליך התכנון הראשוני לוקח בדרך כלל 2-4 שבועות, כולל איסוף מידע, ניתוח ובניית התוכנית. הליווי השוטף ממשיך לאורך זמן עם פגישות תקופתיות לעדכון ומעקב.",
    },
    {
      q: "האם תכנון כלכלי רלוונטי גם למי שלא מרוויח הרבה?",
      a: "בהחלט. דווקא מי שההכנסה שלו מוגבלת צריך תכנון כלכלי חכם כדי למקסם כל שקל. ניהול נכון של תקציב, ניצול הטבות מס, ובחירת מוצרים פיננסיים נכונים יכולים לשנות משמעותית את המצב הכלכלי.",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, hsl(168 42% 14%) 0%, hsl(152 42% 18%) 40%, hsl(160 38% 24%) 70%, hsl(145 30% 18%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #5ec6c6 0%, transparent 70%)' }} />
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
            <div className="w-12 h-12 rounded-xl bg-[#0a3d3d] flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-white/40">תכנון כלכלי מתקדם</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            המרכז <span className="text-[#5ec6c6]">לתכנון כלכלי</span> מתקדם
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            ליווי מקצועי ומקיף לבניית תוכנית כלכלית אישית ארוכת טווח — מפת דרכים כלכלית שמלווה אתכם לכל החיים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-[#0a3d3d] font-bold text-base shadow-lg shadow-black/10 hover:bg-gray-100 transition-all min-h-[48px]">
              ייעוץ לתכנון כלכלי
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 transition-all min-h-[48px]">
              מה כולל השירות
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
          <span className="text-[#0a3d3d] font-medium">תכנון כלכלי מתקדם</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">למה תכנון כלכלי?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: PieChart, doodle: "charts", title: "ניתוח מקיף", desc: "מיפוי מלא של המצב הכלכלי", color: "#5ec6c6" },
                { icon: Target, doodle: "target", title: "יעדים ברורים", desc: "הגדרת יעדים מדידים וריאליים", color: "#f4a261" },
                { icon: TrendingUp, doodle: "growth", title: "מקסום הון", desc: "אסטרטגיה להגדלת ההון שלכם", color: "#90be6d" },
                { icon: Lightbulb, doodle: "lightbulb", title: "ליווי שוטף", desc: "מעקב ועדכון לאורך כל הדרך", color: "#e76f51" },
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

        {/* Product Types */}
        <section id="product-types" className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">שלבי התכנון הכלכלי</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">תהליך מובנה שמוביל לתוצאות</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productTypes.map((type, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה זה חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  תכנון כלכלי הוא לא רק לעשירים. כל אדם ומשפחה צריכים תוכנית שמגדירה לאן הכסף הולך, מה היעדים הכלכליים, ואיך מגיעים אליהם. בלי תוכנית, רוב האנשים מגיעים לנקודות מפתח בחיים — רכישת דירה, חינוך ילדים, פרישה — בלי מספיק משאבים.
                </p>
                <p>
                  תכנון כלכלי מקצועי מסתכל על התמונה הרחבה: הכנסות, הוצאות, חסכונות, ביטוחים, מיסוי, ירושה ועוד. הוא מזהה הזדמנויות שלא ניצלתם, סיכונים שלא חשבתם עליהם, ודרכים להגדיל את ההון שלכם לאורך זמן. מדובר במפת דרכים כלכלית שמלווה אתכם לכל החיים.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי להתחיל?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  תכנון כלכלי רלוונטי בכל שלב בחיים, אבל ישנם רגעים שבהם הוא קריטי במיוחד: כשמתחילים לעבוד ומרוויחים את המשכורת הראשונה, לפני רכישת דירה, כשנולד ילד, כשמתגרשים, כשיורשים כסף, או כשמתקרבים לפרישה.
                </p>
                <p>
                  אם אף פעם לא עשיתם תכנון כלכלי מסודר — עכשיו זה הזמן הטוב ביותר להתחיל. כל יום שעובר בלי תוכנית הוא יום שאתם לא ממקסמים את הפוטנציאל הכלכלי שלכם. גם שינויים קטנים יכולים לעשות הבדל גדול לאורך זמן.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  תכנון כלכלי מקצועי כולל מספר רבדים: ניתוח תזרים מזומנים, בניית קרן חירום, תכנון ביטוחי (חיים, בריאות, סיעודי), תכנון פנסיוני, אסטרטגיית השקעות, תכנון מס, ותכנון ירושה. כל רובד חשוב ומשלים את האחרים.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים שירות תכנון כלכלי מקיף ואישי. נמפה את המצב הכלכלי הנוכחי שלכם, נגדיר יעדים ברורים, ונבנה תוכנית פעולה מפורטת עם ליווי שוטף. כל זה בגישה אנושית, מקצועית וללא מילים מסובכות.
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
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#5ec6c6] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#f4a261] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">מוכנים לתכנון כלכלי מקצועי?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים ונבנה עבורכם תוכנית כלכלית מותאמת אישית
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לתכנון כלכלי"
                description="מלאו את הפרטים ונבנה עבורכם תוכנית כלכלית מותאמת אישית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FinancialPlanning;
