import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";
import { Car, Home, Zap, ClipboardCheck, ChevronLeft } from "lucide-react";

const Travel = () => {
  const carHomeInsuranceArticles = articles.filter(article =>
    article.category.includes("ביטוח רכב") ||
    article.category.includes("ביטוח דירה")
  );

  const features = [
    {
      icon: Car,
      title: "ביטוח רכב",
      description: "כיסוי מקיף לרכב שלכם במחירים תחרותיים",
      color: "#5ec6c6",
    },
    {
      icon: Home,
      title: "ביטוח דירה",
      description: "הגנה מלאה על הנכס והתכולה שלכם",
      color: "#f4a261",
    },
    {
      icon: Zap,
      title: "תהליך מהיר",
      description: "הצעות מחיר תוך דקות בלבד",
      color: "#e76f51",
    },
    {
      icon: ClipboardCheck,
      title: "השוואת מחירים",
      description: "השוואה בין כל חברות הביטוח בשוק",
      color: "#90be6d",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-6 left-8 w-24 h-24 rounded-full bg-[#5ec6c6] opacity-12" />
        <div className="absolute bottom-8 right-14 w-16 h-16 rounded-full bg-[#e76f51] opacity-15" />
        <div className="absolute top-20 right-1/3 w-10 h-10 rounded-full bg-[#f4a261] opacity-18" />
        <div className="absolute bottom-14 left-1/4 w-6 h-6 rounded-full bg-[#90be6d] opacity-20" />
        <svg className="absolute top-16 left-1/3 w-56 h-28 opacity-10" viewBox="0 0 200 80" fill="none">
          <path d="M10 60 Q50 5 110 45 T190 15" stroke="#f4a261" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-[#0a3d3d]">
            ביטוח <span className="text-[#5ec6c6]">בקליק</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            הביטוח שלכם — מהיר, פשוט ונוח.
            ביטוח רכב וביטוח דירה במחירים משתלמים, עם הצעות מחיר תוך דקות בלבד.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">ביטוח בקליק</span>
        </nav>
      </div>

      <main>
        {/* Features Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-8">למה לבחור ב-SEELD?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-6 hover:shadow-lg transition-all text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow"
                    style={{ backgroundColor: feature.color }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-[#5ec6c6]" />
          <span className="w-2 h-2 rounded-full bg-[#f4a261]" />
          <span className="w-2 h-2 rounded-full bg-[#e76f51]" />
        </div>

        {/* Articles Grid */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-2">מאמרים ומדריכים</h2>
            <p className="text-gray-500 mb-10 text-base sm:text-lg">כל מה שצריך לדעת על ביטוח רכב וביטוח דירה</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carHomeInsuranceArticles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          </div>
        </section>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-[#90be6d]" />
          <span className="w-2 h-2 rounded-full bg-[#5ec6c6]" />
          <span className="w-2 h-2 rounded-full bg-[#f4a261]" />
        </div>

        {/* Content Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-6">הצטרפו ל-SEELD תוך דקות</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  ב-SEELD אנחנו מאמינים שביטוח צריך להיות פשוט ונגיש. לכן פיתחנו תהליך
                  מהיר וקל לקבלת הצעות מחיר לביטוח רכב ודירה.
                </p>
                <p>
                  השאירו פרטים ותקבלו השוואה בין כל חברות הביטוח בשוק — ללא עלות וללא התחייבות.
                  אנחנו נמצא עבורכם את הפוליסה המתאימה ביותר במחיר הטוב ביותר.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-4 left-6 w-16 h-16 rounded-full bg-[#5ec6c6] opacity-15" />
              <div className="absolute bottom-4 right-8 w-12 h-12 rounded-full bg-[#f4a261] opacity-15" />
              <div className="absolute top-10 right-1/4 w-8 h-8 rounded-full bg-[#e76f51] opacity-10" />
              <div className="absolute bottom-8 left-1/4 w-6 h-6 rounded-full bg-[#90be6d] opacity-15" />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white relative">מוכנים להתחיל?</h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-6 relative">
                קבלו הצעת מחיר משתלמת תוך דקות — ללא עלות וללא התחייבות
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#5ec6c6] text-white font-bold text-base hover:bg-[#4db5b5] transition-all min-h-[48px] relative"
              >
                לקבלת הצעת מחיר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Travel;
