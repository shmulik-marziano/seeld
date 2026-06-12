import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Heart, Shield, TrendingUp, CheckCircle, Users, ChevronLeft } from "lucide-react";
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

const PensionLifeInsurance = () => {
  usePageMeta("ביטוח חיים פנסיוני");
  const productTypes = [
    {
      title: "הגנה מלאה",
      icon: Shield,
      doodle: "shield",
      color: "#e76f51",
      description: "ביטוח חיים שמגן על המשפחה במקרה של אובדן מפרנס",
      features: ["ביטוח חיים (ריסק)", "אובדן כושר עבודה", "פטור מפרמיות"],
    },
    {
      title: "חיסכון מצטבר",
      icon: TrendingUp,
      doodle: "growth",
      color: "#5ec6c6",
      description: "צבירת כספים לפנסיה במקביל לכיסוי ביטוחי",
      features: ["מרכיב חיסכון", "תשואה מנוהלת", "הטבות מס"],
    },
    {
      title: "גמישות מלאה",
      icon: Heart,
      doodle: "family",
      color: "#f4a261",
      description: "התאמת סכומי הביטוח והחיסכון לצרכים המשתנים",
      features: ["כיסויים מותאמים", "שינוי מסלולים", "עדכון תקופתי"],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין ביטוח מנהלים לקרן פנסיה?",
      a: "קרן פנסיה מנוהלת בצורה קולקטיבית עם תנאים אחידים, בעוד ביטוח מנהלים מאפשר התאמה אישית של הכיסויים. קרן פנסיה כוללת ביטוח אובדן כושר עבודה ושאירים מובנה, בעוד בביטוח מנהלים הכיסויים נרכשים בנפרד.",
    },
    {
      q: "האם אפשר להעביר ביטוח מנהלים לקרן פנסיה?",
      a: "כן, ניתן לבצע ניוד בין מוצרים פנסיוניים. עם זאת, חשוב לבדוק את ההשלכות לפני המעבר — למשל, אובדן תנאים ביטוחיים ייחודיים שקיימים בביטוח המנהלים הנוכחי.",
    },
    {
      q: "מה קורה עם הכסף בגיל הפרישה?",
      a: "בגיל הפרישה ניתן לקבל את הכספים כקצבה חודשית (פטורה ממס עד תקרה מסוימת), כסכום חד-פעמי (חייב במס), או שילוב של שניהם. חשוב לתכנן מראש את אסטרטגיית המשיכה.",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#e76f51]" />
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
            חיסכון פנסיוני עם <span className="text-[#e76f51]">הגנה מלאה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            שילוב בין חיסכון פנסיוני לביטוח חיים המעניק הגנה מקיפה למשפחה — ביטוח מנהלים עם כיסויים מותאמים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ניתוח ביטוח מנהלים חינם
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              סוגי כיסויים
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
          <span className="text-[#0a3d3d] font-medium">ביטוח חיים פנסיוני</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">יתרונות ביטוח מנהלים</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, doodle: "shield", title: "הגנה מקיפה", desc: "ביטוח חיים, נכות ופטור מפרמיות", color: "#e76f51" },
                { icon: TrendingUp, doodle: "growth", title: "חיסכון לפנסיה", desc: "צבירת כספים מנוהלת לעתיד", color: "#5ec6c6" },
                { icon: Heart, doodle: "family", title: "גמישות", desc: "כיסויים מותאמים לצרכים שלכם", color: "#f4a261" },
                { icon: Users, doodle: "handshake", title: "ליווי מקצועי", desc: "צוות יועצים מנוסה לאורך הדרך", color: "#90be6d" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">מרכיבי ביטוח מנהלים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">שילוב מושלם של חיסכון וביטוח</p>
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
                  ביטוח חיים פנסיוני (ביטוח מנהלים) הוא מוצר ייחודי שמשלב חיסכון לפנסיה עם כיסוי ביטוחי מקיף. בניגוד לקרן פנסיה שמנוהלת בצורה אחידה, ביטוח מנהלים מאפשר גמישות רבה יותר בהתאמת הכיסויים הביטוחיים לצרכים הספציפיים שלכם.
                </p>
                <p>
                  המוצר כולל מרכיב חיסכון שצובר כספים לפנסיה, לצד כיסויים ביטוחיים כמו ביטוח חיים (ריסק), אובדן כושר עבודה, ופטור מתשלום פרמיות. זוהי תכנית שמגנה על המשפחה בהווה ובונה עתיד כלכלי בטוח.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח מנהלים רלוונטי במיוחד למי שרוצה שליטה מלאה על הכיסויים הביטוחיים שלו. הוא מתאים לשכירים שרוצים כיסוי ביטוחי מותאם, לעצמאים שצריכים גמישות, ולבעלי הכנסה גבוהה שרוצים למקסם את החיסכון הפנסיוני.
                </p>
                <p>
                  אם יש לכם כבר ביטוח מנהלים ותיק, חשוב לבדוק אותו מעת לעת — פוליסות ישנות לרוב כוללות דמי ניהול גבוהים ותנאים פחות טובים. ייתכן שכדאי להעביר את הפוליסה או לעדכן אותה.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח מנהלים, שימו לב לדמי הניהול (מההפקדה ומהצבירה), לביצועי ההשקעה של החברה, לתנאי הכיסוי הביטוחי (במיוחד הגדרת אובדן כושר עבודה), ולגמישות בשינוי מסלולים. פוליסות שונות מציעות תנאים שונים מאוד.
                </p>
                <p>
                  ב-SEELD אנחנו מבצעים ניתוח מעמיק של ביטוחי המנהלים שלכם, משווים מול כל החברות בשוק, ומוודאים שאתם מקבלים את התנאים הטובים ביותר — הן בחלק החיסכוני והן בחלק הביטוחי.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים ניתוח ביטוח מנהלים חינם?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים ונבדוק אם הפוליסה שלכם מספקת את המיטב
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ניתוח ביטוח חיים פנסיוני"
                description="מלאו את הפרטים ונבדוק אם הפוליסה שלכם מספקת את המיטב"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PensionLifeInsurance;
