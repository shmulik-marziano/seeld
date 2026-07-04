import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  INK, BODY, FAINT, LINE, MONO, CARD_SHADOW, RING,
  CHIP_ORANGE, CHIP_GREEN, CHIP_YELLOW,
} from "@/lib/brand";

// Snap motion: instant, decisive (STYLESEED.md)
const snap = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: "easeOut" as const },
});

const LiveChip = ({
  label, color, className, delay,
}: { label: string; color: string; className: string; delay: number }) => (
  <motion.span
    className={`absolute z-10 hidden sm:flex items-center px-3 py-1.5 rounded-full text-white text-[13px] font-medium whitespace-nowrap ${className}`}
    style={{ backgroundColor: color, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.18, delay, ease: "easeOut" }}
  >
    {label}
  </motion.span>
);

const HeroSection = () => {
  const reduced = useReducedMotion();
  const anim = (delay: number) => (reduced ? {} : snap(delay));

  return (
    <section className="bg-white overflow-hidden" dir="rtl">
      {/* Kicker + CTAs */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 sm:pt-16 lg:pt-20">
        <motion.h1
          {...anim(0)}
          className="text-[#171717] font-semibold leading-[1.25] tracking-[-0.02em]"
          style={{ fontSize: "clamp(26px, 3vw, 40px)" }}
        >
          כסף מסודר. ראש שקט.
        </motion.h1>
        <motion.p
          {...anim(0.05)}
          className="mt-4 text-base sm:text-lg text-[#4d4d4d] leading-[1.75] max-w-xl"
        >
          בית פיננסים פרטי לביטוח, פנסיה והשקעות. יועץ אחד שמכיר אותך,
          השוואה מול 12 חברות, ותמונה מלאה של התיק בתוך 48 שעות.
        </motion.p>
        <motion.div {...anim(0.1)} className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center h-12 px-7 rounded-md bg-[#171717] text-[#fafafa] text-[15px] font-medium hover:bg-[#0a0a0a] transition-colors duration-150"
          >
            בדיקת תיק ללא עלות
          </Link>
          <a
            href="https://wa.me/972523097444"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-white text-[#171717] text-[15px] font-medium hover:bg-[#fafafa] transition-colors duration-150"
            style={{ boxShadow: RING }}
          >
            שיחה עם יועץ
          </a>
        </motion.div>
      </div>

      {/* The signature: colossal wordmark with live chips */}
      <div className="relative mt-4 sm:mt-2" aria-hidden="true">
        <motion.div
          className="font-bold text-[#171717] text-center whitespace-nowrap select-none"
          style={{
            fontSize: "clamp(110px, 24.5vw, 360px)",
            lineHeight: 0.78,
            letterSpacing: "-0.045em",
            transform: "translateY(7%)",
          }}
          dir="ltr"
          initial={reduced ? undefined : { opacity: 0, y: 24 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
        >
          SEELD
        </motion.div>

        <LiveChip label="דנה · יועצת פנסיה" color={CHIP_ORANGE} className="top-[2%] right-[13%]" delay={0.4} />
        <LiveChip label="אבי · ביטוח" color={CHIP_GREEN} className="bottom-[14%] right-[38%]" delay={0.5} />
        <LiveChip label="התיק שלך · מנוטר" color={CHIP_YELLOW} className="top-[14%] left-[11%]" delay={0.6} />

        {/* Mini live statement */}
        <motion.div
          className="absolute -top-[6%] left-[23%] z-10 hidden lg:block bg-white rounded-lg px-4 py-3 min-w-[215px]"
          style={{ boxShadow: CARD_SHADOW }}
          initial={reduced ? undefined : { opacity: 0, y: 8 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.55, ease: "easeOut" }}
        >
          <div
            className="flex justify-between mb-2 text-[10px] tracking-[0.12em]"
            style={{ fontFamily: MONO, color: FAINT }}
          >
            <span>STATEMENT</span>
            <span style={{ color: INK }}>LIVE</span>
          </div>
          <div
            className="text-xl font-semibold text-left"
            style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", direction: "ltr", color: INK }}
          >
            ₪1,284,600
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: BODY }}>
            שווי תיק · ‎+11.4%‎ השנה
          </div>
        </motion.div>
      </div>

      {/* Base line */}
      <div className="relative bg-white -mt-1" style={{ boxShadow: `0 -1px 0 ${LINE}` }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row justify-between gap-2 text-sm" style={{ color: FAINT }}>
          <span>הפגישה הראשונה על חשבוננו. בלי התחייבות.</span>
          <span>מבית עמיתים הון · בפיקוח רשות שוק ההון</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
