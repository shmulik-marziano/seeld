import { ArrowDownLeft, Sparkles, Bot, Scale } from "lucide-react";
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
  const yCard = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] sm:min-h-[100vh] flex items-center overflow-hidden"
      dir="rtl"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(168 38% 96%) 0%, #f8f9fc 60%)",
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
              <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#0a3d3d]/10 text-[13px] text-[#0a3d3d] font-medium shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#f4a261]" />
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
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] text-[#0a3d3d]">
                הדרך הנכונה
              </span>
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] text-[#0a3d3d]">
                לנהל את
              </span>
              <span className="block text-[2rem] sm:text-5xl md:text-6xl lg:text-[5rem] mt-2">
                <span className="relative inline-block">
                  <span
                    className="bg-gradient-to-l from-[#1a8f7d] via-[#5ec6c6] to-[#1a8f7d] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift"
                  >
                    הכסף שלך.
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[6px] bg-[#f4a261] rounded-full"
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
              className="text-base sm:text-lg md:text-xl text-[#0a3d3d]/70 leading-[1.75] max-w-xl font-normal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              בית פיננסים וביטוח עצמאי. צוות של סוכני ביטוח ויועצי פנסיה שסוקרים את התיק שלך, משווים מול 12 חברות מובילות, וממליצים על הצעד הבא.
              <br />
              <span className="text-[#0a3d3d] font-semibold">פגישת הייעוץ הראשונה על חשבוננו.</span>
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
                  className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-10 py-6 text-base font-bold shadow-xl shadow-[#0a3d3d]/20 hover:shadow-2xl hover:shadow-[#0a3d3d]/30 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto min-h-[60px] group-hover:scale-[1.02]"
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
                  className="text-[#0a3d3d] hover:bg-[#0a3d3d]/5 hover:text-[#0a3d3d] rounded-full px-8 py-6 text-base font-semibold w-full sm:w-auto min-h-[60px] flex items-center gap-2.5 border border-[#0a3d3d]/15 hover:border-[#0a3d3d]/25 transition-all duration-300"
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
                    className="w-4 h-4 text-[#1a8f7d]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-[#0a3d3d]/60 font-medium">
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
            <div className="relative w-[320px] h-[400px] sm:w-[440px] sm:h-[500px] lg:w-[540px] lg:h-[560px]">
              {/* Client portal preview — the real product */}
              <motion.div
                className="absolute top-0 right-0 left-[8%] sm:left-[12%] bg-white rounded-3xl border border-[#0a3d3d]/[0.06] overflow-hidden"
                style={{
                  boxShadow:
                    "0 30px 60px -15px rgba(10, 61, 61, 0.2), 0 0 0 1px rgba(10, 61, 61, 0.02)",
                  y: isDesktop ? y1 : 0,
                }}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Window chrome */}
                <div className="bg-[#0a3d3d] px-5 py-3 flex items-center justify-between">
                  <span className="text-white/60 text-xs font-medium">SEELD · האזור האישי שלי</span>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e76f51]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f4a261]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#90be6d]" />
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2.5">
                  {[
                    { label: "קרן פנסיה · מסלול מניות", status: "תקין ✓", color: "#1a8f7d" },
                    { label: "דמי ניהול מהצבירה", status: "0.18%", color: "#1a8f7d" },
                    { label: "ביטוח בריאות", status: "נמצא פער", color: "#f4a261" },
                    { label: "קרן השתלמות", status: "11.4%+ השנה", color: "#1a8f7d" },
                  ].map((row, i) => (
                    <motion.div
                      key={row.label}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.15, duration: 0.4 }}
                    >
                      <span className="text-xs sm:text-sm text-[#0a3d3d]/70 font-medium">{row.label}</span>
                      <span
                        className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: `${row.color}14`, color: row.color }}
                      >
                        {row.status}
                      </span>
                    </motion.div>
                  ))}
                  <motion.div
                    className="flex items-center gap-2 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1a8f7d] animate-pulse" />
                    <span className="text-[11px] text-[#0a3d3d]/45 font-medium">
                      התיק מנוהל ומעודכן · יועץ ייעודי זמין
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              {/* AI advisor chip */}
              <motion.div
                className="absolute top-[63%] right-[-2%] sm:right-[-4%] bg-white rounded-2xl px-4 py-3 shadow-xl border border-[#0a3d3d]/[0.06] flex items-center gap-3"
                style={{
                  boxShadow: "0 18px 36px -12px rgba(108, 99, 255, 0.25)",
                  y: isDesktop ? y2 : 0,
                }}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200, damping: 18 }}
              >
                <div className="w-10 h-10 rounded-full bg-[#6c63ff]/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#6c63ff]" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#0a3d3d]">יועץ SEELD AI</div>
                  <div className="text-[11px] text-[#0a3d3d]/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                    זמין 24/7
                  </div>
                </div>
              </motion.div>

              {/* Comparison chip */}
              <motion.div
                className="absolute top-[-4%] left-[2%] sm:left-[4%] bg-white rounded-2xl px-4 py-3 shadow-xl border border-[#0a3d3d]/[0.06] flex items-center gap-3"
                style={{
                  boxShadow: "0 18px 36px -12px rgba(244, 162, 97, 0.3)",
                  y: isDesktop ? y3 : 0,
                }}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.25, type: "spring", stiffness: 200, damping: 18 }}
              >
                <div className="w-10 h-10 rounded-full bg-[#f4a261]/15 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#e8862e]" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#0a3d3d]">השוואה בזמן אמת</div>
                  <div className="text-[11px] text-[#0a3d3d]/50">מול 12 חברות מובילות</div>
                </div>
              </motion.div>

              {/* Floating savings card */}
              <motion.div
                className="absolute bottom-[2%] left-[4%] sm:left-[8%] bg-white rounded-2xl p-5 shadow-2xl border border-[#0a3d3d]/[0.06] min-w-[240px]"
                style={{
                  boxShadow:
                    "0 25px 50px -12px rgba(10, 61, 61, 0.18), 0 0 0 1px rgba(10, 61, 61, 0.03)",
                  y: isDesktop ? yCard : 0,
                }}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#1a8f7d] animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider text-[#0a3d3d]/50 font-semibold">
                    חיסכון שזוהה השבוע
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-[#0a3d3d] tabular-nums">
                    ₪4,280
                  </span>
                  <span className="text-sm text-[#0a3d3d]/60">בשנה</span>
                </div>
                <div className="text-xs text-[#0a3d3d]/55">
                  תיק לקוח קיים · ללא שינוי בכיסוי
                </div>
                {/* Animated bar */}
                <div className="mt-3 h-1 bg-[#0a3d3d]/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-l from-[#1a8f7d] to-[#6dd9d5] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ delay: 1.8, duration: 1.4, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Subtle sparkle dots */}
              <motion.div
                className="absolute top-[42%] right-[92%] w-2 h-2 rounded-full bg-[#6dd9d5]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
              />
              <motion.div
                className="absolute top-[68%] right-[2%] w-2.5 h-2.5 rounded-full bg-[#f4a261]"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 sm:mt-24 pt-8 border-t border-[#0a3d3d]/[0.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4">
            {[
              { text: "רישיון מטעם", highlight: "רשות שוק ההון", dotColor: "#1a8f7d" },
              { text: "חברים ב", highlight: "לשכת סוכני הביטוח", dotColor: "#f4a261" },
              { text: "מבית", highlight: "עמיתים הון", dotColor: "#e76f51" },
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
                <span className="text-sm text-[#0a3d3d]/55 font-medium">
                  {item.text}{" "}
                  {item.highlight && (
                    <span className="text-[#0a3d3d] font-bold">
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
