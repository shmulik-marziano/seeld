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
              className="text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight"
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

            {/* Mobile-only accent dots - visible below CTAs on small screens */}
            <motion.div
              className="flex sm:hidden items-center gap-3 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="w-5 h-5 rounded-full bg-[#5ec6c6]" />
              <span className="w-4 h-4 rounded-full bg-[#e76f51]" />
              <span className="w-6 h-6 rounded-full bg-[#f4a261]" />
              <span className="w-4 h-4 rounded-full bg-[#90be6d]" />
            </motion.div>
          </div>

          {/* Left side - Colored circles composition - hidden on mobile */}
          <motion.div
            className="hidden sm:flex relative items-center justify-center lg:justify-start"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px]">
              {/* Main colored circles */}
              <motion.div
                className="absolute top-[30%] right-[5%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-[#5ec6c6] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                style={isDesktop ? { y: y1 } : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10 sm:w-14 sm:h-14">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              <motion.div
                className="absolute top-[28%] right-[32%] w-[75px] h-[75px] sm:w-[95px] sm:h-[95px] rounded-full bg-[#e76f51]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
                style={isDesktop ? { y: y2 } : undefined}
              />

              <motion.div
                className="absolute top-[15%] right-[52%] w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-full bg-[#f4a261] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                style={isDesktop ? { y: y3 } : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 sm:w-11 sm:h-11">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              <motion.div
                className="absolute top-[22%] right-[75%] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full bg-[#90be6d] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.95, type: "spring", stiffness: 200 }}
                style={isDesktop ? { y: y4 } : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7 sm:w-9 sm:h-9">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              {/* Pill/capsule shape */}
              <motion.div
                className="absolute top-[55%] right-[15%] w-[200px] sm:w-[280px] h-[60px] sm:h-[75px] rounded-full border-2 border-[#0a3d3d]/15 flex items-center px-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#5ec6c6]" />
                <div className="flex-1 mx-3 h-[2px] bg-[#0a3d3d]/10 rounded-full" />
              </motion.div>

              {/* Small decorative dots */}
              <motion.div className="absolute top-[10%] right-[40%] w-4 h-4 rounded-full bg-[#ffc929]" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} />
              <motion.div className="absolute top-[75%] right-[60%] w-3 h-3 rounded-full bg-[#e76f51]/60" animate={{ y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
              <motion.div className="absolute top-[80%] right-[20%] w-3 h-3 rounded-full bg-[#5ec6c6]/50" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />

              {/* Dashed connector */}
              <svg className="absolute top-[20%] right-[70%] w-[120px] h-[100px]" viewBox="0 0 120 100" fill="none">
                <path d="M100,20 C70,10 40,50 20,80" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" opacity="0.2"/>
                <polygon points="16,76 22,84 26,74" fill="#0a3d3d" opacity="0.2"/>
              </svg>
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
