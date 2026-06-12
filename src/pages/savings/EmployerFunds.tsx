import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { Building2, Users, Coins, CheckCircle, Shield, ChevronLeft } from "lucide-react";
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

const EmployerFunds = () => {
  usePageMeta("קופות מרכזיות למעסיק");
  const productTypes = [
    {
      title: "ניהול קולקטיבי",
      icon: Users,
      doodle: "handshake",
      color: "#5ec6c6",
      description: "ניהול מרוכז של זכויות העובדים בקופה אחת",
      features: ["ניהול מרכזי", "כוח מיקוח חזק", "יעילות תפעולית"],
    },
    {
      title: "חיסכון בעלויות",
      icon: Coins,
      doodle: "savings",
      color: "#f4a261",
      description: "דמי ניהול מופחתים הודות לכוח המיקוח של הארגון",
      features: ["דמי ניהול מוזלים", "חיסכון לעובדים", "תנאים מועדפים"],
    },
    {
      title: "שירות ארגוני",
      icon: Building2,
      doodle: "handshake",
      color: "#90be6d",
      description: "ליווי מקצועי למחלקת משאבי אנוש ולעובדים",
      features: ["הדרכות לעובדים", "תמיכה שוטפת", "דוחות תקופתיים"],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין קופה מרכזית לפיצויים לקופה אישית?",
      a: "קופה מרכזית מנוהלת ברמת הארגון ומאפשרת דמי ניהול מוזלים הודות לכוח המיקוח הקולקטיבי. קופה אישית מנוהלת ברמת העובד הבודד. בשני המקרים, הכספים שייכים לעובד.",
    },
    {
      q: "האם העובד יכול לבחור לאן להפריש?",
      a: "על פי חוק, לעובד יש את הזכות לבחור את הגוף הפנסיוני שלו. עם זאת, מעסיקים רבים מציעים הסדר ארגוני עם תנאים מועדפים שמשתלמים יותר לעובד.",
    },
    {
      q: "כמה אפשר לחסוך בדמי ניהול?",
      a: "בהסדר ארגוני, דמי הניהול יכולים להיות נמוכים משמעותית — לעתים 50% פחות מדמי הניהול הסטנדרטיים. ההבדל הזה מצטבר לסכומים גדולים לאורך שנות העבודה של כל עובד.",
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
            פתרונות <span className="text-[#5ec6c6]">פנסיוניים ארגוניים</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            פתרונות פנסיוניים מותאמים לארגונים ולמעסיקים — דמי ניהול מוזלים, ניהול מרכזי וליווי מקצועי.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#analysis-form" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              ייעוץ לקופות מרכזיות
            </a>
            <a href="#product-types" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
              יתרונות למעסיק
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
          <span className="text-[#0a3d3d] font-medium">קופות מרכזיות למעסיק</span>
        </nav>
      </div>

      <main>
        {/* Benefits */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">יתרונות הסדר ארגוני</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, doodle: "handshake", title: "ניהול קולקטיבי", desc: "ניהול מרוכז של זכויות כל העובדים", color: "#5ec6c6" },
                { icon: Coins, doodle: "savings", title: "דמי ניהול מוזלים", desc: "כוח מיקוח ארגוני לתנאים טובים", color: "#f4a261" },
                { icon: Building2, doodle: "handshake", title: "שירות ארגוני", desc: "ליווי מקצועי למשאבי אנוש", color: "#90be6d" },
                { icon: Shield, doodle: "shield", title: "ביטחון לעובדים", desc: "הבטחת זכויות פנסיוניות מיטביות", color: "#e76f51" },
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי פתרונות למעסיקים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">הכירו את האפשרויות לניהול פנסיוני ארגוני</p>
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
                  קופה מרכזית לפיצויים היא כלי חיוני לכל מעסיק בישראל. היא מאפשרת למעסיק להפריש כספי פיצויים לקופה חיצונית באופן שוטף, במקום לשלם אותם כסכום חד-פעמי בעת פיטורין. כך המעסיק מפזר את העלות לאורך זמן ומגן על עצמו מפני הוצאות גדולות ובלתי צפויות.
                </p>
                <p>
                  מעבר לחובה החוקית, ניהול נכון של הקופות המרכזיות יכול לחסוך לארגון סכומים משמעותיים בדמי ניהול ולהבטיח תשואות טובות יותר על כספי העובדים. ארגון שמנהל את הנושא בצורה מקצועית נהנה מיחסי עבודה טובים יותר ומשביעות רצון גבוהה של העובדים.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לפעול?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כל מעסיק חייב על פי חוק להפריש כספים פנסיוניים לעובדיו מהיום הראשון להעסקה. קופה מרכזית למעסיק רלוונטית במיוחד לארגונים עם מספר עובדים, שיכולים ליהנות מכוח מיקוח לדמי ניהול מוזלים.
                </p>
                <p>
                  מומלץ לבצע בדיקה תקופתית של ההסדר הפנסיוני הארגוני — לפחות אחת לשנה. שינויים בגודל הארגון, בתנאי השוק, או בביצועי הגופים המנהלים, יכולים להצדיק מעבר לקופה אחרת עם תנאים טובים יותר.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת הסדר פנסיוני ארגוני, יש לשקול מספר גורמים: דמי הניהול שנגבים (ככל שהארגון גדול יותר, כך כוח המיקוח חזק יותר), ביצועי ההשקעה של הגוף המנהל, השירות למחלקת משאבי אנוש ולעובדים, ומגוון מסלולי ההשקעה הזמינים.
                </p>
                <p>
                  ב-SEELD אנחנו מתמחים בבניית הסדרים פנסיוניים ארגוניים. ננהל עבורכם משא ומתן מול כל הגופים המנהלים, נשיג דמי ניהול מופחתים, וניתן ליווי מקצועי שוטף למחלקת משאבי האנוש ולעובדים.
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים הסדר פנסיוני ארגוני?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                מלאו פרטי הארגון ונחזור אליכם עם הצעה מותאמת
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PensionAnalysisForm
                focusArea="pension"
                title="ייעוץ לקופות מרכזיות"
                description="מלאו פרטי הארגון ונחזור אליכם עם הצעה מותאמת"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EmployerFunds;
