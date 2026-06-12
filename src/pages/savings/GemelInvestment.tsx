import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { TrendingUp, PiggyBank, Shield, CheckCircle, Calculator, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import CompanyLogos from "@/components/CompanyLogos";
import DoodleIcon from "@/components/DoodleIcon";
import { usePageMeta } from "@/hooks/usePageMeta";

const GemelInvestment = () => {
  usePageMeta("קופת גמל להשקעה");
  const productTypes = [
    {
      title: "נזילות גבוהה",
      icon: TrendingUp,
      doodle: "growth",
      color: "#5ec6c6",
      description: "אפשרות למשיכת כספים בכל עת ללא קנסות או הגבלות",
      features: ["משיכה מיידית", "ללא קנסות", "גמישות מלאה"],
    },
    {
      title: "דחיית מס",
      icon: PiggyBank,
      doodle: "savings",
      color: "#f4a261",
      description: "דחיית תשלום מס רווחי הון עד למועד המשיכה בפועל",
      features: ["0% מס עד משיכה", "פטור בגיל 60 כקצבה", "ריבית דריבית מלאה"],
    },
    {
      title: "מסלולי השקעה",
      icon: Shield,
      doodle: "shield",
      color: "#90be6d",
      description: "מגוון מסלולי השקעה המותאמים לפרופיל הסיכון שלכם",
      features: ["מסלולים מנוהלים", "התאמה אישית", "מעקב ביצועים"],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין קופת גמל להשקעה לקרן נאמנות?",
      a: "ההבדל המרכזי הוא במיסוי: בקרן נאמנות משלמים מס רווחי הון בכל מימוש, בעוד בקופת גמל להשקעה המס נדחה עד למשיכה. בנוסף, בגיל 60 ניתן למשוך כקצבה עם פטור מלא ממס.",
    },
    {
      q: "האם אפשר למשוך כסף בכל עת?",
      a: "כן, קופת גמל להשקעה היא נזילה לחלוטין. ניתן למשוך את הכספים בכל עת ללא קנסות. עם זאת, במשיכה לפני גיל 60 תשלמו מס רווחי הון של 25% על הרווחים בלבד.",
    },
    {
      q: "כמה אפשר להפקיד בשנה?",
      a: "תקרת ההפקדה השנתית עומדת על כ-79,000 שקלים. ניתן להפקיד סכום חד-פעמי או בהוראת קבע חודשית, ואין סכום מינימלי להפקדה.",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            השקיעו <span className="text-[#5ec6c6]">בחכמה</span> עם יתרונות מס
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            מוצר השקעה ייחודי המשלב את היתרונות של קופת גמל עם גמישות של חשבון השקעות — נזילות מלאה ודחיית מס.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ייעוץ לקופת גמל להשקעה
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              יתרונות המוצר
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
          <span className="text-[#0a3d3d] font-medium">קופת גמל להשקעה</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">למה קופת גמל להשקעה?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: TrendingUp, doodle: "growth", title: "נזילות מלאה", desc: "משיכת כספים בכל עת ללא קנסות", color: "#5ec6c6" },
                { icon: PiggyBank, doodle: "savings", title: "דחיית מס", desc: "0% מס על רווחים עד למשיכה", color: "#f4a261" },
                { icon: Calculator, doodle: "calculator", title: "ריבית דריבית", desc: "הכסף עובד בצורה מלאה ללא ניכויים", color: "#90be6d" },
                { icon: Shield, doodle: "shield", title: "מסלולים מגוונים", desc: "התאמת מסלול ההשקעה לפרופיל שלכם", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">יתרונות קופת גמל להשקעה</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">הכירו את היתרונות המרכזיים של המוצר</p>
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
                  קופת גמל להשקעה היא אחד מאפיקי החיסכון האטרקטיביים ביותר בישראל. בניגוד לחשבון השקעות רגיל, קופת גמל להשקעה מאפשרת דחיית מס רווחי הון — כלומר, אתם לא משלמים מס על הרווחים כל עוד הכסף נשאר בקופה. זה אומר שהריבית דריבית עובדת לטובתכם בצורה מלאה.
                </p>
                <p>
                  בנוסף, קופת גמל להשקעה מציעה נזילות מלאה — אפשר למשוך את הכספים בכל עת ללא קנסות. ובגיל 60, אם בוחרים למשוך את הכסף כקצבה חודשית, ניתן ליהנות מפטור מלא ממס רווחי הון. זוהי תכנית שמשלבת את הטוב משני העולמות: גמישות של חשבון השקעות ויתרונות מס של מוצר פנסיוני.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  קופת גמל להשקעה מתאימה לכל גיל ולכל רמת הכנסה. היא אידיאלית למי שכבר מפקיד את המקסימום לקרן השתלמות ומחפש אפיק חיסכון נוסף עם יתרונות מס. גם מי שרק מתחיל לחסוך ימצא בקופה כלי נהדר לבניית הון לטווח ארוך.
                </p>
                <p>
                  מומלץ במיוחד לפתוח קופת גמל להשקעה כשיש לכם כסף פנוי שאתם רוצים להשקיע אך אינכם רוצים להיות כבולים. אפשר להפקיד עד 79,006 שקלים בשנה (נכון ל-2025), ואין הגבלה על סכום ההפקדה המינימלי.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת קופת גמל להשקעה, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי הקופה לאורך זמן, למגוון מסלולי ההשקעה הזמינים, ולשירות הלקוחות. הבדל של חצי אחוז בדמי ניהול יכול להצטבר לעשרות אלפי שקלים לאורך השנים.
                </p>
                <p>
                  ב-SEELD אנחנו משווים עבורכם את כל קופות הגמל להשקעה, מנתחים ביצועים ודמי ניהול, ומוצאים את הקופה שמתאימה בדיוק לפרופיל ההשקעה ולמטרות שלכם.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ייעוץ לקופת גמל להשקעה?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים ונמצא לכם את הקופה המתאימה ביותר
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="savings"
                title="ייעוץ לקופת גמל להשקעה"
                description="מלאו את הפרטים ונמצא לכם את הקופה המתאימה ביותר"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GemelInvestment;
