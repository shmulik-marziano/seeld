import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronLeft, Eye, Award, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner - Bold design with solid circles */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        {/* Solid colored circles */}
        <div className="absolute top-[10%] left-[5%] w-[100px] h-[100px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute bottom-[15%] right-[8%] w-[70px] h-[70px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[60%] left-[20%] w-[40px] h-[40px] rounded-full bg-[#e76f51]" />
        <div className="absolute top-[20%] right-[15%] w-[30px] h-[30px] rounded-full bg-[#90be6d]" />

        {/* Dashed curved line with arrow */}
        <div className="absolute top-10 right-[10%] hidden lg:block">
          <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
            <path d="M10 100 C 50 20, 130 20, 170 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.15" />
            <polygon points="170,60 162,52 166,64" fill="#0a3d3d" opacity="0.15" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            אודות <span className="text-[#5ec6c6]">SEELD</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
            SEELD — ביטוח, חיסכון ופנסיה. הכל שקוף, הכל מוסבר, הכל בגובה העיניים.
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
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-[#5ec6c6] hidden sm:block" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0a3d3d] mb-6">
                הסיפור <span className="text-[#5ec6c6]">שלנו</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  SEELD היא סוכנות ביטוח, חיסכון ופנסיה. הקמנו אותה מתוך אמונה שייעוץ פיננסי טוב צריך להיות נגיש לכולם — לא רק למי שמבין את השפה המקצועית.
                </p>
                <p>
                  שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, עובד מול כל חברות הביטוח וקרנות הפנסיה בשוק. כל לקוח מקבל בדיקה מלאה של מה שיש לו, השוואה בין האפשרויות, והמלצה כנה — בלי לחץ.
                </p>
                <p>
                  המטרה: שתבינו בדיוק מה יש לכם, למה אתם משלמים, ומה כדאי לשנות. בלי מילים מסובכות, בלי אותיות קטנות.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-10 sm:py-16 bg-[#f8f9fc] relative overflow-hidden">
          {/* Decorative pill shape */}
          <div className="absolute bottom-8 right-8 hidden lg:block">
            <svg width="50" height="100" viewBox="0 0 50 100" fill="none">
              <rect x="5" y="5" width="40" height="90" rx="20" stroke="#f4a261" strokeWidth="2" strokeDasharray="5 4" opacity="0.2" />
            </svg>
          </div>
          <div className="absolute top-6 left-[10%] w-4 h-4 rounded-full bg-[#e76f51] hidden sm:block" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl relative">
              <div className="absolute top-1 right-[-20px] w-5 h-5 rounded-full bg-[#f4a261] hidden sm:block" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0a3d3d] mb-6">
                המשימה <span className="text-[#f4a261]">שלנו</span>
              </h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6">
                ניהול פיננסי נכון מתחיל בהבנה של מה שיש לכם. זה מה שאנחנו עושים:
              </p>
              <ul className="space-y-4">
                {[
                  { text: "בדיקת כל הפוליסות והמוצרים הפנסיוניים שלכם — מול כל החברות בשוק", color: "#5ec6c6" },
                  { text: "השוואת מחירים, כיסויים ודמי ניהול — כדי שתדעו שאתם לא משלמים מיותר", color: "#f4a261" },
                  { text: "מעקב שוטף: חידושים, שינויים במשפחה, עדכוני רגולציה — אנחנו בתמונה", color: "#90be6d" },
                  { text: "זיהוי כפל ביטוחי, כיסויים חסרים ודמי ניהול גבוהים — וטיפול מיידי", color: "#e76f51" },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600 text-base sm:text-lg">
                    <span className="w-4 h-4 rounded-full mt-1.5 flex-shrink-0 shadow-md" style={{ backgroundColor: item.color, boxShadow: `0 4px 12px ${item.color}40` }} />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-10 sm:py-16 relative">
          <div className="absolute top-10 right-[5%] w-3 h-3 rounded-full bg-[#5ec6c6] hidden sm:block" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative mb-10">
              <div className="absolute top-0 left-[5%] w-6 h-6 rounded-full bg-[#90be6d] hidden sm:block" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0a3d3d]">
                הערכים <span className="text-[#90be6d]">שלנו</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Eye, title: "שקיפות", description: "תראו את כל התנאים, העמלות ודמי הניהול — לפני שמחליטים. בלי הפתעות, בלי אותיות קטנות.", color: "#5ec6c6" },
                { icon: Award, title: "מקצועיות", description: "סוכן ביטוח פנסיוני מורשה, מעודכן ברגולציה ובשינויים בשוק. הידע הזה עובד בשבילכם.", color: "#f4a261" },
                { icon: ShieldCheck, title: "אמינות", description: "האינטרס שלכם קודם. אם משהו לא מתאים — נגיד את זה ישירות.", color: "#e76f51" },
                { icon: Users, title: "נגישות", description: "ביטוח ופנסיה לא צריכים להיות מסובכים. מסבירים בשפה ברורה, עונים על כל שאלה.", color: "#90be6d" },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden group">
                  {/* Colored accent line at top */}
                  <div className="absolute top-0 right-0 w-20 h-1 rounded-b-full" style={{ backgroundColor: item.color }} />
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 6px 18px ${item.color}30` }}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 bg-[#f8f9fc] relative overflow-hidden">
          <div className="absolute top-4 left-[8%] w-5 h-5 rounded-full bg-[#90be6d] hidden sm:block" />
          <div className="absolute bottom-8 right-[12%] w-3 h-3 rounded-full bg-[#e76f51] hidden sm:block" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              {/* Solid decorative circles */}
              <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] rounded-full bg-[#5ec6c6] opacity-20" />
              <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full bg-[#f4a261] opacity-15" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 relative">רוצים לבדוק <span className="text-[#5ec6c6]">את המצב שלכם?</span></h2>
              <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto relative">
                השאירו פרטים ונחזור אליכם לשיחה ראשונית — ללא עלות וללא התחייבות.
              </p>
              <Link
                to="/contact"
                className="relative inline-block px-10 py-4 bg-[#5ec6c6] text-[#0a3d3d] font-bold rounded-full hover:bg-[#4db5b5] transition-colors shadow-xl shadow-[#5ec6c6]/20 text-base"
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
