import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { LineChart, Target, Coins, CheckCircle, TrendingUp, BarChart3, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";

const Investment = () => {
  const productTypes = [
    {
      title: "התאמה אישית",
      icon: Target,
      color: "#5ec6c6",
      description: "תיק השקעות מותאם לצרכים שלכם",
      features: ["פרופיל סיכון אישי", "יעדים ברורים", "אסטרטגיה מותאמת"],
    },
    {
      title: "ניהול מקצועי",
      icon: TrendingUp,
      color: "#f4a261",
      description: "צוות מנהלי השקעות מנוסים",
      features: ["ניטור שוטף", "איזון תיק אוטומטי", "דוחות ביצועים"],
    },
    {
      title: "מגוון אפיקים",
      icon: BarChart3,
      color: "#90be6d",
      description: "גישה למגוון רחב של השקעות",
      features: ["מניות ואג\"ח", "נדל\"ן וסחורות", "קרנות מחקות"],
    },
  ];

  const faqItems = [
    {
      q: "כמה כסף צריך כדי להתחיל להשקיע?",
      a: "אין סכום מינימלי. אפשר להתחיל עם מאות שקלים בחודש בהוראת קבע. הדבר החשוב הוא להתחיל — גם סכומים קטנים שמושקעים באופן עקבי צוברים סכומים משמעותיים לאורך זמן.",
    },
    {
      q: "מה הסיכון בהשקעות?",
      a: "כל השקעה כרוכה בסיכון. ככל שפוטנציאל התשואה גבוה יותר, כך הסיכון גדול יותר. ניהול סיכונים נכון כולל פיזור השקעות, התאמה לאופק ההשקעה, ומעקב שוטף. לא שמים את כל הביצים בסל אחד.",
    },
    {
      q: "מה ההבדל בין ייעוץ השקעות לניהול תיקים?",
      a: "בייעוץ השקעות, המומחה מייעץ ואתם מקבלים החלטות. בניהול תיקים, מנהל ההשקעות מקבל החלטות עבורכם על פי מדיניות שהוגדרה מראש. שתי האפשרויות לגיטימיות — הבחירה תלויה בכמה אתם רוצים להיות מעורבים.",
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
            style={{ background: 'radial-gradient(circle, #e76f51 0%, transparent 70%)' }} />
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
            <div className="w-12 h-12 rounded-xl bg-[#e76f51] flex items-center justify-center shadow-lg">
              <LineChart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-white/40">חיסכון והשקעה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            בנו את <span className="text-[#e76f51]">העתיד הפיננסי</span> שלכם
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            פתרונות השקעה מותאמים אישית לבניית תיק השקעות אופטימלי המתאים לפרופיל הסיכון והיעדים שלכם.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-[#0a3d3d] font-bold text-base shadow-lg shadow-black/10 hover:bg-gray-100 transition-all min-h-[48px]">
              ייעוץ השקעות חינם
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 transition-all min-h-[48px]">
              פתרונות השקעה
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
          <span className="text-[#0a3d3d] font-medium">חיסכון והשקעה</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">פתרונות ההשקעה שלנו</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, title: "התאמה אישית", desc: "תיק השקעות מותאם לפרופיל שלכם", color: "#5ec6c6" },
                { icon: TrendingUp, title: "ניהול מקצועי", desc: "צוות מנהלי השקעות מנוסים", color: "#f4a261" },
                { icon: Coins, title: "פיזור סיכונים", desc: "אסטרטגיה חכמה להקטנת סיכון", color: "#90be6d" },
                { icon: BarChart3, title: "מגוון אפיקים", desc: "גישה למניות, אג\"ח, נדל\"ן ועוד", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי פתרונות השקעה</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">בחרו את הפתרון המתאים ליעדים הכלכליים שלכם</p>
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
                  השקעה חכמה היא המפתח לבניית עושר ואיתנות פיננסית לטווח ארוך. הכסף שיושב בעו״ש מאבד מערכו בגלל האינפלציה, בעוד כסף שמושקע נכון יכול לצמוח ולהכפיל את עצמו לאורך השנים. ההבדל בין חוסך להון משמעותי הוא לרוב לא כמה מרוויחים, אלא כמה חכם משקיעים.
                </p>
                <p>
                  ניהול השקעות מקצועי מבטיח שהכסף שלכם עובד בצורה אופטימלית — עם פיזור סיכונים חכם, התאמה לפרופיל הסיכון שלכם, ומעקב שוטף אחרי ביצועי התיק. לא צריך להיות מומחה בשוק ההון כדי ליהנות מתשואות טובות.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי להתחיל?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הזמן הטוב ביותר להתחיל להשקיע הוא אתמול. הזמן השני הטוב ביותר הוא היום. ככל שמתחילים מוקדם יותר, כך אפקט הריבית דריבית עובד חזק יותר לטובתכם. גם סכומים קטנים שמושקעים באופן עקבי לאורך שנים הופכים להון משמעותי.
                </p>
                <p>
                  ייעוץ השקעות רלוונטי בכל שלב: בתחילת הדרך כשרוצים לבנות תיק ראשון, כשיש סכום חד-פעמי להשקעה, כשמגיעים לנקודת מפנה כלכלית, או כשרוצים לבדוק שהתיק הקיים באמת עובד בצורה אופטימלית.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ניהול השקעות מוצלח מתחיל בהבנת פרופיל הסיכון שלכם: מהו אופק ההשקעה? כמה תנודתיות אתם מוכנים לספוג? מהם היעדים הכלכליים שלכם? על בסיס התשובות נבנה תיק מגוון שכולל מניות, אג״ח, נדל״ן ואפיקים נוספים בהתאמה אישית.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ייעוץ השקעות מקצועי שמתבסס על ניתוח מעמיק של המצב הכלכלי והיעדים שלכם. נבנה תיק מותאם אישית, נלווה אתכם לאורך הדרך, ונוודא שההשקעות שלכם תמיד מנוהלות בצורה אופטימלית.
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
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#e76f51] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#5ec6c6] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ייעוץ השקעות מקצועי?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="investment"
                title="ייעוץ השקעות אישי"
                description="ספרו לנו על היעדים שלכם ונבנה תוכנית השקעה מותאמת"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Investment;
