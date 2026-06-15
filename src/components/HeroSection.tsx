import { ArrowDownLeft, Sparkles, ShieldCheck, TrendingUp, Wallet, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  MotionValue,
} from "framer-motion";
import { useRef, useEffect, useState, ReactNode } from "react";

/* ── Count-up hook: eased integer/float counter ───────────────── */
const useCountUp = (
  target: number,
  { duration = 1600, decimals = 0, delay = 0 } = {}
) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startT = 0;
    const tick = (t: number) => {
      if (!startT) startT = t;
      const p = Math.min((t - startT) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const to = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(to);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return decimals ? val.toFixed(decimals) : Math.round(val);
};

/* ── Magnetic wrapper: child drifts toward the cursor ─────────── */
const Magnetic = ({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  /* Scroll parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const yVisual = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* Cursor tracking — normalized 0..1 across the section */
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 22, mass: 0.4 });

  const onMouseMove = (e: React.MouseEvent) => {
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  /* Derived transforms */
  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);
  const rotateY = useTransform(sx, [0, 1], [14, -14]);
  const rotateX = useTransform(sy, [0, 1], [-12, 12]);
  const sheen = useTransform(
    sx,
    (v) =>
      `radial-gradient(120px 200px at ${20 + v * 60}% 0%, rgba(255,255,255,0.9), transparent 60%)`
  );

  /* Parallax helper for floating chips */
  const px = (range: number): MotionValue<number> =>
    useTransform(sx, [0, 1], [range, -range]);
  const chipTopX = px(26);
  const chipCoinX = px(38);
  const chipReturnX = px(18);
  const ringX = px(30);

  /* Live counters */
  const growth = useCountUp(12.4, { decimals: 1, delay: 1100 });
  const savings = useCountUp(4280, { delay: 1500 });
  const goal = useCountUp(74, { delay: 1900 });

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative min-h-[90vh] sm:min-h-[100vh] flex items-center overflow-hidden"
      dir="rtl"
      style={{
        background:
          "radial-gradient(ellipse 90% 55% at 70% -5%, hsl(330 70% 97%) 0%, #ffffff 55%)",
      }}
    >
      {/* Cursor-tracking spotlight */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="hidden lg:block absolute w-[640px] h-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none blur-[90px] opacity-60"
          style={{
            left: glowX,
            top: glowY,
            background:
              "radial-gradient(circle, rgba(214,21,126,0.18) 0%, rgba(107,111,196,0.12) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Editorial grid lines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(26,26,75,0.035) 1px, transparent 1px)",
          backgroundSize: "min(20vw, 220px) 100%",
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-24 lg:py-28">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
          {/* ── Content (RTL) ───────────────────────────────── */}
          <motion.div className="space-y-7 lg:space-y-9" style={{ y: yContent }}>
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-[#1a1a4b]/10 text-[12.5px] text-[#1a1a4b] font-medium shadow-[0_2px_20px_-6px_rgba(26,26,75,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-[#d6157e]" />
                בית פיננסים וביטוח · מבית עמיתים הון
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-extrabold leading-[1.0] tracking-tight">
              {["הדרך הנכונה", "לנהל את"].map((line, i) => (
                <motion.span
                  key={line}
                  className="block text-[2.1rem] sm:text-5xl md:text-6xl lg:text-[5.2rem] text-[#1a1a4b] overflow-hidden"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                className="block text-[2.1rem] sm:text-5xl md:text-6xl lg:text-[5.2rem] mt-2"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.31, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-[#d6157e] via-[#f06ba8] to-[#d6157e] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift">
                    הכסף שלך.
                  </span>
                  <motion.span
                    className="absolute -bottom-2 right-0 left-0 h-[6px] rounded-full bg-gradient-to-l from-[#6b6fc4] to-[#d6157e]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "right" }}
                  />
                </span>
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg text-[#1a1a4b]/65 leading-[1.7] max-w-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              בית פיננסים וביטוח עצמאי. צוות של סוכני ביטוח ויועצי פנסיה שסוקרים את התיק שלך, משווים מול 12 חברות מובילות, וממליצים על הצעד הבא.
              <br />
              <span className="text-[#1a1a4b] font-semibold">
                פגישת הייעוץ הראשונה על חשבוננו.
              </span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4 pt-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <Magnetic className="w-full sm:w-auto" strength={0.4}>
                <Link to="/contact" className="block group">
                  <Button className="relative overflow-hidden bg-[#d6157e] text-white hover:bg-[#d6157e] rounded-full px-10 py-6 text-base font-bold shadow-[0_18px_40px_-12px_rgba(214,21,126,0.55)] hover:shadow-[0_22px_50px_-12px_rgba(214,21,126,0.65)] transition-shadow duration-300 w-full sm:w-auto min-h-[60px]">
                    <span className="relative z-10 flex items-center">
                      קביעת פגישת ייעוץ
                      <ArrowDownLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute inset-0 z-0 bg-gradient-to-l from-[#b31368] via-[#d6157e] to-[#f06ba8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
              </Magnetic>
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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
                  </span>
                  שיחה עם יועץ
                </Button>
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {[
                "ייעוץ עצמאי ובלתי תלוי",
                "דוח מקצועי תוך 48 שעות",
                "פגישה ראשונה ללא עלות",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#d6157e]" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-[#1a1a4b]/55 font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Visual: cursor-reactive finance scene ───────── */}
          <motion.div
            className="hidden sm:flex relative items-center justify-center lg:justify-start"
            style={{ y: yVisual, opacity: fade }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div
              className="relative w-[340px] h-[410px] sm:w-[440px] sm:h-[490px] lg:w-[540px] lg:h-[560px]"
              style={{ perspective: 1200 }}
            >
              {/* Backdrop blob */}
              <motion.div
                className="absolute inset-x-[4%] inset-y-[6%] rounded-[44%] blur-3xl opacity-70 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(56% 56% at 55% 42%, #f7a3c8 0%, #e6e8f5 55%, transparent 75%)",
                }}
                animate={reduced ? undefined : { scale: [1, 1.07, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Dotted grid */}
              <svg
                aria-hidden
                className="absolute top-[1%] right-[1%] w-24 h-24 text-[#6b6fc4]/40 pointer-events-none"
                viewBox="0 0 60 60"
                fill="currentColor"
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <circle key={i} cx={6 + (i % 5) * 12} cy={6 + Math.floor(i / 5) * 12} r="1.5" />
                ))}
              </svg>

              {/* Main dashboard card — 3D tilt toward cursor */}
              <motion.div
                className="absolute top-[14%] right-[10%] w-[294px] sm:w-[314px] rounded-[26px] bg-white/80 backdrop-blur-2xl p-5 border border-white/90"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow:
                    "0 40px 80px -24px rgba(26,26,75,0.35), 0 0 0 1px rgba(26,26,75,0.04)",
                }}
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 110, damping: 16 }}
              >
                {/* moving sheen */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-[26px] pointer-events-none opacity-50"
                  style={{ background: sheen }}
                />

                {/* Header */}
                <div className="relative flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d6157e] to-[#f06ba8] flex items-center justify-center shadow-lg shadow-[#d6157e]/30">
                      <Wallet className="w-[18px] h-[18px] text-white" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[10px] text-[#1a1a4b]/45 font-semibold uppercase tracking-wider">
                        סך התיק שלך
                      </p>
                      <p className="text-[13px] font-bold text-[#1a1a4b]">מנוהל ומסונכרן</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#16a34a]/10">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#16a34a]" />
                    </span>
                    <span className="text-[9px] font-bold text-[#16a34a] tracking-wide">LIVE</span>
                  </span>
                </div>

                {/* Big number */}
                <div className="relative flex items-baseline gap-2 mb-1">
                  <span className="text-[28px] font-extrabold text-[#1a1a4b] tabular-nums tracking-tight">
                    ₪1.24M
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-[#16a34a] tabular-nums">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {growth}%
                  </span>
                </div>
                <p className="relative text-[11px] text-[#1a1a4b]/50 mb-3">
                  צמיחה שנתית · נכון להיום
                </p>

                {/* Chart */}
                <svg viewBox="0 0 260 92" className="relative w-full h-[88px]" fill="none">
                  <defs>
                    <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d6157e" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#d6157e" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6b6fc4" />
                      <stop offset="55%" stopColor="#d6157e" />
                      <stop offset="100%" stopColor="#f06ba8" />
                    </linearGradient>
                  </defs>
                  {[20, 46, 72].map((gy) => (
                    <line key={gy} x1="0" y1={gy} x2="260" y2={gy} stroke="#1a1a4b" strokeOpacity="0.05" strokeWidth="1" />
                  ))}
                  <motion.path
                    d="M0,66 C26,60 46,70 72,52 C98,34 122,46 150,30 C178,15 210,26 236,13 L258,7 L258,92 L0,92 Z"
                    fill="url(#heroFill)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                  />
                  <motion.path
                    d="M0,66 C26,60 46,70 72,52 C98,34 122,46 150,30 C178,15 210,26 236,13 L258,7"
                    stroke="url(#heroLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.9, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.circle
                    cx="258" cy="7" r="4.5" fill="#d6157e" stroke="#fff" strokeWidth="2.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.6, type: "spring", stiffness: 300 }}
                  />
                </svg>

                {/* Stat chips */}
                <div className="relative grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: "פנסיה", val: "₪720K", c: "#d6157e" },
                    { label: "חיסכון", val: "₪380K", c: "#6b6fc4" },
                    { label: "ביטוח", val: "פעיל", c: "#16a34a" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className="rounded-xl bg-[#f8f9fc]/80 px-2.5 py-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.7 + i * 0.12 }}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.c }} />
                        <span className="text-[9px] text-[#1a1a4b]/50 font-medium">{s.label}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#1a1a4b] tabular-nums">{s.val}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating chip — Insurance shield */}
              <motion.div
                className="absolute top-[3%] right-[4%]"
                style={{ x: chipTopX }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200, damping: 14 }}
              >
                <motion.div
                  className="flex items-center gap-2.5 rounded-2xl bg-white/85 backdrop-blur-md px-3.5 py-2.5 border border-white shadow-xl"
                  style={{ boxShadow: "0 18px 36px -12px rgba(26,26,75,0.25)" }}
                  animate={reduced ? undefined : { y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b3f99] to-[#6b6fc4] flex items-center justify-center">
                    <ShieldCheck className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-[#1a1a4b]/50 font-medium">כיסוי ביטוחי</p>
                    <p className="text-[13px] font-extrabold text-[#1a1a4b]">מלא ומעודכן</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating chip — Coins */}
              <motion.div
                className="absolute top-[40%] right-[82%] sm:right-[84%]"
                style={{ x: chipCoinX }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 14 }}
              >
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#d6157e] to-[#f06ba8] flex items-center justify-center shadow-xl"
                  style={{ boxShadow: "0 18px 36px -10px rgba(214,21,126,0.5)" }}
                  animate={reduced ? undefined : { y: [0, 12, 0], rotate: [0, -7, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </motion.div>
              </motion.div>

              {/* Floating pill — Returns */}
              <motion.div
                className="absolute bottom-[6%] right-[15%]"
                style={{ x: chipReturnX }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="flex items-center gap-2.5 rounded-2xl bg-[#1a1a4b] px-4 py-3 shadow-2xl"
                  style={{ boxShadow: "0 22px 44px -12px rgba(26,26,75,0.45)" }}
                  animate={reduced ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#16a34a]/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-white/55 font-medium">חיסכון שזוהה</p>
                    <p className="text-[15px] font-extrabold text-white tabular-nums">
                      ₪{Number(savings).toLocaleString()}
                      <span className="text-[10px] font-medium text-white/50"> / שנה</span>
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Progress ring */}
              <motion.div
                className="absolute bottom-[20%] right-[74%] sm:right-[78%]"
                style={{ x: ringX }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7, type: "spring", stiffness: 180, damping: 15 }}
              >
                <div
                  className="relative w-[78px] h-[78px] rounded-full bg-white/85 backdrop-blur-md shadow-xl flex items-center justify-center"
                  style={{ boxShadow: "0 16px 32px -10px rgba(26,26,75,0.25)" }}
                >
                  <svg viewBox="0 0 56 56" className="w-[60px] h-[60px] -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="#eef0f6" strokeWidth="7" fill="none" />
                    <motion.circle
                      cx="28" cy="28" r="22" stroke="#d6157e" strokeWidth="7" fill="none" strokeLinecap="round"
                      strokeDasharray="138"
                      initial={{ strokeDashoffset: 138 }}
                      animate={{ strokeDashoffset: 35 }}
                      transition={{ delay: 1.9, duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[15px] font-extrabold text-[#1a1a4b] leading-none tabular-nums">
                      {goal}%
                    </span>
                    <span className="text-[8px] text-[#1a1a4b]/50 font-medium mt-0.5">יעד</span>
                  </div>
                </div>
              </motion.div>

              {/* Sparkles */}
              {!reduced &&
                [
                  { t: "12%", r: "52%", s: 2.5, c: "#6b6fc4", d: 0 },
                  { t: "58%", r: "4%", s: 2, c: "#f7a3c8", d: 0.8 },
                  { t: "82%", r: "88%", s: 1.5, c: "#d6157e", d: 1.4 },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ top: p.t, right: p.r, width: p.s * 4, height: p.s * 4, backgroundColor: p.c }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.6 + i * 0.3, repeat: Infinity, delay: p.d }}
                  />
                ))}
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 sm:mt-20 pt-8 border-t border-[#1a1a4b]/[0.08]"
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.dotColor }} />
                <span className="text-sm text-[#1a1a4b]/55 font-medium">
                  {item.text}{" "}
                  <span className="text-[#1a1a4b] font-bold">{item.highlight}</span>
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
