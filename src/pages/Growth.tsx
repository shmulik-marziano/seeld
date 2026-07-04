import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";
import { TrendingUp, PiggyBank, Calculator, Target, ChevronLeft } from "lucide-react";

const Growth = () => {
  const savingsArticles = articles.filter(article =>
    article.category.includes("חיסכון") ||
    article.category.includes("השקעות") ||
    article.category.includes("תקציב")
  );

  const pillars = [
    {
      icon: PiggyBank,
      title: "חיסכון חכם",
      description: "אסטרטגיות חיסכון מותאמות אישית לכל שלב בחיים",
      color: "#262626",
    },
    {
      icon: TrendingUp,
      title: "השקעות",
      description: "מסלולי השקעה מגוונים להגדלת ההון שלכם",
      color: "#171717",
    },
    {
      icon: Calculator,
      title: "תכנון מס",
      description: "ניצול מרבי של הטבות מס וחיסכון בתשלומים",
      color: "#4d4d4d",
    },
    {
      icon: Target,
      title: "יעדים פיננסיים",
      description: "הגדרת יעדים וליווי מקצועי לאורך כל הדרך",
      color: "#6e6e6e",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#fafafa] relative overflow-hidden">
        <div className="absolute top-6 left-8 w-24 h-24 rounded-full bg-[#171717] opacity-[0.05]" />
        <div className="absolute bottom-8 right-14 w-16 h-16 rounded-full bg-[#171717] opacity-[0.05]" />
        <div className="absolute top-20 right-1/3 w-10 h-10 rounded-full bg-[#171717] opacity-[0.05]" />
        <div className="absolute bottom-14 left-1/4 w-6 h-6 rounded-full bg-[#171717] opacity-[0.05]" />
        <svg className="absolute top-10 left-1/5 w-60 h-32 opacity-10" viewBox="0 0 200 80" fill="none">
          <path d="M10 65 Q70 10 120 50 T190 10" stroke="#171717" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-[#171717]">
            חיסכון <span className="text-[#15803d]">ופיננסים</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            בנו את העתיד הפיננסי שלכם.
            מדריכים מקצועיים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות — הכל במקום אחד.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#171717] font-medium">חיסכון ופיננסים</span>
        </nav>
      </div>

      <main>
        {/* Pillars Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mb-8">תחומי ההתמחות שלנו</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="bg-white border border-[#171717]/[0.06] rounded-2xl p-6 hover:shadow-lg transition-all text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow"
                    style={{ backgroundColor: pillar.color }}
                  >
                    <pillar.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#171717] mb-2">{pillar.title}</h3>
                  <p className="text-gray-600 text-sm">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-[#171717]" />
          <span className="w-2 h-2 rounded-full bg-[#6e6e6e]" />
          <span className="w-2 h-2 rounded-full bg-[#d4d4d4]" />
        </div>

        {/* Articles Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mb-2">מאמרים ומדריכים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">כל מה שצריך לדעת על חיסכון, השקעות ותכנון פיננסי</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsArticles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          </div>
        </section>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
          <span className="w-2 h-2 rounded-full bg-[#171717]" />
          <span className="w-2 h-2 rounded-full bg-[#6e6e6e]" />
        </div>

        {/* Content Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mb-6">תכנון פיננסי נכון</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  תכנון פיננסי נכון הוא הבסיס לביטחון כלכלי. בין אם אתם רק מתחילים את הקריירה,
                  מתכננים רכישת דירה או מתקרבים לגיל הפרישה — ייעוץ מקצועי יכול לעשות את ההבדל.
                </p>
                <p>
                  צוות המומחים של SEELD כאן כדי לעזור לכם לבנות תוכנית פיננסית מותאמת אישית,
                  לנצל את כל הטבות המס הזמינות ולבחור את אפיקי החיסכון וההשקעה המתאימים לכם.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#171717] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-4 left-6 w-16 h-16 rounded-full bg-[#171717] opacity-[0.05]" />
              <div className="absolute bottom-4 right-8 w-12 h-12 rounded-full bg-[#171717] opacity-[0.05]" />
              <div className="absolute top-10 right-1/4 w-8 h-8 rounded-full bg-[#171717] opacity-[0.05]" />
              <div className="absolute bottom-8 left-1/4 w-6 h-6 rounded-full bg-[#171717] opacity-[0.05]" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white relative">מוכנים לתכנן את העתיד?</h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-6 relative">
                קבלו ייעוץ פיננסי מקצועי ומותאם אישית — ללא עלות
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#171717] text-white font-bold text-base hover:bg-[#262626] transition-all min-h-[48px] relative"
              >
                לייעוץ פיננסי
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Growth;
