import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Shield, Heart, Users, Baby, FileCheck, AlertTriangle, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const LifeInsurance = () => {
  const coverageTypes = [
    {
      category: "בסיס",
      color: "#e76f51",
      items: [
        { title: "ביטוח חיים", description: "הגנה כלכלית ליקיריכם במקרה של פטירה", icon: Heart },
        { title: "ביטוח חיים זוגי", description: "כיסוי משותף לזוגות עם תנאים משופרים", icon: Users },
        { title: "ביטוח חיים חודשי", description: "גמישות בתשלומים עם אפשרות לשינויים", icon: FileCheck },
      ],
    },
    {
      category: "מגן משלים לילד",
      color: "#90be6d",
      items: [
        { title: "מגן משלים לילד", description: "השלמת כיסוי לשאירים בפנסיה עבור ילדים", icon: Baby },
      ],
    },
    {
      category: "נספחים",
      color: "#f4a261",
      items: [
        { title: "שחרור בריסק", description: "שחרור מתשלום פרמיות במקרה של נכות", icon: Shield },
        { title: "נכות תמידית", description: "פיצוי במקרה של נכות תמידית מכל סיבה", icon: AlertTriangle },
        { title: "נכות מתאונה", description: "כיסוי לנכות שנגרמה כתוצאה מתאונה", icon: AlertTriangle },
        { title: "מוות מתאונה", description: "פיצוי נוסף במקרה של מוות כתוצאה מתאונה", icon: Heart },
      ],
    },
  ];

  const faqItems = [
    {
      q: "מה ההבדל בין ביטוח חיים ריסק לביטוח חיים עם חיסכון?",
      a: "ביטוח ריסק מכסה מקרה פטירה בלבד ועלותו נמוכה. ביטוח חיים עם חיסכון משלב גם מרכיב חיסכון, אך הפרמיה גבוהה יותר. ברוב המקרים מומלץ ביטוח ריסק בשילוב חיסכון נפרד.",
    },
    {
      q: "כמה סכום ביטוח אני צריך?",
      a: "כלל אצבע: סכום הביטוח צריך לכסות 5-10 שנות הכנסה, בתוספת יתרת המשכנתא והוצאות עתידיות צפויות כמו לימודי הילדים. יועץ מקצועי יעזור לכם לחשב את הסכום המדויק.",
    },
    {
      q: "האם ביטוח חיים שמשולם דרך הפנסיה מספיק?",
      a: "הכיסוי בקרן הפנסיה (ביטוח שאירים) הוא חלקי ומבוסס על גובה ההפקדות. במקרים רבים הוא אינו מספיק, ומומלץ להשלים עם ביטוח חיים פרטי.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-10 left-6 w-20 h-20 rounded-full bg-[#e76f51] opacity-12" />
        <div className="absolute bottom-6 right-10 w-14 h-14 rounded-full bg-[#90be6d] opacity-15" />
        <div className="absolute top-20 right-1/3 w-10 h-10 rounded-full bg-[#5ec6c6] opacity-18" />
        <div className="absolute bottom-14 left-1/4 w-6 h-6 rounded-full bg-[#f4a261] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#e76f51] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוחי חיים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            להגן על <span className="text-[#e76f51]">מי שחשוב לכם</span>
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            ביטוח חיים מבטיח שהמשפחה שלכם תהיה מוגנת כלכלית גם כשאתם לא שם. זו ההשקעה הכי חשובה בשקט הנפשי של כולם.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href="#contact-form" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              להצטרפות ל-SEELD
            </a>
            <a href="#coverage" className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#0a3d3d]/15 text-[#0a3d3d] font-semibold text-base hover:bg-[#0a3d3d]/5 transition-all min-h-[48px]">
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
          <Link to="/insurance" className="hover:text-[#0a3d3d] transition-colors">ביטוח</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">ביטוח חיים</span>
        </nav>
      </div>

      <main>
        {/* Key Points */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-[#5ec6c6] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">הגנה על המשפחה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הבטיחו שהמשפחה שלכם תוכל להמשיך את אורח החיים שלה גם בלעדיכם
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-[#f4a261] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי משכנתא</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הבטיחו שהבית ישאר בבעלות המשפחה גם אם קורה משהו
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-full bg-[#90be6d] flex items-center justify-center mb-4">
                  <Baby className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">עתיד הילדים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הבטיחו את המימון ללימודים ולעתיד של הילדים שלכם
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Types */}
        <section id="coverage" className="py-10 sm:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">סוגי הכיסויים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">מגוון פתרונות להגנה מקסימלית</p>
            <div className="space-y-10">
              {coverageTypes.map((category, catIdx) => (
                <div key={catIdx}>
                  <h3 className="text-xl font-bold mb-4 text-[#0a3d3d]">{category.category}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color }}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-base font-bold text-[#0a3d3d]">{item.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה ביטוח חיים חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח חיים הוא אחד הכלים הפיננסיים החשובים ביותר להגנה על המשפחה שלכם. במקרה של אירוע טרגי, ביטוח חיים מבטיח שבני המשפחה יוכלו להמשיך לחיות ברמת החיים שהם רגילים אליה, לשלם את המשכנתא, לממן את לימודי הילדים ולכסות את ההוצאות השוטפות.
                </p>
                <p>
                  רבים חושבים שביטוח חיים נחוץ רק לאנשים מבוגרים, אך למעשה, הצורך בו גדול במיוחד דווקא אצל משפחות צעירות עם ילדים קטנים ומשכנתא. ביטוח חיים מעניק שקט נפשי ומאפשר לכם לדעת שהמשפחה מוגנת בכל תרחיש.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש ביטוח חיים?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  הזמן האידיאלי לרכוש ביטוח חיים הוא כאשר יש לכם אנשים התלויים בכם כלכלית. נקודות ציון מרכזיות כוללות: נישואים, לידת ילד, רכישת דירה או לקיחת משכנתא. ככל שמצטרפים מוקדם יותר, הפרמיה נמוכה יותר והתנאים טובים יותר.
                </p>
                <p>
                  כמו כן, ביטוח חיים נדרש לעיתים כתנאי לקבלת משכנתא מהבנק. במקרה כזה, חשוב לדעת שאינכם חייבים לרכוש את הביטוח דרך הבנק - השוואה בין חברות יכולה לחסוך אלפי שקלים.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח חיים יש לשים לב לסכום הביטוח (שצריך לכסות את ההתחייבויות הפיננסיות של המשפחה), תקופת הביטוח, חריגים בפוליסה, ונספחים כמו כיסוי אובדן כושר עבודה ונכות. חשוב גם לעדכן את הפוליסה בכל שינוי משמעותי בחיים.
                </p>
                <p>
                  ב-SEELD אנחנו מבצעים עבורכם השוואה מקיפה בין כל חברות הביטוח, מוודאים שסכום הביטוח מתאים לצרכים שלכם, ומלווים אתכם לאורך כל הדרך.
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
              אנחנו עובדים עם חברות הביטוח המובילות בישראל כדי להביא לכם את ההצעה הטובה ביותר
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

        {/* Lead Form CTA */}
        <section id="contact-form" className="py-10 sm:py-16 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-12 text-center mb-10 relative overflow-hidden">
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#e76f51] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#90be6d] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="life"
                title="הצטרפות לביטוח חיים"
                description="מלאו את הפרטים לקבלת הצעה מותאמת אישית"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LifeInsurance;
