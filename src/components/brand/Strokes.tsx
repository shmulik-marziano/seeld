// Living strokes — scroll-driven line illustrations in the live palette.
// STYLESEED.md: color marks life (growth, progress, people) — never wallpaper.
import { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CHIP_GREEN, CHIP_ORANGE, LINE } from "@/lib/brand";
import { LiveDot } from "@/components/brand/Live";

/** A growth curve that draws itself when scrolled into view, ending in a live dot. */
export const DrawSpark = ({
  color = CHIP_GREEN,
  className = "",
  height = 64,
}: { color?: string; className?: string; height?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const show = reduced ? true : inView;

  // A believable portfolio line: drawdowns included.
  const d = "M2 54 L34 44 L66 48 L104 30 L138 36 L178 18 L218 24 L262 8";

  return (
    <div ref={ref} className={`relative ${className}`} dir="ltr" aria-hidden="true">
      <svg width="100%" height={height} viewBox="0 0 268 60" fill="none" preserveAspectRatio="none">
        <path d={d} stroke={LINE} strokeWidth="2" />
        <motion.path
          d={d}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: show ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
        />
      </svg>
      <motion.span
        className="absolute"
        style={{ top: `${(8 / 60) * 100}%`, left: "97%", transform: "translate(-50%, -50%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 1 : 0 }}
        transition={{ delay: reduced ? 0 : 1.0, duration: 0.2 }}
      >
        <LiveDot color={color} size={7} />
      </motion.span>
    </div>
  );
};

/** A hand-ruled underline that draws itself under a heading. */
export const DrawUnderline = ({
  color = CHIP_ORANGE,
  className = "",
}: { color?: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const show = reduced ? true : inView;

  return (
    <div ref={ref} className={className} dir="ltr" aria-hidden="true">
      <svg width="132" height="8" viewBox="0 0 132 8" fill="none">
        <motion.path
          d="M2 5.5 C 34 2.5, 66 6.5, 130 3.5"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: show ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.5, delay: 0.15, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
};

/**
 * Scroll-progress rail for a step list (RTL): a hairline that fills with color
 * as the reader moves through the steps. Wrap the list and pass its ref.
 */
export const ProgressRail = ({
  targetRef,
  color = CHIP_GREEN,
  className = "",
}: {
  targetRef: React.RefObject<HTMLElement>;
  color?: string;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 0.75", "end 0.55"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className={`absolute top-0 bottom-0 w-px ${className}`} style={{ backgroundColor: LINE }} aria-hidden="true">
      <motion.div
        className="absolute top-0 right-0 w-px origin-top"
        style={{ height: "100%", backgroundColor: color, scaleY: reduced ? 1 : scaleY }}
      />
    </div>
  );
};
