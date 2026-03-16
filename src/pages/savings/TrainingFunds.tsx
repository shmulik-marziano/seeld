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

const TrainingFunds = () => {
  const productTypes = [
    {
      title: "פטור ממס",
      icon: TrendingUp,
      color: "#5ec6c6",
      description: "פטור מלא ממס רווחי הון — כל הרווחים שלכם",
      features: ["0% מס על רווחים", "ניכוי מס על הפקדות", "חיסכון של אלפי שקלים"],
    },
    {
      title: "נזילות מהירה",
      icon: Clock,
      color: "#f4a261",
      description: "משיכה פטורה לאחר 6 שנים בלבד",
      features: ["ללא קנסות", "שימוש חופשי בכספים", "לכל מטרה"],
    },
    {
      title: "מטרות מגוונות",
      icon: GraduationCap,
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
      a: "כן, המעבר חינמי ופשוט. אפשר לעבור לקרן עם דמי ניהול נמוכים יותר או ביצועים טובים יותר בכל עת. אנחנו ב-SeelD מטפלים בכל התהליך עבורכם.",
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
            <div className="w-12 h-12 rounded-full bg-[#90be6d] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">קרנות השתלמות</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            החיסכון <span className="text-[#90be6d]">הכי משתלם</span> בישראל
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            קרן השתלמות היא אפיק החיסכון המועדף בישראל — פטור מלא ממס רווחי הון ונזילות לאחר 6 שנים בלבד.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ניתוח קרנות חינם
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              יתרונות הקרן
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
                { icon: Banknote, title: "פטור מלא ממס", desc: "0% מס על כל הרווחים שצברתם", color: "#5ec6c6" },
                { icon: Clock, title: "נזילות ב-6 שנים", desc: "כספים נזילים לאחר 6 שנים", color: "#f4a261" },
                { icon: TrendingUp, title: "תשואות גבוהות", desc: "ביצועים מעולים לאורך זמן", color: "#90be6d" },
                { icon: GraduationCap, title: "לכל מטרה", desc: "שימוש חופשי בכספים לאחר נזילות", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">יתרונות קרן השתלמות</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">האפיק היחיד בישראל עם פטור מלא ממס רווחי הון</p>
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
                  ב-SeelD אנחנו מבצעים ניתוח מעמיק של קרנות ההשתלמות שלכם, משווים ביצועים ודמי ניהול מול כל הקרנות בשוק, ומוצאים את הקרן שתניב לכם את התשואה הטובה ביותר — ללא עלות.
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
