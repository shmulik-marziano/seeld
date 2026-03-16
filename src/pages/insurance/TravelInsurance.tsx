import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Plane, Heart, Briefcase, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import travelLogos from "@/assets/travel-insurance-logos.jpeg";

const TravelInsurance = () => {
  const faqItems = [
    {
      q: "האם ביטוח נסיעות מכסה גם קורונה?",
      a: "רוב הפוליסות העדכניות כוללות כיסוי לקורונה ומחלות מדבקות אחרות, כולל אשפוז, בידוד וביטול נסיעה. חשוב לוודא שהכיסוי מפורט בתנאי הפוליסה.",
    },
    {
      q: "מה קורה אם אני צריך פינוי רפואי?",
      a: "ביטוח נסיעות מקיף כולל כיסוי לפינוי רפואי לישראל או למדינה קרובה עם בית חולים מתאים. זהו אחד הרכיבים היקרים ביותר שהביטוח מכסה ויכול להגיע למאות אלפי דולרים.",
    },
    {
      q: "האם כרטיס אשראי מספק ביטוח נסיעות?",
      a: "חלק מכרטיסי האשראי מציעים ביטוח נסיעות בסיסי, אך הכיסוי בדרך כלל מוגבל מאוד — סכומים נמוכים, חריגים רבים, ותהליך תביעות מסובך. מומלץ תמיד לרכוש ביטוח ייעודי.",
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
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a3d3d]/50">ביטוח נסיעות</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח נסיעות לחו״ל
          </h1>
          <p className="text-base sm:text-lg text-[#0a3d3d]/50 max-w-2xl leading-relaxed">
            טסים בראש שקט לכל מקום בעולם — כיסוי רפואי, אובדן מזוודות, ביטול טיסה ועוד.
          </p>
          <div className="mt-6">
            <a href="#contact-form" className="inline-flex items-center px-8 py-3 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-all min-h-[48px]">
              רכשו ביטוח עכשיו
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
          <span className="text-[#0a3d3d] font-medium">ביטוח נסיעות</span>
        </nav>
      </div>

      <main>
        {/* Key Points Cards */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">כיסוי רפואי</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  טיפול רפואי ואשפוז בכל מקום בעולם, פינוי רפואי וטיפולי שיניים חירום.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">מזוודות וכבודה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  פיצוי במקרה של אובדן מזוודות, עיכוב כבודה או נזק לציוד אישי.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Plane className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">ביטול נסיעה</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  החזר הוצאות במקרה של ביטול טיסה, קיצור נסיעה או איחור בטיסה.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Purchase Banner */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-[#0a3d3d] p-8 sm:p-12 text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">רכשו ביטוח נסיעות לחו״ל עכשיו</h2>
              <p className="text-white/70 text-base sm:text-lg">רכישה מהירה ומאובטחת דרך הראל ביטוח — הסוכן שלכם ב-SeelD</p>
              <div className="relative inline-block">
                <img
                  src={travelLogos}
                  alt="הראל ביטוח נסיעות לחו״ל - PassportCard"
                  className="max-w-xs md:max-w-sm mx-auto rounded-xl shadow-lg border border-white/10"
                />
                <div className="absolute inset-0 flex">
                  <a
                    href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-1/2 h-full cursor-pointer rounded-l-xl hover:bg-white/5 transition-colors"
                    title="רכישת ביטוח הראל"
                  />
                  <a
                    href="https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-1/2 h-full cursor-pointer rounded-r-xl hover:bg-white/5 transition-colors"
                    title="רכישת ביטוח PassportCard"
                  />
                </div>
              </div>
              <p className="text-white/50 text-sm">לחצו על הלוגו לרכישה מיידית</p>
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
                  נסיעה לחו״ל ללא ביטוח היא הימור מסוכן. טיפול רפואי בחו״ל עולה עשרות ואף מאות אלפי שקלים — אשפוז של כמה ימים בארה״ב יכול להגיע לסכומים אסטרונומיים. גם אירועים כמו ביטול טיסה, אובדן מזוודות או גניבת דרכון יכולים להפוך חופשה לסיוט כלכלי.
                </p>
                <p>
                  ביטוח נסיעות מעניק לכם שקט נפשי מוחלט: כיסוי רפואי מלא, פינוי רפואי, סיוע בשפה שלכם, החזר הוצאות בגין ביטולים, ופיצוי על אובדן כבודה. בעלות של כמה עשרות שקלים ליום, אתם קונים ביטחון שלא יסולא בפז.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מתי כדאי לרכוש?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  כדאי לרכוש ביטוח נסיעות מיד עם הזמנת הטיסה או חבילת הנופש. כך תהנו גם מכיסוי לביטול הנסיעה מסיבות רפואיות או אחרות. ככל שתרכשו מוקדם יותר, כך הכיסוי שלכם רחב יותר ואתם מוגנים מרגע הרכישה.
                </p>
                <p>
                  חשוב במיוחד לדאוג לביטוח כשנוסעים ליעדים עם עלויות רפואיות גבוהות כמו ארה״ב או אירופה, כשנוסעים עם ילדים, כשמתכננים פעילויות ספורט אתגרי, או כשיש מצב רפואי קיים שדורש הצהרת בריאות מוקדמת.
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mt-14 mb-6">מה חשוב לדעת?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  בבחירת ביטוח נסיעות, שימו לב לסכום הכיסוי הרפואי (מומלץ לפחות מיליון דולר ליעדים יקרים), חריגי הפוליסה, כיסוי ספורט אתגרי, כיסוי מצבים רפואיים קודמים, ומוקד חירום 24/7 בעברית. יש הבדלים גדולים בין פוליסות שנראות דומות.
                </p>
                <p>
                  ב-SeelD אנחנו משווים עבורכם בין כל חברות הביטוח המובילות ומוצאים את הפוליסה המתאימה ביותר ליעד, למשך הנסיעה ולצרכים הספציפיים שלכם.
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
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <InsuranceEnrollmentForm
                insuranceType="travel"
                title="רכישת ביטוח נסיעות"
                description="מלאו את פרטי הנסיעה ונחזור אליכם עם הצעה"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TravelInsurance;
