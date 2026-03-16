import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronLeft, Eye, Award, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#0a3d3d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            אודות SeelD
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            הבית שלכם לפתרונות פיננסיים וביטוחיים מותאמים אישית.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">אודות</span>
        </nav>
      </div>

      <main>
        {/* Story Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">הסיפור שלנו</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  SEELD היא סוכנות לפיננסים וביטוח שמאמינה שכל אדם ומשפחה ראויים לקבל ייעוץ פיננסי וביטוחי מקצועי, נגיש ואמין — בגובה העיניים.
                </p>
                <p>
                  שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, מלווה את הלקוחות שלנו בצורה אישית ומקצועית. אנחנו מאמינים בשקיפות מלאה, בשירות אישי ובהתאמה מדויקת לצרכים הייחודיים של כל לקוח.
                </p>
                <p>
                  אנחנו כאן כדי לעזור לכם להבין את עולם הביטוח והפנסיה בצורה פשוטה וברורה, ולבחור את הפתרונות שמתאימים בדיוק לכם.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">המשימה שלנו</h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6">
                אנחנו מאמינים שניהול פיננסי נכון מתחיל בידע ובהבנה. SeelD מוקדשת לספק ללקוחותינו:
              </p>
              <ul className="space-y-4">
                {[
                  "ייעוץ מקצועי ואובייקטיבי בתחומי חיסכון, פנסיה וביטוח",
                  "השוואה מקיפה בין כל חברות הביטוח וקרנות הפנסיה בשוק",
                  "ליווי אישי לאורך כל שלבי החיים הפיננסיים",
                  "חיסכון משמעותי בעלויות הביטוח והחיסכון שלכם",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600 text-base sm:text-lg">
                    <span className="w-2 h-2 rounded-full bg-[#5ec6c6] mt-2.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-10">הערכים שלנו</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">שקיפות</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  אנחנו מאמינים בחשיפה מלאה של כל המידע, העמלות והתנאים — ללא הפתעות ואותיות קטנות.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">מקצועיות</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  הצוות שלנו מורכב ממומחים מוסמכים עם ניסיון רב בתחום הפיננסי והביטוחי.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">אמינות</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  אנחנו תמיד שמים את האינטרס של הלקוח במקום הראשון ופועלים בהתאם.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#0a3d3d]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">נגישות</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  פיננסים וביטוח צריכים להיות מובנים לכולם. אנחנו מסבירים בשפה ברורה ופשוטה.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">בואו נתחיל לתכנן יחד</h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                השאירו פרטים ונחזור אליכם לשיחת ייעוץ ראשונית ללא עלות וללא התחייבות.
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#5ec6c6] text-[#0a3d3d] font-semibold rounded-full hover:bg-[#4db5b5] transition-colors"
              >
                צרו קשר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
