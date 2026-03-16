import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Users, Shield, Building, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const PartnersRisk = () => {
  const faqItems = [
    {
      q: "איך קובעים את סכום הביטוח?",
      a: "סכום הביטוח נקבע לפי שווי חלקו של כל שותף בעסק. ניתן לקבוע את השווי באמצעות הערכת שמאי, מאזן העסק, או הסכמה בין השותפים. מומלץ לעדכן את הסכום כל שנה-שנתיים.",
    },
    {
      q: "מי משלם את הפרמיה?",
      a: "בדרך כלל, כל שותף משלם את הפרמיה על חיי השותף האחר. לחילופין, העסק עצמו יכול לשאת בעלות. חשוב להתייעץ עם רואה חשבון לגבי ההשלכות המיסוייות של כל אפשרות.",
    },
    {
      q: "האם ביטוח ריסק שותפים מתאים גם לשותפות של יותר מ-2?",
      a: "בהחלט. ניתן לבנות מנגנון ביטוחי לכל מספר שותפים — כל אחד מבוטח לטובת האחרים. במקרה של שותפות מורכבת, חשוב במיוחד להגדיר מנגנון ברור בהסכם.",
    },
  ];

  const companies = ["הראל", "מנורה מבטחים", "מגדל", "כלל", "איילון", "הפניקס", "מיטב", "מור", "ילין לפידות", "אנליסט", "איפיניטי", "אלטשולר שחם", "פאספורטקארד", "הכשרה"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-[#5ec6c6] opacity-15" />
        <div className="absolute bottom-6 right-12 w-14 h-14 rounded-full bg-[#e76f51] opacity-12" />
        <div className="absolute top-16 right-1/3 w-8 h-8 rounded-full bg-[#f4a261] opacity-20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#e76f51] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ריסק שותפים</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח ריסק שותפים
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            הגנה על העסק שלכם — ביטוח חיים לשותפים מבטיח את המשכיות העסק במקרה של פטירת אחד השותפים.
          </p>
          <div className="mt-6">
            <a href="#contact-form" className="inline-flex items-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              קבעו פגישת ייעוץ
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
          <span className="text-[#0a3d3d] font-medium">ביטוח ריסק שותפים</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">רכישת חלק השותף</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  מימון לרכישת חלקו של השותף שנפטר מהיורשים, ושמירה על שליטה בעסק.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">המשכיות עסקית</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  הבטחת המשך פעילות העסק ללא תלות בשותף ספציפי.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">הגנה על היורשים</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  היורשים מקבלים תמורה הוגנת עבור חלקם בעסק במקום להיכנס לשותפות לא רצויה.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Article Content */}
        <section className="pb-10 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">למה זה חשוב?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  שותפות עסקית בנויה על אמון ושיתוף פעולה. אבל מה קורה כשאחד השותפים נפטר באופן פתאומי? ללא הגנה מתאימה, יורשי השותף הנפטר הופכים לשותפים שלכם — אנשים שאולי אין להם ניסיון, עניין או יכולת לנהל את העסק. זה מתכון לקונפליקטים ואף לקריסת העסק.
                </p>
                <p>
                  ביטוח ריסק שותפים פותר את הבעיה באלגנטיות: כל שותף מבוטח לטובת השותף האחר. במקרה פטירה, השותף הנותר מקבל את כספי הביטוח ורוכש את חלקו של הנפטר מהיורשים. כך העסק ממשיך לפעול, היורשים מקבלים תמורה הוגנת, ואיש לא נפגע.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח ריסק שותפים צריך להיות חלק מהסכם השותפות מהיום הראשון. ברגע שנוצרת שותפות עסקית — בין אם חדשה או ותיקה — חיוני להגדיר מנגנון הגנה שמבטיח את המשכיות העסק. עורכי דין רבים ממליצים על כך כחלק בלתי נפרד מהסכם השותפות.
                </p>
                <p>
                  חשוב לעדכן את סכום הביטוח בהתאם לשווי העסק. ככל שהעסק צומח, כך גם סכום הביטוח צריך לעלות בהתאם. בדיקה תקופתית מוודאת שהכיסוי תמיד מתאים למצב העדכני של העסק.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ביטוח ריסק שותפים חייב להיות מגובה בהסכם משפטי (הסכם רכישה הדדי) שמגדיר את המנגנון המדויק. סכום הביטוח צריך לשקף את שווי חלקו של כל שותף בעסק, ולהתעדכן בהתאם לשינויים בשווי. ללא ההסכם, כספי הביטוח עלולים לא להגיע ליעדם.
                </p>
                <p>
                  ב-SeelD אנחנו מלווים שותפויות עסקיות בבניית מנגנון ביטוחי מושלם. נעזור לכם לקבוע את סכום הביטוח הנכון, נשווה בין חברות הביטוח, ונוודא שהפוליסה מותאמת להסכם השותפות שלכם.
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
              <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-[#5ec6c6] opacity-15" />
              <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#f4a261] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#0a3d3d]">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-[#0a3d3d]/50 text-base sm:text-lg max-w-xl mx-auto">
                צרו קשר לייעוץ מקצועי בהתאמת ביטוח לעסק שלכם
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="partners-risk"
                title="הצטרפות לביטוח ריסק שותפים"
                description="מלאו את הפרטים וקבלו ייעוץ מקצועי"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PartnersRisk;
