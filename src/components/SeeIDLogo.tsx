import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CHIP_GREEN } from "@/lib/brand";

// Legacy brand-dot geometry — fills neutralized to the SEELD Mono greyscale
export const brandDots = [
  { cx: 17, cy: 8,  r: 3.2, fill: "#171717" },
  { cx: 26, cy: 4,  r: 4.0, fill: "#4d4d4d" },
  { cx: 35, cy: 8,  r: 3.2, fill: "#6e6e6e" },
  { cx: 12, cy: 17, r: 2.8, fill: "#a3a3a3" },
  { cx: 40, cy: 17, r: 2.8, fill: "#d4d4d4" },
] as const;

const SERIF = "'Heebo', sans-serif";

// The intro plays once per full page load — client-side navigation stays quiet.
let introPlayed = false;

/**
 * App-tile mark: an ink squircle holding the droplet in white line-work,
 * with the live green node — the one point of color the brand carries.
 * One quiet ping on first load; a double-blink wink on hover.
 */
const SeeIDLogo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const reduced = useReducedMotion();
  const sizes = {
    sm: { tile: 26, glyph: 17, text: "text-[13px]", track: "0.26em", sub: "text-[7.5px]", gap: "gap-2.5" },
    md: { tile: 36, glyph: 23, text: "text-[16px]", track: "0.3em", sub: "text-[9px]", gap: "gap-3" },
    lg: { tile: 48, glyph: 30, text: "text-[22px]", track: "0.34em", sub: "text-[11px]", gap: "gap-3.5" },
  };
  const s = sizes[size];
  const playIntro = !reduced && !introPlayed;

  return (
    <Link to="/" className={`inline-flex items-center ${s.gap} group ${className}`}>
      {/* The tile — an app icon, not an illustration */}
      <motion.div
        className="relative flex-shrink-0 flex items-center justify-center bg-[#171717] transition-transform duration-300 group-hover:-translate-y-[1.5px]"
        style={{
          width: s.tile,
          height: s.tile,
          borderRadius: s.tile * 0.28,
          boxShadow: "0 1px 2px rgba(0,0,0,.18), 0 4px 10px -4px rgba(0,0,0,.22)",
        }}
        initial={playIntro ? { opacity: 0, scale: 0.85 } : undefined}
        animate={playIntro ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-hidden="true"
      >
        <svg width={s.glyph} height={s.glyph} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M16 4C16 4 7.5 14.2 7.5 21C7.5 25.7 11.3 29.5 16 29.5C20.7 29.5 24.5 25.7 24.5 21C24.5 14.2 16 4 16 4Z"
            stroke="#fafafa"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={playIntro ? { pathLength: 0 } : undefined}
            animate={playIntro ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          />
          {/* the live node — the brand's one point of color */}
          <motion.circle
            className="seeld-wink"
            cx="16"
            cy="21"
            r="3"
            fill={CHIP_GREEN}
            initial={playIntro ? { opacity: 0 } : undefined}
            animate={playIntro ? { opacity: 1 } : undefined}
            transition={{ duration: 0.15, delay: 0.6 }}
            onAnimationComplete={() => { introPlayed = true; }}
          />
        </svg>
        {/* one quiet ping on load */}
        {playIntro && (
          <motion.span
            className="absolute rounded-full pointer-events-none"
            style={{
              backgroundColor: CHIP_GREEN,
              width: s.tile * 0.16,
              height: s.tile * 0.16,
              left: "50%",
              top: "62%",
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
          />
        )}
      </motion.div>

      {/* Spaced-caps wordmark + tagline */}
      <div className="flex flex-col leading-none">
        <span
          dir="ltr"
          className={`${s.text} text-[#171717] dark:text-white`}
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: s.track, marginInlineEnd: `-${s.track}` }}
        >
          SEELD
        </span>
        <span className={`${s.sub} mt-1.5 text-[#6e6e6e] dark:text-white/60 font-medium tracking-[0.2em]`}>
          בית פיננסים וביטוח
        </span>
      </div>
    </Link>
  );
};

export default SeeIDLogo;
