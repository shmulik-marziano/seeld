import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Brain,
  Globe,
  FileSearch,
  ArrowLeft,
  CheckCircle2,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: LayoutDashboard,
    title: "דשבורד חכם",
    description: "מבט-על על כל הסוכנות: לקוחות, מטלות, ביצועים ומעקב תיקים — הכול במקום אחד.",
    color: "#5ec6c6",
  },
  {
    icon: Users,
    title: "ניהול לקוחות",
    description: "כרטיס לקוח מלא עם היסטוריית פוליסות, תביעות, פולואפ ומסמכים. חיפוש וסינון מתקדם.",
    color: "#f4a261",
  },
  {
    icon: Brain,
    title: "המלצות AI",
    description: "מנוע בינה מלאכותית שמנתח את מצב הלקוח ומייצר המלצות ביטוחיות ופנסיוניות מותאמות אישית.",
    color: "#e76f51",
  },
  {
    icon: Globe,
    title: "פורטל לקוח",
    description: "פורטל דיגיטלי ללקוחות שלכם: צפייה בפוליסות, חתימה דיגיטלית, העלאת מסמכים ותקשורת ישירה.",
    color: "#90be6d",
  },
  {
    icon: FileSearch,
    title: "עיבוד מסמכים",
    description: "סריקה אוטומטית של פוליסות ומסמכים עם AI. חילוץ נתונים, זיהוי חוסרים והשוואת כיסויים.",
    color: "#6c63ff",
  },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const AgentLandingPage = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        {/* Solid colored circles — animated float */}
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-[8%] left-[3%] w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] rounded-full bg-[#5ec6c6]"
        />
        <motion.div
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[10%] right-[5%] w-[60px] h-[60px] sm:w-[90px] sm:h-[90px] rounded-full bg-[#e76f51]"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
          className="absolute top-[50%] left-[15%] sm:left-[20%] w-[35px] h-[35px] sm:w-[50px] sm:h-[50px] rounded-full bg-[#f4a261]"
        />
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-[15%] right-[8%] sm:right-[12%] w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] rounded-full bg-[#90be6d]"
        />
        <div className="absolute bottom-[35%] left-[40%] w-[18px] h-[18px] sm:w-[25px] sm:h-[25px] rounded-full bg-[#6c63ff] hidden sm:block" />

        {/* Dashed curved line with arrow */}
        <div className="absolute top-16 right-[8%] hidden lg:block">
          <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
            <path d="M10 120 C 60 20, 150 20, 190 70" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="190,70 182,62 186,76" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>

        {/* Decorative capsule */}
        <div className="absolute bottom-10 left-10 hidden lg:block">
          <svg width="50" height="110" viewBox="0 0 50 110" fill="none">
            <rect x="5" y="5" width="40" height="100" rx="20" stroke="#5ec6c6" strokeWidth="2" strokeDasharray="6 4" opacity="0.2" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-28 lg:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block px-5 py-2 bg-[#0a3d3d]/10 text-[#0a3d3d] text-sm font-bold rounded-full mb-5 sm:mb-6">
              פורטל סוכנים
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0a3d3d] mb-5 sm:mb-6 leading-tight max-w-4xl">
              הכלים שלך לניהול סוכנות ביטוח — <span className="text-[#5ec6c6]">מבית SEELD</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-500 max-w-2xl leading-relaxed mb-8 sm:mb-10">
              פלטפורמה מתקדמת לניהול סוכנות ביטוח. דשבורד, ניהול לקוחות, המלצות AI, פורטל לקוח ועיבוד מסמכים חכם.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/app/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0a3d3d] text-white font-bold rounded-full hover:bg-[#0d4a4a] transition-colors shadow-xl shadow-[#0a3d3d]/20 text-base min-h-[48px]"
              >
                התחבר
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                to="/app/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#0a3d3d] font-bold rounded-full border-2 border-[#0a3d3d] hover:bg-[#f8f9fc] transition-colors text-base min-h-[48px]"
              >
                הירשם
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-24 relative">
        <div className="absolute top-6 right-[5%] w-4 h-4 rounded-full bg-[#f4a261] hidden sm:block" />
        <div className="absolute bottom-10 left-[8%] w-3 h-3 rounded-full bg-[#90be6d] hidden sm:block" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3 sm:mb-4">
              הכול מה שצריך <span className="text-[#5ec6c6]">לסוכנות חכמה</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              חמישה כלים מרכזיים שיעזרו לכם לנהל את הסוכנות בצורה יעילה ומקצועית יותר.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden group"
              >
                {/* Colored accent line at top */}
                <div className="absolute top-0 right-0 w-20 h-1.5 rounded-b-full" style={{ backgroundColor: feature.color }} />

                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-lg"
                  style={{ backgroundColor: feature.color, boxShadow: `0 6px 18px ${feature.color}30` }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0a3d3d] mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}

            {/* CTA Card */}
            <motion.div
              variants={staggerItem}
              className="bg-[#0a3d3d] rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-[-20px] right-[-20px] w-[60px] h-[60px] rounded-full bg-[#5ec6c6] opacity-20" />
              <div className="absolute bottom-[-15px] left-[-15px] w-[50px] h-[50px] rounded-full bg-[#f4a261] opacity-15" />
              <h3 className="text-xl font-extrabold text-white mb-3 relative">רוצים לראות בפעולה?</h3>
              <p className="text-white/50 text-sm mb-6 relative">הירשמו בחינם ותתחילו לעבוד עם הכלים שלנו</p>
              <Link
                to="/app/auth"
                className="relative inline-flex items-center gap-2 px-8 py-3 bg-[#5ec6c6] text-[#0a3d3d] font-bold rounded-full hover:bg-[#4db5b5] transition-colors text-sm min-h-[44px]"
              >
                התחילו עכשיו
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-10 left-[6%] w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] rounded-full bg-[#5ec6c6] opacity-30"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute bottom-16 right-[10%] w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full bg-[#e76f51] opacity-20"
        />

        {/* Dashed line */}
        <div className="absolute bottom-20 left-[15%] hidden lg:block">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <path d="M10 70 C 30 10, 90 10, 110 40" stroke="#0a3d3d" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.1" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <motion.h2
            className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-10 sm:mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            למה <span className="text-[#f4a261]">SEELD?</span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              "ממשק בעברית מלאה, מותאם לשוק הישראלי",
              "מנוע AI שמייצר המלצות ביטוחיות מותאמות",
              "פורטל לקוח דיגיטלי עם חתימה מקוונת",
              "עיבוד מסמכים אוטומטי עם סריקת פוליסות",
              "מעקב פולואפ ותזכורות אוטומטיות",
              "אבטחת מידע מתקדמת ועמידה ברגולציה",
              "דוחות ביצועים ואנליטיקה מתקדמת",
              "תמיכה מקצועית ועדכונים שוטפים",
            ].map((benefit, idx) => (
              <motion.div key={idx} variants={staggerItem} className="flex items-start gap-3 min-h-[44px]">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: ["#5ec6c6", "#f4a261", "#e76f51", "#90be6d", "#6c63ff", "#5ec6c6", "#f4a261", "#e76f51"][idx] }} />
                <span className="text-gray-600 text-sm sm:text-base font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section className="py-14 sm:py-24 relative">
        <div className="absolute top-4 right-[5%] w-3 h-3 rounded-full bg-[#90be6d] hidden sm:block" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3 sm:mb-4">
              תוכניות <span className="text-[#5ec6c6]">ומחירים</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
              בקרוב נפרסם את תוכניות המחירים שלנו. בינתיים, הירשמו ותתחילו בחינם.
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { name: "בסיסי", price: "בקרוב", color: "#5ec6c6" },
              { name: "מקצועי", price: "בקרוב", color: "#f4a261" },
              { name: "ארגוני", price: "בקרוב", color: "#e76f51" },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.03 }}
                className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-full h-1.5 rounded-b-full" style={{ backgroundColor: plan.color }} />
                <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-2">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-[#0a3d3d] mb-4">{plan.price}</p>
                <div className="px-5 py-2.5 bg-[#f0f0f8] text-[#0a3d3d]/50 text-sm font-semibold rounded-full inline-block">
                  בקרוב
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-8 left-[5%] w-[40px] h-[40px] sm:w-[55px] sm:h-[55px] rounded-full bg-[#f4a261] opacity-25" />
        <div className="absolute bottom-12 right-[8%] w-4 h-4 rounded-full bg-[#5ec6c6]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3 sm:mb-4">
              מה אומרים <span className="text-[#90be6d]">הסוכנים?</span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-10 sm:mb-12 max-w-xl mx-auto">
              סוכנים שכבר משתמשים בפלטפורמה שלנו
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { name: "סוכן 1", text: "הפלטפורמה חסכה לי שעות עבודה ביום. הכול נגיש ומסודר." },
              { name: "סוכן 2", text: "מנוע ה-AI מייצר המלצות מדויקות שמרשימות את הלקוחות שלי." },
              { name: "סוכן 3", text: "הפורטל ללקוחות שינה את רמת השירות שלי. מקצועי ומרשים." },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-6 text-right"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f4a261] text-[#f4a261]" />
                  ))}
                </div>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <p className="text-[#0a3d3d] font-bold text-sm">{testimonial.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            className="bg-[#0a3d3d] rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-[-40px] right-[-40px] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-[#5ec6c6] opacity-15"
            />
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-[-30px] left-[-30px] w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#f4a261] opacity-10"
            />
            <div className="absolute top-[50%] left-[10%] w-[20px] h-[20px] sm:w-[30px] sm:h-[30px] rounded-full bg-[#e76f51] opacity-20" />

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 relative">
              מוכנים <span className="text-[#5ec6c6]">להתחיל?</span>
            </h2>
            <p className="text-white/50 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto relative">
              הצטרפו לסוכנים שכבר מנהלים את הסוכנות שלהם בצורה חכמה יותר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center relative">
              <Link
                to="/app/auth"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#5ec6c6] text-[#0a3d3d] font-bold rounded-full hover:bg-[#4db5b5] transition-colors shadow-xl shadow-[#5ec6c6]/20 text-base min-h-[48px]"
              >
                התחבר
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                to="/app/auth"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-colors text-base min-h-[48px]"
              >
                הירשם בחינם
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgentLandingPage;
