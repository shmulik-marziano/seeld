import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots } from "@/components/brand/Elements";
import { GREEN, MUTED, PASTEL_SAGE, PASTEL_SAND } from "@/lib/brand";

// Brand hero (kit p.04): ivory canvas, the journey illustration beside the
// headline, text and actions lead. Two bubbles at most, never behind text.

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
            <motion.div {...anim(0)}>
              <BrandDots className="mb-5" />
            </motion.div>
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

            <motion.div {...anim(0.12)} className="mt-9 flex flex-col sm:flex-row gap-3">
              <a href="#portfolio-review" className="btn-primary sm:min-w-[220px]">
                בדיקת תיק 360
              </a>
              <Link to="/contact" className="btn-secondary sm:min-w-[200px]">
                תיאום פגישה
              </Link>
            </motion.div>

            <motion.p {...anim(0.16)} className="mt-6 text-[15px]" style={{ color: MUTED }}>
              השיחה הראשונה ללא עלות וללא התחייבות. סוכן ברישיון, בפיקוח רשות שוק ההון.
            </motion.p>
          </div>

          {/* The journey illustration — full composition, never cropped */}
          <motion.div {...anim(0.1)} className="relative">
            <Illustration
              name="01-journey"
              priority
              sizes="(min-width: 1024px) 620px, 100vw"
              className="shadow-[0_16px_40px_-24px_rgba(0,61,48,0.35)]"
            />
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
