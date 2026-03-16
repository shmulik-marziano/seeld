import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, CheckCircle, FileText, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const RightsExtraction = () => {
  const rights = [
    {
      title: "החזרי מס הכנסה",
      description: "בדקו האם מגיעים לכם החזרי מס עבור 6 שנים אחורה",
      icon: FileText,
      color: "#5ec6c6",
    },
    {
      title: "קצבאות ביטוח לאומי",
      description: "מיצוי זכויות לקצבת נכות, זקנה, ילדים ועוד",
      icon: Users,
      color: "#6c63ff",
    },
    {
      title: "הטבות מס לעצמאים",
      description: "ניכויים והקלות מס לבעלי עסקים",
      icon: CheckCircle,
      color: "#90be6d",
    },
    {
      title: "זכויות פנסיוניות",
      description: "איתור קופות אבודות וכספים שלא ידעתם עליהם",
      icon: Search,
      color: "#f4a261",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-10 left-8 w-24 h-24 rounded-full bg-[#6c63ff] opacity-10" />
        <div className="absolute bottom-4 right-16 w-14 h-14 rounded-full bg-[#f4a261] opacity-15" />
        <svg className="absolute bottom-0 left-0 w-full h-20 opacity-10 pointer-events-none" viewBox="0 0 800 80" fill="none">
          <path d="M0 60 Q250 10 500 50 T800 20" stroke="#6c63ff" strokeWidth="2" strokeDasharray="8 6" />
          <polygon points="795,18 800,20 795,22" fill="#6c63ff" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            מיצוי זכויות
          </h1>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
            גלו את כל הזכויות וההטבות שמגיעות לכם מהמדינה, מביטוח לאומי ומרשויות המס.
            אנחנו נעזור לכם למצות את מלוא הזכויות שלכם.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Rights Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rights.map((right) => (
              <div key={right.title} className="rounded-2xl bg-white border border-gray-100 p-8 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: right.color }}>
                  <right.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a3d3d] mb-3">{right.title}</h3>
                <p className="text-gray-500 mb-6">{right.description}</p>
                <Link to="/contact">
                  <button className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#0a3d3d] text-[#0a3d3d] rounded-full text-sm font-semibold hover:bg-[#0a3d3d] hover:text-white transition-colors group">
                    בדוק זכאות
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="rounded-2xl bg-[#f8f9fc] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-[#5ec6c6] opacity-10" />
          <div className="absolute bottom-4 right-12 w-12 h-12 rounded-full bg-[#e76f51] opacity-10" />
          <h2 className="text-3xl font-extrabold text-[#0a3d3d] mb-8 relative z-10">איך זה עובד?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative z-10">
            <div>
              <div className="w-16 h-16 rounded-full bg-[#5ec6c6] text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">1</div>
              <h3 className="font-bold text-[#0a3d3d] mb-2">מלאו פרטים</h3>
              <p className="text-gray-500 text-sm">ענו על מספר שאלות קצרות</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-[#6c63ff] text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">2</div>
              <h3 className="font-bold text-[#0a3d3d] mb-2">נבדוק עבורכם</h3>
              <p className="text-gray-500 text-sm">המערכת תסרוק את הזכויות המגיעות לכם</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-[#e76f51] text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">3</div>
              <h3 className="font-bold text-[#0a3d3d] mb-2">קבלו דוח</h3>
              <p className="text-gray-500 text-sm">תקבלו רשימת זכויות והמלצות לפעולה</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
