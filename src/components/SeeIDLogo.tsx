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
const BRONZE = "#6e6e6e";

// The intro plays once per full page load — client-side navigation stays quiet.
let introPlayed = false;

/**
 * The living period — the brand's full stop doubles as a status node.
 * One green ping on first load ("the house is monitoring"), and a quick
 * double-blink to green when you hover the logo. A literal wink.
 */
const LivingPeriod = ({ fontSizeClass }: { fontSizeClass: string }) => {
  const reduced = useReducedMotion();
  const playIntro = !reduced && !introPlayed;

  return (
    <span className={`relative inline-block ${fontSizeClass}`} aria-hidden="true">
      <span className="seeld-wink transition-colors duration-150 group-hover:text-[#15803d]" style={{ color: BRONZE }}>
        .
      </span>
      {/* one quiet ping on load */}
      {playIntro && (
        <motion.span
          className="absolute rounded-full pointer-events-none"
          style={{
            backgroundColor: CHIP_GREEN,
            width: "0.16em",
            height: "0.16em",
            left: "50%",
            bottom: "0.09em",
            translateX: "-50%",
          }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 3.4 }}
          transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
          onAnimationComplete={() => { introPlayed = true; }}
        />
      )}
    </span>
  );
};

const SeeIDLogo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const reduced = useReducedMotion();
  const sizes = {
    sm: { icon: 22, text: "text-base", sub: "text-[8px]", gap: "gap-2" },
    md: { icon: 28, text: "text-xl", sub: "text-[9px]", gap: "gap-2.5" },
    lg: { icon: 38, text: "text-3xl", sub: "text-[11px]", gap: "gap-3" },
  };
  const s = sizes[size];
  const drawIn = !reduced && !introPlayed;

  return (
    <Link to="/" className={`inline-flex items-center ${s.gap} group ${className}`}>
      {/* The mark: a droplet plotted like an engineering path, ending in its node */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 text-[#171717] dark:text-white transition-transform duration-500 group-hover:-translate-y-[1px]"
        aria-hidden="true"
      >
        <motion.path
          d="M16 4C16 4 7.5 14.2 7.5 21C7.5 25.7 11.3 29.5 16 29.5C20.7 29.5 24.5 25.7 24.5 21C24.5 14.2 16 4 16 4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          initial={drawIn ? { pathLength: 0 } : undefined}
          animate={drawIn ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
        {/* the core node — turns live on hover, with the period */}
        <motion.circle
          cx="16"
          cy="21"
          r="2.4"
          fill={BRONZE}
          className="transition-[fill] duration-150 group-hover:fill-[#15803d]"
          initial={drawIn ? { opacity: 0 } : undefined}
          animate={drawIn ? { opacity: 1 } : undefined}
          transition={{ duration: 0.15, delay: 0.5 }}
        />
      </svg>

      {/* Wordmark with the living full stop — the last word */}
      <div className="flex flex-col leading-none">
        <span
          dir="ltr"
          className={`${s.text} text-[#171717] dark:text-white`}
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: "0.01em" }}
        >
          SEELD
          <LivingPeriod fontSizeClass={s.text} />
        </span>
        <span className={`${s.sub} mt-1 text-[#6e6e6e] dark:text-white/60 font-medium tracking-[0.22em]`}>
          בית פיננסים פרטי
        </span>
      </div>
    </Link>
  );
};

export default SeeIDLogo;
