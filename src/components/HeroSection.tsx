import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { HeroComposition } from "@/components/brand/HeroComposition";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GREEN, MUTED, PASTEL_SAGE, PASTEL_SAND } from "@/lib/brand";

// Brand hero (design mock, 2026-09): ivory canvas, the circles-and-leaf
// composition with the three door cards beside the headline; text and the
// actions lead. Two bubbles at most, never behind text.

const snap = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: "easeOut" as const },
});

const HeroSection = () => {
  const reduced = useReducedMotion();
  const anim = (delay: number) => (reduced ? {} : snap(delay));

  return (
    <section dir="rtl" className="dna-page">
      <div className="dna-circles" aria-hidden="true">
        <div
          className="dna-circ hidden md:block"
          style={{ width: 360, height: 360, top: -160, left: -140, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
        />
        <div
          className="dna-circ hidden md:block"
          style={{ width: 180, height: 180, bottom: -60, left: "36%", backgroundColor: PASTEL_SAND, opacity: 0.7 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-brand px-5 sm:px-8 pt-10 sm:pt-16 pb-12 sm:pb-20">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1fr_1.05fr] items-center">
          {/* The argument */}
          <div>
            <motion.h1
              {...anim(0.04)}
              className="dna-display leading-[1.15]"
              style={{ fontSize: "clamp(32px, 4.6vw, 56px)" }}
            >
              הכסף, הנכסים והביטוח שלכם,
              <br />
              בתמונה ברורה.
            </motion.h1>
            <motion.p
              {...anim(0.08)}
              className="mt-6 text-[17px] sm:text-[18px] leading-[1.7] max-w-lg"
              style={{ color: MUTED }}
            >
              ממפים את התיק, מבינים את האפשרויות ומלווים את הביצוע.
              סוכנות ביטוח ופיננסים עצמאית שעובדת מול כל החברות, עם יועץ אחד שמכיר אתכם.
            </motion.p>

            <motion.div {...anim(0.12)} className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <a href="#portfolio-review" className="btn-primary sm:min-w-[220px]">
                בדיקת תיק 360
              </a>
              <Link to="/#process" className="link-rule text-[16px] self-start sm:self-auto">
                איך זה עובד
                <BrandIcon name="arrow-left" size={18} />
              </Link>
            </motion.div>

            <motion.p {...anim(0.16)} className="mt-6 text-[15px]" style={{ color: MUTED }}>
              השיחה הראשונה ללא עלות וללא התחייבות. סוכן ברישיון, בפיקוח רשות שוק ההון.
            </motion.p>
          </div>

          {/* The opening art: circles, the leaf and the three door cards */}
          <motion.div {...anim(0.1)} className="relative">
            <HeroComposition />
          </motion.div>
        </div>

        {/* Base line under the hero */}
        <div className="mt-12 sm:mt-16 pt-5 border-t flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-[14px]" style={{ borderColor: "#CCD6CC", color: MUTED }}>
          <span style={{ color: GREEN }} className="font-bold">
            מיפוי התיק · פגישה והחלטות · ביצוע · מעקב ועדכון
          </span>
          <span>מבית עמיתים הון</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
