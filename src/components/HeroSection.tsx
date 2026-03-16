import { ArrowDownLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax values - subtle movement for each circle at different speeds
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 80]);   // 0.3x-ish
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 120]);  // 0.4x-ish
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);  // 0.35x
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 140]);  // 0.5x

  return (
    <section ref={sectionRef} className="relative min-h-[90vh] sm:min-h-[100vh] flex items-center overflow-hidden bg-[#f8f9fc]" dir="rtl">
      {/* Dashed curved connector line */}
      <svg className="hidden lg:block absolute top-[5%] left-[0%] w-[500px] h-[600px]" viewBox="0 0 500 600" fill="none" aria-hidden="true">
        <motion.path
          d="M450,50 C380,50 300,130 320,230 C340,330 220,380 160,450 C130,490 140,540 200,560"
          stroke="#0a3d3d"
          strokeWidth="2.5"
          strokeDasharray="10 8"
          strokeLinecap="round"
          fill="none"
          opacity="0.18"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 0.8, ease: "easeInOut" }}
        />
        <motion.polygon
          points="195,552 205,568 215,554"
          fill="#0a3d3d"
          opacity="0.18"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ delay: 3.5, duration: 0.3 }}
        />
      </svg>

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Right side - Content (RTL) */}
          <div className="space-y-8 lg:space-y-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0a3d3d]/[0.06] border border-[#0a3d3d]/10 text-sm text-[#0a3d3d] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#5ec6c6] animate-pulse" />
                SEELD — ביטוח, חיסכון ופנסיה
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1] tracking-tight"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span className="text-[#0a3d3d]">הביטחון הפיננסי</span>
              <br />
              <span className="text-[#0a3d3d]">שלך </span>
              <span className="relative inline-block">
                <span className="text-[#5ec6c6]">מתחיל כאן</span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-[5px] bg-[#f4a261] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  style={{ transformOrigin: "right" }}
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-[#0a3d3d]/45 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              ביטוח שמתאים לכם, פנסיה שעובדת בשבילכם, חיסכון שגדל לאורך זמן.
              <br />
              הכל שקוף, הכל מוסבר, הכל בגובה העיניים.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-10 py-5 text-base font-bold shadow-xl shadow-[#0a3d3d]/10 w-full sm:w-auto min-h-[56px]">
                  בדקו את הביטוח שלכם
                  <ArrowDownLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="border-[#0a3d3d]/15 text-[#0a3d3d] hover:bg-[#0a3d3d]/5 rounded-full px-10 py-5 text-base font-semibold w-full sm:w-auto min-h-[56px]">
                  <Phone className="w-5 h-5 ml-2" />
                  דברו איתנו
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Left side - Live Portfolio Scanner */}
          <motion.div
            className="relative flex items-center justify-center lg:justify-start"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-[320px] h-[420px] sm:w-[380px] sm:h-[480px] lg:w-[440px] lg:h-[520px]">
              {/* Scanner card */}
              <motion.div
                className="absolute inset-x-0 top-0 bg-white rounded-3xl shadow-2xl shadow-[#0a3d3d]/10 border border-[#0a3d3d]/[0.06] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                style={isDesktop ? { y: y1 } : undefined}
              >
                {/* Scanner header */}
                <div className="bg-[#0a3d3d] px-5 py-3.5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e76f51]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f4a261]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#90be6d]" />
                  </div>
                  <span className="text-white/60 text-xs font-medium">SEELD — סריקת תיק ביטוח</span>
                </div>

                {/* Scanner content */}
                <div className="p-5 space-y-4">
                  {/* Scanning animation */}
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-[#5ec6c6]"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-bold text-[#0a3d3d]">סורק את התיק...</span>
                  </div>

                  {/* Scan results - animated lines */}
                  {[
                    { label: "כפל ביטוחי", status: "נמצא", color: "#e76f51", delay: 0.8 },
                    { label: "דמי ניהול גבוהים", status: "2 מוצרים", color: "#f4a261", delay: 1.2 },
                    { label: "מסלול השקעה לא מתאים", status: "לבדוק", color: "#f4a261", delay: 1.6 },
                    { label: "תשואה מתחת לממוצע", status: "קרן פנסיה", color: "#e76f51", delay: 2.0 },
                    { label: "כיסוי אובדן כושר", status: "חסר", color: "#e76f51", delay: 2.4 },
                    { label: "ביטוח בריאות", status: "תקין ✓", color: "#90be6d", delay: 2.8 },
                    { label: "חיסכון לילדים", status: "תקין ✓", color: "#90be6d", delay: 3.2 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.4 }}
                    >
                      <span className="text-xs sm:text-sm text-[#0a3d3d]/70">{item.label}</span>
                      <span
                        className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {item.status}
                      </span>
                    </motion.div>
                  ))}

                  {/* Summary bar */}
                  <motion.div
                    className="mt-3 pt-3 border-t-2 border-[#0a3d3d]/[0.06]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.6, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a3d3d]">פוטנציאל חיסכון שנתי</span>
                      <motion.span
                        className="text-lg font-extrabold text-[#5ec6c6]"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 3.8, type: "spring" }}
                      >
                        ₪4,200
                      </motion.span>
                    </div>
                    <motion.div
                      className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4 }}
                    >
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-l from-[#5ec6c6] to-[#90be6d]"
                        initial={{ width: "0%" }}
                        animate={{ width: "72%" }}
                        transition={{ delay: 4.2, duration: 1, ease: "easeOut" }}
                      />
                    </motion.div>
                    <p className="text-[10px] text-[#0a3d3d]/40 mt-1.5">72% מהתיק נסרק — נמצאו 3 הזדמנויות לשיפור</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Decorative elements around scanner */}
              <motion.div
                className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#5ec6c6]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                style={isDesktop ? { y: y1 } : undefined}
              />
              <motion.div
                className="absolute top-[40%] -right-4 w-6 h-6 rounded-full bg-[#f4a261]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={isDesktop ? { y: y2 } : undefined}
              />

              {/* Bottom decorative dot */}
              <motion.div
                className="absolute bottom-4 left-[30%] w-5 h-5 rounded-full bg-[#90be6d]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              />
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 sm:mt-24 pt-8 border-t border-[#0a3d3d]/[0.06]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
            {[
              { text: "חלק מבית", highlight: "עמיתים הון", dotColor: "#5ec6c6" },
              { text: "סוכנות מורשית ומפוקחת", dotColor: "#f4a261" },
              { text: "מענה אישי — לא קולסנטר", dotColor: "#90be6d" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.dotColor }} />
                <span className="text-sm text-[#0a3d3d]/45 font-medium">
                  {item.text}{" "}
                  {item.highlight && <span className="text-[#0a3d3d] font-bold">{item.highlight}</span>}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
