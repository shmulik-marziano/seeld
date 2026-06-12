import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Wallet, TrendingUp, Shield, Calculator, CheckCircle, ChevronLeft } from "lucide-react";
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

const GemelFunds = () => {
  usePageMeta("קופות גמל");
  const benefits = [
    {
      title: "ניהול מקצועי",
      icon: TrendingUp,
      doodle: "growth",
      color: "#5ec6c6",
      description: "ניהול השקעות על ידי גופים מובילים בשוק ההון",
      items: ["מנהלי השקעות מנוסים", "פיזור סיכונים"],
    },
    {
      title: "גמישות מלאה",
      icon: Shield,
      doodle: "shield",
      color: "#f4a261",
      description: "בחירה בין משיכה הונית לקצבה",
      items: ["סכום חד פעמי", "קצבה חודשית"],
    },
    {
      title: "הטבות מס",
      icon: Calculator,
      doodle: "calculator",
      color: "#90be6d",
      description: "חיסכון משמעותי במס",
      items: ["זיכוי מס על הפקדות", "פטור ממס רווחי הון"],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין קופת גמל לקרן פנסיה?",
      a: "קרן פנסיה כוללת כיסויים ביטוחיים (נכות ושאירים) ומחייבת קבלת קצבה חודשית. קופת גמל היא מוצר חיסכון טהור עם גמישות רבה יותר, כולל אפשרות למשיכה הונית. לרוב מומלץ שילוב של שניהם.",
    },
    {
      q: "מתי אפשר למשוך כסף מקופת גמל?",
      a: "קופת גמל לחיסכון ניתנת למשיכה בגיל 60. קופת גמל להשקעה ניתנת למשיכה בכל עת (לאחר 6 שנים מההפקדה הראשונה עם פטור ממס רווחי הון, או לפני כן עם תשלום מס).",
    },
    {
      q: "האם כדאי להעביר קופת גמל ישנה?",
      a: "במקרים רבים כן. קופות גמל ישנות עשויות לגבות דמי ניהול גבוהים ולהשקיע במסלולים שאינם אופטימליים. העברת קופת גמל היא תהליך פשוט וללא עלות, וניתוח מקצועי יחשוף האם כדאי לבצע מהלך כזה.",
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
            גמישות מקסימלית <span className="text-[#5ec6c6]">בחיסכון שלכם</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ניתוח קופות גמל חינם
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
          <span className="text-[#0a3d3d] font-medium">קופות גמל</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">יתרונות קופת גמל</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">חיסכון חכם עם גמישות מקסימלית והטבות מס</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 flex items-center justify-center">
                      <DoodleIcon name={benefit.doodle} size={48} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a3d3d]">{benefit.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{benefit.description}</p>
                  <ul className="space-y-2">
                    {benefit.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: benefit.color }} />
                        {item}
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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה קופת גמל חשובה?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  קופת גמל היא מכשיר חיסכון ייחודי המשלב גמישות מקסימלית עם הטבות מס משמעותיות. בניגוד לקרן פנסיה, קופת גמל מאפשרת לכם לבחור בפרישה בין משיכת הכסף כסכום חד פעמי (משיכה הונית) לבין קבלת קצבה חודשית - גמישות שלא קיימת במוצרים פנסיוניים אחרים.
                </p>
                <p>
                  קופת גמל להשקעה, שהושקה בשנת 2016, היא מוצר חיסכון מעולה גם לטווח בינוני. היא מאפשרת הפקדות ללא תקרה, ניהול מקצועי של ההשקעות, ופטור ממס רווחי הון בעת משיכה כקצבה. זהו מכשיר חיסכון שכל משק בית צריך לשקול.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לפתוח קופת גמל?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  קופת גמל מתאימה בכל שלב בחיים. עצמאים יכולים להפקיד לקופת גמל וליהנות מהטבות מס משמעותיות. שכירים יכולים להפקיד מעבר להפקדות החובה של המעסיק כדי להגדיל את החיסכון. גם הורים יכולים לפתוח קופת גמל להשקעה עבור הילדים כחיסכון לטווח ארוך.
                </p>
                <p>
                  מומלץ לבצע ניתוח תקופתי של קופות הגמל הקיימות שלכם, לבדוק את דמי הניהול ואת ביצועי ההשקעות, ולוודא שהכסף שלכם מנוהל בצורה אופטימלית.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ישנם מספר סוגי קופות גמל: קופת גמל לחיסכון (המשך הקופות הישנות), קופת גמל להשקעה (מוצר חדש וגמיש), וקופת גמל לתגמולים. לכל סוג תנאים שונים בנוגע למשיכה, מיסוי והטבות. חשוב לבחור את המוצר הנכון בהתאם למטרת החיסכון ולאופק ההשקעה.
                </p>
                <p>
                  ב-SEELD אנחנו מנתחים את כל קופות הגמל שלכם, בודקים דמי ניהול, תשואות ומסלולי השקעה, ומוודאים שהכסף שלכם עובד בצורה הטובה ביותר. הייעוץ שלנו חינמי ואובייקטיבי.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ניתוח קופות גמל חינמי?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="savings"
                title="ניתוח קופות גמל"
                description="הזינו את פרטי הקופות הקיימות וקבלו המלצות לשיפור"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GemelFunds;
