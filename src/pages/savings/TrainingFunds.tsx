import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { GraduationCap, TrendingUp, Clock, CheckCircle, Banknote, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import DoodleIcon from "@/components/DoodleIcon";

const TrainingFunds = () => {
  const productTypes = [
    {
      title: "פטור ממס",
      icon: TrendingUp,
      doodle: "growth",
      color: "#5ec6c6",
      description: "פטור מלא ממס רווחי הון — כל הרווחים שלכם",
      features: ["0% מס על רווחים", "ניכוי מס על הפקדות", "חיסכון של אלפי שקלים"],
    },
    {
      title: "נזילות מהירה",
      icon: Clock,
      doodle: "target",
      color: "#f4a261",
      description: "משיכה פטורה לאחר 6 שנים בלבד",
      features: ["ללא קנסות", "שימוש חופשי בכספים", "לכל מטרה"],
    },
    {
      title: "מטרות מגוונות",
      icon: GraduationCap,
      doodle: "lightbulb",
      color: "#90be6d",
      description: "לא רק להשתלמויות — לכל מטרה שתרצו",
      features: ["דירה לילדים", "חופשה גדולה", "כל יעד שתבחרו"],
    },
  ];

  const faqItems = [
    {
      q: "מתי אפשר למשוך כסף מקרן השתלמות?",
      a: "לאחר 6 שנים ממועד ההפקדה הראשונה, הכספים נזילים לחלוטין ופטורים ממס רווחי הון. ניתן להשתמש בכסף לכל מטרה — אין חובה שהשימוש יהיה קשור להשתלמות.",
    },
    {
      q: "כמה אפשר להפקיד בקרן השתלמות?",
      a: "לשכירים, תקרת ההפקדה המוטבת היא עד 15,712 שקלים בשנה (חלק עובד + מעסיק). לעצמאים, התקרה עומדת על כ-19,500 שקלים בשנה עם ניכוי מס.",
    },
    {
      q: "האם אפשר להעביר קרן השתלמות בין חברות?",
      a: "כן, המעבר חינמי ופשוט. אפשר לעבור לקרן עם דמי ניהול נמוכים יותר או ביצועים טובים יותר בכל עת. אנחנו ב-SEELD מטפלים בכל התהליך עבורכם.",
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#90be6d] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-white/40">קרנות השתלמות</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            החיסכון <span className="text-[#90be6d]">הכי משתלם</span> בישראל
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            קרן השתלמות היא אפיק החיסכון המועדף בישראל — פטור מלא ממס רווחי הון ונזילות לאחר 6 שנים בלבד.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-[#0a3d3d] font-bold text-base shadow-lg shadow-black/10 hover:bg-gray-100 transition-all min-h-[48px]">
              ניתוח קרנות חינם
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 transition-all min-h-[48px]">
              יתרונות הקרן
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
          <span className="text-[#0a3d3d] font-medium">קרנות השתלמות</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">למה קרן השתלמות?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Banknote, doodle: "savings", title: "פטור מלא ממס", desc: "0% מס על כל הרווחים שצברתם", color: "#5ec6c6" },
                { icon: Clock, doodle: "target", title: "נזילות ב-6 שנים", desc: "כספים נזילים לאחר 6 שנים", color: "#f4a261" },
                { icon: TrendingUp, doodle: "growth", title: "תשואות גבוהות", desc: "ביצועים מעולים לאורך זמן", color: "#90be6d" },
                { icon: GraduationCap, doodle: "lightbulb", title: "לכל מטרה", desc: "שימוש חופשי בכספים לאחר נזילות", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">יתרונות קרן השתלמות</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">האפיק היחיד בישראל עם פטור מלא ממס רווחי הון</p>
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
                  קרן השתלמות היא אפיק החיסכון היחיד בישראל שנהנה מפטור מלא ממס רווחי הון. המשמעות היא שכל הרווחים שהכסף שלכם מניב — 100% שלכם, ללא ניכוי מס. אין שום מוצר פיננסי אחר שמציע יתרון כזה.
                </p>
                <p>
                  לשכירים, קרן השתלמות היא הטבה משמעותית: המעסיק מפקיד 7.5% מהשכר, העובד מפקיד 2.5%, וההפקדות מוכרות כהוצאה לצרכי מס. לעצמאים, ההפקדה לקרן השתלמות מזכה בניכוי מס משמעותי. לאחר 6 שנים הכסף נזיל לחלוטין ואפשר להשתמש בו לכל מטרה.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לפעול?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  לשכירים — מומלץ לוודא שהמעסיק מפקיד לקרן השתלמות כבר מהיום הראשון בעבודה. אם המעסיק לא מציע קרן השתלמות, שקלו לבקש זאת כחלק מתנאי ההעסקה. לעצמאים — כדאי לפתוח קרן השתלמות מיד עם תחילת הפעילות העצמאית.
                </p>
                <p>
                  חשוב לבצע בדיקה תקופתית של ביצועי הקרן ודמי הניהול. הפרש של אחוז אחד בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך שנים. מעבר בין קרנות הוא תהליך פשוט וחינמי.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת קרן השתלמות, יש לבחון שלושה פרמטרים מרכזיים: דמי ניהול (ככל שנמוכים יותר — טוב יותר), ביצועי הקרן לאורך זמן (לפחות 5-10 שנים), ומסלול ההשקעה (מניות, אג״ח, מסלול כללי וכו׳). לא תמיד הקרן הזולה ביותר היא הטובה ביותר — חשוב לראות את התמונה הכוללת.
                </p>
                <p>
                  ב-SEELD אנחנו מבצעים ניתוח מעמיק של קרנות ההשתלמות שלכם, משווים ביצועים ודמי ניהול מול כל הקרנות בשוק, ומוצאים את הקרן שתניב לכם את התשואה הטובה ביותר — ללא עלות.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ניתוח קרנות השתלמות חינם?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                בדקו אם הקרנות שלכם מניבות את התשואה המיטבית
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="savings"
                title="ניתוח קרנות השתלמות"
                description="בדקו אם הקרנות שלכם מניבות את התשואה המיטבית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TrainingFunds;
