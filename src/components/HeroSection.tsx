import { ArrowDownLeft, Bot, Scale } from "lucide-react";
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

const INK = "#0b1114";
const ACCENT = "#14b8a6";
const ACCENT_BRIGHT = "#2dd4bf";

const heroMetrics = [
  { value: "600+", label: "משפחות בליווי" },
  { value: "12", label: "חברות בהשוואה" },
  { value: "48h", label: "לדוח תיק מלא" },
  { value: "₪0", label: "פגישה ראשונה" },
];

const portfolioRows = [
  { label: "קרן פנסיה · מסלול מניות", value: "+11.4%", ok: true },
  { label: "דמי ניהול מהצבירה", value: "0.18%", ok: true },
  { label: "ביטוח בריאות", value: "פער כיסוי", ok: false },
  { label: "קרן השתלמות · IRA", value: "מנוטר", ok: true },
];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 95]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white"
      dir="rtl"
    >
      {/* Engineering grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to left, rgba(11,17,20,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,17,20,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      {/* Accent glow */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[380px] pointer-events-none opacity-[0.10] blur-3xl"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse, ${ACCENT_BRIGHT} 0%, transparent 65%)`,
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 sm:pt-20 lg:pt-24 pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-12 items-center">
          {/* Right — content */}
          <div className="space-y-7 lg:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#0b1114]/10 bg-white/70 backdrop-blur text-[12px] font-semibold tracking-wide text-[#0b1114]/70">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                SEELD · בית פיננסים טכנולוגי · מבית עמיתים הון
              </span>
            </motion.div>

            <motion.h1
              className="font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0b1114]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
            >
              <span className="block text-[2.4rem] sm:text-6xl lg:text-[5.2rem]">
                ביטוח ופנסיה,
              </span>
              <span
                className="block text-[2.4rem] sm:text-6xl lg:text-[5.2rem] bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(105deg, ${INK} 0%, ${ACCENT} 55%, ${ACCENT_BRIGHT} 100%)`,
                }}
              >
                מהונדסים מחדש.
              </span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-[#0b1114]/60 leading-[1.8] max-w-xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
            >
              בנינו פלטפורמה טכנולוגית מלאה — השוואה בזמן אמת מול 12 חברות,
              פורטל לקוחות ויועץ AI — סביב הדבר האחד שלא משתנה:{" "}
              <span className="text-[#0b1114] font-semibold">
                יועץ אישי אחד שמכיר אותך ואחראי לתוצאה.
              </span>
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-3.5 pt-1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34 }}
            >
              <Link to="/contact" className="w-full sm:w-auto group">
                <Button className="bg-[#0b1114] text-white hover:bg-[#111a1f] rounded-xl px-9 py-6 text-base font-bold shadow-[0_12px_32px_-12px_rgba(11,17,20,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(20,184,166,0.35)] hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto min-h-[58px]">
                  בדיקת תיק ללא עלות
                  <ArrowDownLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="ghost"
                  className="text-[#0b1114] hover:bg-[#0b1114]/[0.04] hover:text-[#0b1114] rounded-xl px-8 py-6 text-base font-semibold w-full sm:w-auto min-h-[58px] flex items-center gap-2.5 border border-[#0b1114]/15 transition-all duration-300"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
                  </span>
                  שיחה עם יועץ
                </Button>
              </a>
            </motion.div>

            {/* Metrics strip */}
            <motion.div
              className="grid grid-cols-4 gap-0 pt-6 max-w-xl divide-x divide-[#0b1114]/[0.08]"
              style={{ direction: "rtl" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              {heroMetrics.map((m) => (
                <div key={m.label} className="px-3 first:pr-0 text-right">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#0b1114] tabular-nums tracking-tight">
                    {m.value}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#0b1114]/45 font-medium mt-0.5">
                    {m.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Left — terminal-style product visual */}
          <motion.div
            className="hidden sm:flex relative items-center justify-center lg:justify-start"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            <div className="relative w-[340px] h-[420px] sm:w-[460px] sm:h-[500px] lg:w-[560px] lg:h-[540px]">
              {/* Main dark dashboard */}
              <motion.div
                className="absolute top-0 right-0 left-[6%] sm:left-[10%] rounded-2xl overflow-hidden border border-white/[0.06]"
                style={{
                  backgroundColor: INK,
                  boxShadow:
                    "0 40px 80px -20px rgba(11,17,20,0.5), 0 0 60px -30px rgba(45,212,191,0.25)",
                  y: isDesktop ? y1 : 0,
                }}
                initial={{ opacity: 0, y: 36, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Chrome */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.07]">
                  <span className="text-white/50 text-[11px] font-medium tracking-wide">
                    SEELD OS · תיק משפחתי
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums" style={{ color: ACCENT_BRIGHT, backgroundColor: "rgba(45,212,191,0.10)" }}>
                      LIVE
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT_BRIGHT }} />
                  </div>
                </div>

                {/* Sparkline */}
                <div className="px-5 pt-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-white/40 text-[11px] font-medium">שווי תיק כולל</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: ACCENT_BRIGHT }}>+11.4% השנה</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-white text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight">₪1,284,600</span>
                  </div>
                  <svg viewBox="0 0 320 64" className="w-full h-14" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT_BRIGHT} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={ACCENT_BRIGHT} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M0,52 C30,48 45,40 70,42 C95,44 110,30 140,32 C170,34 185,22 215,24 C245,26 260,14 290,12 L320,8"
                      fill="none"
                      stroke={ACCENT_BRIGHT}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8, duration: 1.6, ease: "easeOut" }}
                    />
                    <path
                      d="M0,52 C30,48 45,40 70,42 C95,44 110,30 140,32 C170,34 185,22 215,24 C245,26 260,14 290,12 L320,8 L320,64 L0,64 Z"
                      fill="url(#sparkFill)"
                    />
                  </svg>
                </div>

                {/* Rows */}
                <div className="px-5 pb-5 pt-2 space-y-0.5">
                  {portfolioRows.map((row, i) => (
                    <motion.div
                      key={row.label}
                      className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.13, duration: 0.4 }}
                    >
                      <span className="text-white/60 text-xs sm:text-[13px]">{row.label}</span>
                      <span
                        className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md"
                        style={{
                          color: row.ok ? ACCENT_BRIGHT : "#fbbf24",
                          backgroundColor: row.ok ? "rgba(45,212,191,0.08)" : "rgba(251,191,36,0.08)",
                        }}
                      >
                        {row.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* AI chip */}
              <motion.div
                className="absolute bottom-[4%] right-[-2%] sm:right-[-4%] rounded-xl px-4 py-3 flex items-center gap-3 border border-white/[0.08] backdrop-blur-xl"
                style={{
                  backgroundColor: "rgba(11,17,20,0.92)",
                  boxShadow: "0 20px 40px -16px rgba(11,17,20,0.55)",
                  y: isDesktop ? y2 : 0,
                }}
                initial={{ opacity: 0, scale: 0.85, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.15, type: "spring", stiffness: 200, damping: 18 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(45,212,191,0.12)" }}>
                  <Bot className="w-4.5 h-4.5" style={{ color: ACCENT_BRIGHT }} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">יועץ SEELD AI</div>
                  <div className="text-[10px] text-white/40 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#25D366]" />
                    זמין 24/7
                  </div>
                </div>
              </motion.div>

              {/* Comparison chip */}
              <motion.div
                className="absolute top-[-3%] left-[0%] rounded-xl px-4 py-3 flex items-center gap-3 bg-white border border-[#0b1114]/[0.07]"
                style={{
                  boxShadow: "0 20px 44px -18px rgba(11,17,20,0.3)",
                  y: isDesktop ? y3 : 0,
                }}
                initial={{ opacity: 0, scale: 0.85, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 200, damping: 18 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0b1114]/[0.04]">
                  <Scale className="w-4.5 h-4.5 text-[#0b1114]" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0b1114]">השוואה בזמן אמת</div>
                  <div className="text-[10px] text-[#0b1114]/45 tabular-nums">12 חברות · עדכון רציף</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Regulatory bar */}
        <motion.div
          className="mt-14 sm:mt-20 pt-6 border-t border-[#0b1114]/[0.07] flex flex-wrap items-center justify-center gap-x-10 gap-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          {[
            "מורשים ומפוקחים · רשות שוק ההון",
            "חברים בלשכת סוכני הביטוח",
            "מבית עמיתים הון",
          ].map((text) => (
            <span key={text} className="text-[13px] text-[#0b1114]/40 font-medium">
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
