import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Umbrella, Banknote, HeartHandshake, CheckCircle, Shield, ChevronLeft } from "lucide-react";
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

const PostRetirement = () => {
  usePageMeta("אחרי פרישה");
  const productTypes = [
    {
      title: "ניהול קצבה",
      icon: Banknote,
      doodle: "savings",
      color: "#5ec6c6",
      description: "אופטימיזציה של הקצבה החודשית ותכנון תקציב",
      features: ["בדיקת קצבה", "תיאום מס", "מקסום הכנסה"],
    },
    {
      title: "זכויות פנסיונרים",
      icon: HeartHandshake,
      doodle: "family",
      color: "#f4a261",
      description: "מיצוי זכויות והטבות המגיעות לפנסיונרים",
      features: ["קצבת זקנה", "גמלת סיעוד", "הנחות והטבות"],
    },
    {
      title: "הגנה על הון",
      icon: Umbrella,
      doodle: "umbrella",
      color: "#90be6d",
      description: "שמירה על ערך החסכונות והשקעה בטוחה",
      features: ["ניהול סיכונים", "השקעות שמרניות", "ביטוח מתאים"],
    },
  ];

  const faqItems = [
    {
      q: "האם אפשר לעבוד אחרי הפרישה?",
      a: "כן, אין מניעה לעבוד לאחר הפרישה ולקבל קצבת פנסיה במקביל. עם זאת, חשוב לבצע תיאום מס כדי להבטיח שלא משלמים מס עודף. ההכנסה מעבודה עשויה להשפיע גם על קצבת הזקנה מביטוח לאומי.",
    },
    {
      q: "מה קורה עם הפנסיה של בן/בת הזוג אם נפטרתי?",
      a: "בן/בת הזוג זכאי/ת לקצבת שאירים מקרן הפנסיה, בדרך כלל בגובה 60% מהקצבה המקורית. חשוב לוודא שהמוטבים מעודכנים ולבדוק אם יש זכויות נוספות מביטוחי חיים ומביטוח לאומי.",
    },
    {
      q: "איך אני יודע שאני מקבל את הקצבה הנכונה?",
      a: "בדיקה מקצועית של הקצבה כוללת אימות הנתונים, חישוב מחדש, ובדיקה שכל תקופות הוותק ופרמטרי החישוב נכונים. טעויות בחישוב הקצבה שכיחות למדי ויכולות לעלות הרבה כסף לאורך זמן.",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#90be6d]" />
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
            ניהול <span className="text-[#90be6d]">חכם של הפנסיה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            ניהול חכם של הפנסיה והחסכונות לאחר הפרישה — מיצוי זכויות, אופטימיזציה של הקצבה ושמירה על ערך ההון.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ייעוץ לאחר פרישה
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
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
          <span className="text-[#0a3d3d] font-medium">אחרי פרישה</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">מה כולל ליווי אחרי פרישה?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Banknote, doodle: "savings", title: "אופטימיזציית קצבה", desc: "מקסום הקצבה החודשית שלכם", color: "#5ec6c6" },
                { icon: HeartHandshake, doodle: "family", title: "מיצוי זכויות", desc: "ניצול כל ההטבות והזכויות", color: "#f4a261" },
                { icon: Umbrella, doodle: "umbrella", title: "הגנה על הון", desc: "שמירה על ערך החסכונות", color: "#90be6d" },
                { icon: Shield, doodle: "shield", title: "ביטוח מתאים", desc: "כיסוי רפואי וסיעודי מותאם", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">שירותים לפנסיונרים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">ליווי מקיף לניהול חכם של הכספים אחרי הפרישה</p>
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
                  הפרישה היא לא הסוף — זו תחילת פרק חדש שיכול להימשך 20-30 שנה ויותר. ניהול נכון של הכספים לאחר הפרישה הוא קריטי: צריך לוודא שהקצבה החודשית מספיקה, שהחסכונות שומרים על ערכם, ושכל הזכויות וההטבות מנוצלות במלואן.
                </p>
                <p>
                  רבים מגלים רק לאחר הפרישה שהם לא ממצים את הזכויות שלהם — החזרי מס, הנחות, קצבאות נוספות מביטוח לאומי, ותיאום מס על הקצבה. ייעוץ מקצועי יכול להוסיף אלפי שקלים בשנה להכנסה הפנויה שלכם.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לפנות?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ליווי פנסיוני לאחר פרישה רלוונטי מיד עם תחילת קבלת הקצבה. אם כבר פרשתם ולא ביצעתם בדיקה מקיפה — עכשיו זה הזמן. כל חודש שעובר בלי אופטימיזציה הוא כסף שנשאר על השולחן.
                </p>
                <p>
                  מומלץ גם לבצע בדיקה תקופתית, לפחות אחת לשנה. תנאי המס משתנים, זכויות מתעדכנות, ויש הזדמנויות חדשות שכדאי לנצל. אנחנו ב-SEELD נוודא שאתם תמיד מקבלים את המקסימום.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  לאחר הפרישה, יש מספר נושאים קריטיים: תיאום מס על הקצבה (להבטיח שלא משלמים יותר מדי), מיצוי קצבאות ביטוח לאומי (קצבת זקנה, גמלת סיעוד), ניהול חסכונות והשקעות (התאמת רמת הסיכון לגיל), וביטוח רפואי וסיעודי מתאים.
                </p>
                <p>
                  ב-SEELD אנחנו מציעים ליווי מקיף לפנסיונרים: נבדוק את הקצבה שלכם, נוודא שאתם ממצים כל זכות, נתאים את הביטוחים, ונבנה תוכנית כלכלית שמבטיחה איכות חיים גבוהה לאורך שנים.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">כבר בפנסיה? בואו נוודא שאתם ממצים הכל</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                הזינו את הפרטים ונבדוק שאתם מקבלים את המקסימום
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לאחר פרישה"
                description="מלאו את הפרטים ונבדוק שאתם ממצים את כל הזכויות שלכם"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PostRetirement;
