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

const FinancialPlanning = () => {
  const productTypes = [
    {
      title: "ניתוח מקיף",
      icon: PieChart,
      color: "#5ec6c6",
      description: "מיפוי מלא של המצב הכלכלי והגדרת יעדים",
      features: ["מיפוי הכנסות והוצאות", "הגדרת יעדים", "זיהוי הזדמנויות"],
    },
    {
      title: "תוכנית פעולה",
      icon: Target,
      color: "#f4a261",
      description: "בניית אסטרטגיה מותאמת אישית להשגת היעדים",
      features: ["אסטרטגיה מותאמת", "לוחות זמנים", "יעדים מדידים"],
    },
    {
      title: "ליווי שוטף",
      icon: Lightbulb,
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

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-6 left-8 w-24 h-24 rounded-full bg-[#5ec6c6] opacity-12" />
        <div className="absolute bottom-8 right-14 w-16 h-16 rounded-full bg-[#90be6d] opacity-15" />
        <div className="absolute top-20 right-1/3 w-10 h-10 rounded-full bg-[#f4a261] opacity-18" />
        <div className="absolute bottom-14 left-1/4 w-6 h-6 rounded-full bg-[#e76f51] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#0a3d3d] flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">תכנון כלכלי מתקדם</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            המרכז <span className="text-[#5ec6c6]">לתכנון כלכלי</span> מתקדם
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ליווי מקצועי ומקיף לבניית תוכנית כלכלית אישית ארוכת טווח — מפת דרכים כלכלית שמלווה אתכם לכל החיים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ייעוץ לתכנון כלכלי
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              מה כולל השירות
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
                { icon: PieChart, title: "ניתוח מקיף", desc: "מיפוי מלא של המצב הכלכלי", color: "#5ec6c6" },
                { icon: Target, title: "יעדים ברורים", desc: "הגדרת יעדים מדידים וריאליים", color: "#f4a261" },
                { icon: TrendingUp, title: "מקסום הון", desc: "אסטרטגיה להגדלת ההון שלכם", color: "#90be6d" },
                { icon: Lightbulb, title: "ליווי שוטף", desc: "מעקב ועדכון לאורך כל הדרך", color: "#e76f51" },
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

        {/* Product Types */}
        <section id="product-types" className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">שלבי התכנון הכלכלי</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">תהליך מובנה שמוביל לתוצאות</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productTypes.map((type, idx) => (
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
                  ב-SeelD אנחנו מציעים שירות תכנון כלכלי מקיף ואישי. נמפה את המצב הכלכלי הנוכחי שלכם, נגדיר יעדים ברורים, ונבנה תוכנית פעולה מפורטת עם ליווי שוטף. כל זה בגישה אנושית, מקצועית וללא מילים מסובכות.
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
