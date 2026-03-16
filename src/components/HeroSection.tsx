import { ArrowDownLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden bg-gradient-to-bl from-[#0a3d3d] via-[#0d4a4a] to-[#041f1f]">
      {/* Animated mesh gradient blobs */}
      <motion.div
        className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(94,198,198,0.12)_0%,transparent_70%)] blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-30%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(94,198,198,0.08)_0%,transparent_70%)] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-2xl"
        animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Geometric grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(94,198,198,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(94,198,198,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glass-morphism noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-20 sm:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content - Right side in RTL */}
          <div className="space-y-8 lg:space-y-10">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/[0.08] text-xs sm:text-sm text-[#5ec6c6] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5ec6c6] animate-pulse" />
                חלק מבית עמיתים הון
              </span>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            >
              הביטחון הפיננסי
              <br />
              שלך מתחיל{" "}
              <span className="relative">
                <span className="text-[#5ec6c6]">כאן</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#5ec6c6]/40 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "right" }}
                />
              </span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg md:text-xl text-white/50 leading-relaxed max-w-xl font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            >
              SEELD — חלק מבית עמיתים הון | שירות אישי, מקצועי, בגובה העיניים
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="bg-white text-[#0a3d3d] hover:bg-white/90 rounded-xl px-8 py-4 text-sm font-bold transition-all shadow-xl shadow-black/20 w-full sm:w-auto min-h-[48px] hover:shadow-2xl hover:shadow-[#5ec6c6]/10">
                  קבלו הצעה מותאמת
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
              <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8 py-4 text-sm font-semibold transition-all bg-white/[0.04] backdrop-blur-md w-full sm:w-auto min-h-[48px]">
                  <Phone className="w-4 h-4 ml-2" />
                  דברו איתנו
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Illustration - Left side in RTL */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute w-[420px] h-[420px] rounded-full border border-[#5ec6c6]/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute w-[350px] h-[350px] rounded-full border border-[#5ec6c6]/5"
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            />

            <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[500px] relative z-10">
              {/* Glowing background circles */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ec6c6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#5ec6c6" stopOpacity="0.05"/>
                </linearGradient>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ec6c6" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#5ec6c6" stopOpacity="0.4"/>
                </linearGradient>
              </defs>

              <circle cx="250" cy="200" r="170" fill="rgba(94,198,198,0.04)" />
              <circle cx="250" cy="200" r="130" fill="rgba(94,198,198,0.03)" />

              {/* Shield with gradient */}
              <motion.path
                d="M250 55 L340 100 L340 205 C340 280 250 330 250 330 C250 330 160 280 160 205 L160 100 Z"
                fill="url(#shieldGrad)"
                stroke="#5ec6c6"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                filter="url(#glow)"
              />

              {/* Glass-morphism card inside shield */}
              <motion.rect
                x="195" y="130" width="110" height="120" rx="12"
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              />

              {/* Chart bars with glow */}
              <motion.rect x="210" y="200" width="18" height="35" rx="4" fill="url(#barGrad)" opacity="0.6"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.2, duration: 0.5 }} style={{ transformOrigin: "center bottom" }} />
              <motion.rect x="235" y="178" width="18" height="57" rx="4" fill="url(#barGrad)" opacity="0.8"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.35, duration: 0.5 }} style={{ transformOrigin: "center bottom" }} />
              <motion.rect x="260" y="155" width="18" height="80" rx="4" fill="url(#barGrad)" opacity="1"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.5, duration: 0.5 }} style={{ transformOrigin: "center bottom" }} />

              {/* Trend line with glow */}
              <motion.path
                d="M215 220 L242 195 L268 165"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              />
              <motion.circle cx="268" cy="165" r="4" fill="white" filter="url(#glow)"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, type: "spring" }} />

              {/* Floating glassmorphism orbs */}
              <motion.g animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                <circle cx="380" cy="95" r="22" fill="rgba(94,198,198,0.08)" stroke="rgba(94,198,198,0.15)" strokeWidth="1"/>
                <text x="380" y="101" textAnchor="middle" fill="#5ec6c6" fontSize="14" fontWeight="bold" opacity="0.7">%</text>
              </motion.g>

              <motion.g animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>
                <circle cx="120" cy="150" r="18" fill="rgba(94,198,198,0.06)" stroke="rgba(94,198,198,0.12)" strokeWidth="1"/>
                <text x="120" y="156" textAnchor="middle" fill="#5ec6c6" fontSize="16" fontWeight="bold" opacity="0.6">&#8362;</text>
              </motion.g>

              <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}>
                <circle cx="390" cy="290" r="14" fill="rgba(94,198,198,0.06)" stroke="rgba(94,198,198,0.1)" strokeWidth="1"/>
              </motion.g>

              {/* Checkmark badge */}
              <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, type: "spring" }}>
                <circle cx="350" cy="175" r="18" fill="#5ec6c6" opacity="0.9" filter="url(#glow)" />
                <path d="M341 175 L347 181 L360 168" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </motion.g>

              {/* Connected dots - data network feel */}
              <motion.g opacity="0.3" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 2, duration: 1 }}>
                <line x1="130" y1="280" x2="180" y2="310" stroke="#5ec6c6" strokeWidth="0.5"/>
                <line x1="180" y1="310" x2="250" y2="350" stroke="#5ec6c6" strokeWidth="0.5"/>
                <line x1="250" y1="350" x2="340" y2="320" stroke="#5ec6c6" strokeWidth="0.5"/>
                <circle cx="130" cy="280" r="3" fill="#5ec6c6" opacity="0.5"/>
                <circle cx="180" cy="310" r="2" fill="#5ec6c6" opacity="0.5"/>
                <circle cx="250" cy="350" r="3" fill="#5ec6c6" opacity="0.5"/>
                <circle cx="340" cy="320" r="2" fill="#5ec6c6" opacity="0.5"/>
              </motion.g>
            </svg>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 sm:mt-20 pt-8 border-t border-white/[0.06]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
            {[
              { text: "חלק מבית", highlight: "עמיתים הון" },
              { text: "סוכנות מבוססת ומפוקחת" },
              { text: "שירות בגובה העיניים" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <span className="hidden sm:block w-px h-4 bg-white/10" />}
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5ec6c6]/50" />
                  <span className="text-xs sm:text-sm text-white/40">
                    {item.text}{" "}
                    {item.highlight && <span className="text-[#5ec6c6] font-semibold">{item.highlight}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
