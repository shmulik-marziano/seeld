import { ArrowDownLeft, Sparkles } from "lucide-react";
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

  // Parallax values
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] sm:min-h-[100vh] flex items-center overflow-hidden"
      dir="rtl"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(168 38% 96%) 0%, #ffffff 60%)",
      }}
    >
      {/* Subtle noise texture layer */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Ambient glow */}
      <motion.div
        className="hidden lg:block absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.25] blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(168 42% 62%) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Right side — Content (RTL) */}
          <div className="space-y-8 lg:space-y-10">
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#1a1a4b]/10 text-[13px] text-[#1a1a4b] font-medium shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#6b6fc4]" />
                בית פיננסים וביטוח · מבית עמיתים הון
              </span>
            </motion.div>

            {/* Headline — Institutional premium voice */}
            <motion.h1
              className="font-extrabold leading-[1.02] tracking-tight"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] text-[#1a1a4b]">
                הדרך הנכונה
              </span>
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] text-[#1a1a4b]">
                לנהל את
              </span>
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] mt-2">
                <span className="relative inline-block">
                  <span
                    className="bg-gradient-to-l from-[#d6157e] via-[#f06ba8] to-[#d6157e] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift"
                  >
                    הכסף שלך.
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[6px] bg-[#6b6fc4] rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "right" }}
                  />
                </span>
              </span>
            </motion.h1>

            {/* Subtitle — House voice, institutional premium */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-[#1a1a4b]/70 leading-[1.75] max-w-xl font-normal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              בית פיננסים וביטוח עצמאי. צוות של סוכני ביטוח ויועצי פנסיה שסוקרים את התיק שלך, משווים מול 12 חברות מובילות, וממליצים על הצעד הבא.
              <br />
              <span className="text-[#1a1a4b] font-semibold">פגישת הייעוץ הראשונה על חשבוננו.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4 pt-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/contact" className="w-full sm:w-auto group">
                <Button
                  className="bg-[#1a1a4b] text-white hover:bg-[#232159] rounded-full px-10 py-6 text-base font-bold shadow-xl shadow-[#1a1a4b]/20 hover:shadow-2xl hover:shadow-[#1a1a4b]/30 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto min-h-[60px] group-hover:scale-[1.02]"
                >
                  קביעת פגישת ייעוץ
                  <ArrowDownLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto group"
              >
                <Button
                  variant="ghost"
                  className="text-[#1a1a4b] hover:bg-[#1a1a4b]/5 hover:text-[#1a1a4b] rounded-full px-8 py-6 text-base font-semibold w-full sm:w-auto min-h-[60px] flex items-center gap-2.5 border border-[#1a1a4b]/15 hover:border-[#1a1a4b]/25 transition-all duration-300"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]"></span>
                  </span>
                  שיחה עם יועץ
                </Button>
              </a>
            </motion.div>

            {/* Quick trust indicators */}
            <motion.div
              className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {[
                "ייעוץ עצמאי ובלתי תלוי",
                "דוח מקצועי תוך 48 שעות",
                "פגישה ראשונה ללא עלות",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#d6157e]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-[#1a1a4b]/60 font-medium">
                    {text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Left side — Visual composition */}
          <motion.div
            className="hidden sm:flex relative items-center justify-center lg:justify-start"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-[320px] h-[340px] sm:w-[420px] sm:h-[440px] lg:w-[520px] lg:h-[540px]">
              {/* Big circle — main */}
              <motion.div
                className="absolute top-[25%] right-[8%] w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #f7a3c8 0%, #d6157e 100%)",
                  boxShadow:
                    "0 20px 40px -10px rgba(26, 143, 125, 0.45), inset 0 -8px 16px rgba(0,0,0,0.08)",
                  ...(isDesktop ? { y: y1 } : {}),
                }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 180, damping: 15 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

              {/* Coral circle */}
              <motion.div
                className="absolute top-[22%] right-[36%] w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] rounded-full shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #f28e6f 0%, #3b3f99 100%)",
                  boxShadow:
                    "0 15px 30px -8px rgba(231, 111, 81, 0.4), inset 0 -6px 12px rgba(0,0,0,0.08)",
                  ...(isDesktop ? { y: y2 } : {}),
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.65, type: "spring", stiffness: 180, damping: 15 }}
              />

              {/* Orange circle */}
              <motion.div
                className="absolute top-[10%] right-[56%] w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #f6b581 0%, #6b6fc4 100%)",
                  boxShadow:
                    "0 15px 30px -8px rgba(244, 162, 97, 0.4), inset 0 -6px 12px rgba(0,0,0,0.08)",
                  ...(isDesktop ? { y: y3 } : {}),
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 180, damping: 15 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  className="w-11 h-11 sm:w-14 sm:h-14 drop-shadow-md"
                >
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

              {/* Green circle */}
              <motion.div
                className="absolute top-[18%] right-[78%] w-[90px] h-[90px] sm:w-[115px] sm:h-[115px] rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #a8d57e 0%, #7fb05e 100%)",
                  boxShadow:
                    "0 15px 30px -8px rgba(144, 190, 109, 0.4), inset 0 -6px 12px rgba(0,0,0,0.08)",
                  ...(isDesktop ? { y: y4 } : {}),
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.95, type: "spring", stiffness: 180, damping: 15 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.8"
                  className="w-9 h-9 sm:w-12 sm:h-12 drop-shadow-md"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

              {/* Floating savings card — NEW sophisticated element */}
              <motion.div
                className="absolute bottom-[4%] right-[8%] bg-white rounded-2xl p-5 shadow-2xl border border-[#1a1a4b]/[0.06] min-w-[240px]"
                style={{
                  boxShadow:
                    "0 25px 50px -12px rgba(10, 61, 61, 0.18), 0 0 0 1px rgba(10, 61, 61, 0.03)",
                  ...(isDesktop ? { y: yCard } : {}),
                }}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#d6157e] animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider text-[#1a1a4b]/50 font-semibold">
                    חיסכון שזוהה השבוע
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-[#1a1a4b] tabular-nums">
                    ₪4,280
                  </span>
                  <span className="text-sm text-[#1a1a4b]/60">בשנה</span>
                </div>
                <div className="text-xs text-[#1a1a4b]/55">
                  תיק לקוח קיים · ללא שינוי בכיסוי
                </div>
                {/* Animated bar */}
                <div className="mt-3 h-1 bg-[#1a1a4b]/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-l from-[#d6157e] to-[#f7a3c8] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ delay: 1.8, duration: 1.4, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Subtle sparkle dots */}
              <motion.div
                className="absolute top-[8%] right-[45%] w-2.5 h-2.5 rounded-full bg-[#6b6fc4]"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-[48%] right-[88%] w-2 h-2 rounded-full bg-[#f7a3c8]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
              />
              <motion.div
                className="absolute top-[70%] right-[70%] w-1.5 h-1.5 rounded-full bg-[#3b3f99]"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: 1.5 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 sm:mt-24 pt-8 border-t border-[#1a1a4b]/[0.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4">
            {[
              { text: "רישיון מטעם", highlight: "רשות שוק ההון", dotColor: "#d6157e" },
              { text: "חברים ב", highlight: "לשכת סוכני הביטוח", dotColor: "#6b6fc4" },
              { text: "מבית", highlight: "עמיתים הון", dotColor: "#3b3f99" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + i * 0.1, duration: 0.5 }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                />
                <span className="text-sm text-[#1a1a4b]/55 font-medium">
                  {item.text}{" "}
                  {item.highlight && (
                    <span className="text-[#1a1a4b] font-bold">
                      {item.highlight}
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
