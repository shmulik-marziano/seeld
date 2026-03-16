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

const GemelFunds = () => {
  const benefits = [
    {
      title: "ניהול מקצועי",
      icon: TrendingUp,
      color: "#5ec6c6",
      description: "ניהול השקעות על ידי גופים מובילים בשוק ההון",
      items: ["מנהלי השקעות מנוסים", "פיזור סיכונים"],
    },
    {
      title: "גמישות מלאה",
      icon: Shield,
      color: "#f4a261",
      description: "בחירה בין משיכה הונית לקצבה",
      items: ["סכום חד פעמי", "קצבה חודשית"],
    },
    {
      title: "הטבות מס",
      icon: Calculator,
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

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-8 left-10 w-20 h-20 rounded-full bg-[#5ec6c6] opacity-12" />
        <div className="absolute bottom-6 right-12 w-14 h-14 rounded-full bg-[#f4a261] opacity-15" />
        <div className="absolute top-16 right-1/3 w-10 h-10 rounded-full bg-[#e76f51] opacity-18" />
        <div className="absolute bottom-12 left-1/4 w-6 h-6 rounded-full bg-[#90be6d] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#5ec6c6] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">קופות גמל</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            גמישות מקסימלית <span className="text-[#5ec6c6]">בחיסכון שלכם</span>
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            קופת גמל היא מכשיר חיסכון גמיש המאפשר בחירה בין משיכה הונית לקצבה חודשית. הכספים מנוהלים בידי מומחים ונהנים מהטבות מס.
          </p>
          <div className="mt-6">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
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
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: benefit.color }}>
                      <benefit.icon className="w-5 h-5 text-white" />
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
