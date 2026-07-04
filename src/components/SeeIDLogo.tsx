import { Link } from "react-router-dom";

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

const SeeIDLogo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: { icon: 22, text: "text-base", sub: "text-[8px]", gap: "gap-2" },
    md: { icon: 28, text: "text-xl", sub: "text-[9px]", gap: "gap-2.5" },
    lg: { icon: 38, text: "text-3xl", sub: "text-[11px]", gap: "gap-3" },
  };
  const s = sizes[size];

  return (
    <Link to="/" className={`inline-flex items-center ${s.gap} group ${className}`}>
      {/* Quiet monochrome droplet — thin ink outline, bronze core */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 text-[#171717] dark:text-white transition-transform duration-500 group-hover:-translate-y-[1px]"
        aria-hidden="true"
      >
        <path
          d="M16 4C16 4 7.5 14.2 7.5 21C7.5 25.7 11.3 29.5 16 29.5C20.7 29.5 24.5 25.7 24.5 21C24.5 14.2 16 4 16 4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="21" r="2.4" fill={BRONZE} />
      </svg>

      {/* Serif wordmark with a bronze full stop — the last word */}
      <div className="flex flex-col leading-none">
        <span
          dir="ltr"
          className={`${s.text} text-[#171717] dark:text-white`}
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: "0.01em" }}
        >
          SEELD<span style={{ color: BRONZE }}>.</span>
        </span>
        <span className={`${s.sub} mt-1 text-[#171717]/45 dark:text-white/45 font-medium tracking-[0.22em]`}>
          בית פיננסים פרטי
        </span>
      </div>
    </Link>
  );
};

export default SeeIDLogo;
